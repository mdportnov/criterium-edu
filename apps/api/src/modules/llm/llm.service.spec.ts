import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmService } from './llm.service';
import { PROVIDERS, type LlmProvider } from './providers';
import { CostTrackingService } from '../cost-tracking/cost-tracking.service';
import type { SettingsService } from '../settings/settings.service';
import type { PromptsService } from '../prompts/prompts.service';
import type { Repository } from 'typeorm';
import type { ApiUsage } from '../cost-tracking/entities/api-usage.entity';

const completion = (overrides: Record<string, unknown> = {}) => ({
  model: 'gpt-4o',
  choices: [{ message: { content: '{"ok":true}' }, finish_reason: 'stop' }],
  usage: {
    prompt_tokens: 1_000_000,
    completion_tokens: 1_000_000,
    total_tokens: 2_000_000,
  },
  ...overrides,
});

describe('LlmService', () => {
  let settings: Record<string, string | null>;
  let settingsService: SettingsService;
  let promptsService: PromptsService;
  let costTrackingService: CostTrackingService;
  let create: ReturnType<typeof vi.fn>;
  let tracked: unknown[];

  const buildService = () => {
    const service = new LlmService(
      settingsService,
      promptsService,
      costTrackingService,
    );
    // Stand in for the transport so nothing leaves the process. The cache key
    // has to match what the settings return or the service rebuilds it.
    const provider = (settings.llm_provider ?? 'openai') as LlmProvider;
    Object.assign(service as unknown as Record<string, unknown>, {
      cached: {
        provider,
        apiKey: settings.llm_api_key,
        // Must match what resolveProvider computes, or it rebuilds a real
        // client and the test reaches the network.
        baseUrl: settings.llm_base_url ?? PROVIDERS[provider].baseUrl,
        defaultModel: settings.llm_model,
        client: { chat: { completions: { create } } },
      },
    });
    return service;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tracked = [];
    create = vi.fn().mockResolvedValue(completion());
    settings = {
      llm_provider: 'openai',
      llm_api_key: 'sk-test',
      llm_base_url: null,
      llm_model: 'gpt-4o',
      llm_pricing: null,
    };
    settingsService = {
      getLlmProvider: vi.fn(async () => settings.llm_provider),
      getLlmApiKey: vi.fn(async () => settings.llm_api_key),
      getLlmBaseUrl: vi.fn(async () => settings.llm_base_url),
      getLlmModel: vi.fn(async () => settings.llm_model),
      getLlmPricing: vi.fn(async () =>
        settings.llm_pricing ? JSON.parse(settings.llm_pricing) : {},
      ),
    } as unknown as SettingsService;
    promptsService = {
      getPromptContent: vi.fn().mockResolvedValue('rendered prompt'),
    } as unknown as PromptsService;
    // The real cost service, so the pricing maths is under test too.
    costTrackingService = new CostTrackingService({
      create: (input: unknown) => input,
      save: async (row: unknown) => {
        tracked.push(row);
        return row;
      },
    } as unknown as Repository<ApiUsage>);
  });

  it('returns the message content, not the transport envelope', async () => {
    const result = await buildService().complete({ prompt: 'hello' });

    expect(result.content).toBe('{"ok":true}');
    expect(result.finishReason).toBe('stop');
    expect(result.provider).toBe('openai');
  });

  // The point of collapsing the clients: nothing reaches a provider unrecorded.
  it('records every completion against the cost ledger', async () => {
    await buildService().complete({
      prompt: 'hello',
      taskId: 'task-1',
      userId: 'user-1',
      operationType: 'auto_assessment',
    });

    expect(tracked).toHaveLength(1);
    expect(tracked[0]).toMatchObject({
      taskId: 'task-1',
      userId: 'user-1',
      operationType: 'auto_assessment',
      provider: 'openai',
      model: 'gpt-4o',
      totalTokens: 2_000_000,
    });
  });

  it('prices a known model from the provider table', async () => {
    const result = await buildService().complete({ prompt: 'hello' });

    // gpt-4o is $5/M prompt and $15/M completion, one million of each.
    expect(result.costUsd).toBeCloseTo(20, 6);
    expect(result.costKnown).toBe(true);
  });

  // The old fallback invented $0.001/$0.002 per 1K for anything unknown, which
  // is indistinguishable from a real number in the cost report.
  it('reports an unknown model as zero cost and says the price is unknown', async () => {
    create.mockResolvedValue(completion({ model: 'some-new-model' }));

    const result = await buildService().complete({ prompt: 'hello' });

    expect(result.costUsd).toBe(0);
    expect(result.costKnown).toBe(false);
    expect(tracked[0]).toMatchObject({ model: 'some-new-model', costUsd: 0 });
  });

  it('uses an administrator price override, quoted per million tokens', async () => {
    settings.llm_provider = 'openrouter';
    settings.llm_model = 'deepseek/deepseek-chat';
    settings.llm_pricing = JSON.stringify({
      'deepseek/deepseek-chat': { prompt: 0.27, completion: 1.1 },
    });
    create.mockResolvedValue(completion({ model: 'deepseek/deepseek-chat' }));

    const result = await buildService().complete({ prompt: 'hello' });

    expect(result.costKnown).toBe(true);
    expect(result.costUsd).toBeCloseTo(1.37, 6);
    expect(result.provider).toBe('openrouter');
  });

  it('bills against the model the provider reports, not the one requested', async () => {
    create.mockResolvedValue(completion({ model: 'gpt-4o-mini' }));

    const result = await buildService().complete({
      prompt: 'hello',
      model: 'gpt-4o',
    });

    expect(result.model).toBe('gpt-4o-mini');
    expect(result.costUsd).toBeCloseTo(0.75, 6);
  });

  it('falls back to the configured default model', async () => {
    await buildService().complete({ prompt: 'hello' });
    expect(create.mock.calls[0][0].model).toBe('gpt-4o');
  });

  it('sends a system message only when one is given', async () => {
    const service = buildService();

    await service.complete({ prompt: 'hello' });
    expect(create.mock.calls[0][0].messages).toEqual([
      { role: 'user', content: 'hello' },
    ]);

    await service.complete({ prompt: 'hello', systemPrompt: 'be terse' });
    expect(create.mock.calls[1][0].messages).toEqual([
      { role: 'system', content: 'be terse' },
      { role: 'user', content: 'hello' },
    ]);
  });

  it('omits temperature and max_tokens rather than guessing defaults', async () => {
    await buildService().complete({ prompt: 'hello' });

    expect(create.mock.calls[0][0]).not.toHaveProperty('temperature');
    expect(create.mock.calls[0][0]).not.toHaveProperty('max_tokens');
  });

  describe('configuration', () => {
    it('reports a missing key as unavailable rather than crashing', async () => {
      settings.llm_api_key = null;
      const service = new LlmService(
        settingsService,
        promptsService,
        costTrackingService,
      );

      await expect(
        service.complete({ prompt: 'hello' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('insists on a base URL for a custom provider', async () => {
      settings.llm_provider = 'custom';
      settings.llm_base_url = null;
      const service = new LlmService(
        settingsService,
        promptsService,
        costTrackingService,
      );

      await expect(service.complete({ prompt: 'hello' })).rejects.toThrow(
        /llm_base_url/,
      );
    });

    it('describes where calls go without revealing the key', async () => {
      settings.llm_provider = 'deepseek';
      settings.llm_model = null;

      const described = await buildService().describeConfiguration();

      expect(described).toEqual({
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        configured: true,
      });
      expect(JSON.stringify(described)).not.toContain('sk-test');
    });

    it('treats an unrecognised provider setting as OpenAI', async () => {
      settings.llm_provider = 'nonsense';
      const service = new LlmService(
        settingsService,
        promptsService,
        costTrackingService,
      );

      const described = await service.describeConfiguration();

      expect(described.provider).toBe('openai');
      expect(described.baseUrl).toBe('https://api.openai.com/v1');
    });
  });

  describe('retries', () => {
    const apiError = (status: number) =>
      new OpenAI.APIError(status, undefined, 'boom', undefined);

    it('retries a rate-limited request and succeeds', async () => {
      create
        .mockRejectedValueOnce(apiError(429))
        .mockResolvedValueOnce(completion());

      const result = await buildService().complete({ prompt: 'hello' });

      expect(create).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('{"ok":true}');
    });

    it('gives up after three attempts', async () => {
      create.mockRejectedValue(apiError(503));

      await expect(
        buildService().complete({ prompt: 'hello' }),
      ).rejects.toBeInstanceOf(OpenAI.APIError);
      expect(create).toHaveBeenCalledTimes(3);
    });

    it('does not retry a request the provider rejected on its merits', async () => {
      create.mockRejectedValue(apiError(400));

      await expect(
        buildService().complete({ prompt: 'hello' }),
      ).rejects.toBeInstanceOf(OpenAI.APIError);
      expect(create).toHaveBeenCalledTimes(1);
    });
  });

  it('renders a stored prompt template and tags the operation with its key', async () => {
    await buildService().completeFromPrompt('grade_solution', {
      variables: { task: 'x' },
    });

    expect(promptsService.getPromptContent).toHaveBeenCalledWith(
      'grade_solution',
      'en',
      { task: 'x' },
    );
    expect(create.mock.calls[0][0].messages[0].content).toBe('rendered prompt');
    expect(tracked[0]).toMatchObject({
      operationType: 'prompt_grade_solution',
    });
  });
});
