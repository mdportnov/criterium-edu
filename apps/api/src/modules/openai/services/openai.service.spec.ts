import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { OpenaiApiService } from './openai.service';
import type { SettingsService } from '../../settings/settings.service';
import type { PromptsService } from '../../prompts/prompts.service';
import type { CostTrackingService } from '../../cost-tracking/cost-tracking.service';

const completion = (overrides: Record<string, unknown> = {}) => ({
  model: 'gpt-4o',
  choices: [{ message: { content: '{"ok":true}' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  ...overrides,
});

describe('OpenaiApiService', () => {
  let settingsService: SettingsService;
  let promptsService: PromptsService;
  let costTrackingService: CostTrackingService;
  let create: ReturnType<typeof vi.fn>;

  const buildService = () => {
    const service = new OpenaiApiService(
      settingsService,
      promptsService,
      costTrackingService,
    );
    // Stand in for the real client so no HTTP happens. clientKey has to match
    // what getOpenAIApiKey returns, or the service rebuilds the real client.
    Object.assign(service as unknown as Record<string, unknown>, {
      client: { chat: { completions: { create } } },
      clientKey: 'sk-test',
    });
    return service;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    create = vi.fn().mockResolvedValue(completion());
    settingsService = {
      getOpenAIApiKey: vi.fn().mockResolvedValue('sk-test'),
      getOpenAIDefaultModel: vi.fn().mockResolvedValue('gpt-4o'),
    } as unknown as SettingsService;
    promptsService = {
      getPromptContent: vi.fn().mockResolvedValue('rendered prompt'),
    } as unknown as PromptsService;
    costTrackingService = {
      calculateCost: vi.fn().mockReturnValue({
        promptCost: 0.0005,
        completionCost: 0.00075,
        totalCost: 0.00125,
      }),
      trackApiUsage: vi.fn().mockResolvedValue({}),
    } as unknown as CostTrackingService;
  });

  it('returns the message content, not the transport envelope', async () => {
    const result = await buildService().complete({ prompt: 'hello' });

    expect(result.content).toBe('{"ok":true}');
    expect(result.finishReason).toBe('stop');
    expect(result.usage).toEqual({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    });
  });

  // The whole point of collapsing the two clients: nothing reaches OpenAI
  // without being recorded.
  it('records every completion against the cost ledger', async () => {
    const result = await buildService().complete({
      prompt: 'hello',
      taskId: 'task-1',
      userId: 'user-1',
      operationType: 'auto_assessment',
    });

    expect(costTrackingService.trackApiUsage).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(costTrackingService.trackApiUsage).mock.calls[0][0],
    ).toMatchObject({
      taskId: 'task-1',
      userId: 'user-1',
      operationType: 'auto_assessment',
      provider: 'openai',
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      costUsd: 0.00125,
    });
    expect(result.costUsd).toBe(0.00125);
  });

  it('bills against the model the API reports, not the one requested', async () => {
    create.mockResolvedValue(completion({ model: 'gpt-4o-2024-11-20' }));

    await buildService().complete({ prompt: 'hello', model: 'gpt-4o' });

    expect(vi.mocked(costTrackingService.calculateCost).mock.calls[0][1]).toBe(
      'gpt-4o-2024-11-20',
    );
  });

  it('falls back to the configured default model', async () => {
    await buildService().complete({ prompt: 'hello' });

    expect(settingsService.getOpenAIDefaultModel).toHaveBeenCalled();
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

  it('still returns the completion when the ledger write fails', async () => {
    vi.mocked(costTrackingService.trackApiUsage).mockRejectedValue(
      new Error('database is down'),
    );

    const result = await buildService().complete({ prompt: 'hello' });

    expect(result.content).toBe('{"ok":true}');
  });

  it('reports a missing API key as unavailable rather than crashing', async () => {
    vi.mocked(settingsService.getOpenAIApiKey).mockResolvedValue(null);
    const service = new OpenaiApiService(
      settingsService,
      promptsService,
      costTrackingService,
    );

    await expect(service.complete({ prompt: 'hello' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
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

    it('does not retry a request the server rejected on its merits', async () => {
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
    expect(
      vi.mocked(costTrackingService.trackApiUsage).mock.calls[0][0]
        .operationType,
    ).toBe('prompt_grade_solution');
  });
});
