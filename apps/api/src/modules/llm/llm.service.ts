import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../settings/settings.service';
import { PromptsService } from '../prompts/prompts.service';
import {
  CostTrackingService,
  type TokenUsage,
} from '../cost-tracking/cost-tracking.service';
import { PROVIDERS, isLlmProvider, type LlmProvider } from './providers';

export interface CompletionRequest {
  prompt: string;
  /** Defaults to the model configured in application settings. */
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  /** Cost attribution. Without these the spend lands in the system total only. */
  taskId?: string;
  userId?: string;
  operationType?: string;
}

export interface CompletionResult {
  content: string | null;
  provider: LlmProvider;
  model: string;
  finishReason: string;
  usage: TokenUsage | null;
  costUsd: number;
  /** False when no price is known for this model, so costUsd is 0 by ignorance. */
  costKnown: boolean;
  requestDurationMs: number;
}

interface ResolvedProvider {
  provider: LlmProvider;
  client: OpenAI;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
}

const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

/**
 * The application's language-model client.
 *
 * It is not tied to OpenAI. OpenAI, DeepSeek and OpenRouter all speak the same
 * chat-completions protocol, so the `openai` package is used as a protocol
 * client and the provider is a setting: base URL, key and model name. Adding
 * another OpenAI-compatible endpoint is an entry in providers.ts.
 *
 * Every call is recorded against the cost ledger. There used to be a second,
 * silent client and the bulk assessment path used it, so its spend never
 * reached the dashboard.
 */
@Injectable()
export class LlmService {
  private cached: ResolvedProvider | null = null;
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly promptsService: PromptsService,
    private readonly costTrackingService: CostTrackingService,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const resolved = await this.resolveProvider();
    const model = request.model || resolved.defaultModel;

    if (!model) {
      throw new ServiceUnavailableException(
        'No language model is configured. Set llm_model in the application settings.',
      );
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const startedAt = Date.now();
    const completion = await this.callWithRetry(() =>
      resolved.client.chat.completions.create({
        model,
        messages,
        ...(request.temperature === undefined
          ? {}
          : { temperature: request.temperature }),
        ...(request.maxTokens === undefined
          ? {}
          : { max_tokens: request.maxTokens }),
      }),
    );
    const requestDurationMs = Date.now() - startedAt;

    const content = completion.choices[0]?.message?.content ?? null;
    const finishReason = completion.choices[0]?.finish_reason ?? 'unknown';
    const billedModel = completion.model || model;

    const usage: TokenUsage | null = completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        }
      : null;

    let costUsd = 0;
    let costKnown = false;

    if (usage) {
      const recorded = await this.recordUsage(
        request,
        resolved.provider,
        billedModel,
        usage,
        {
          requestDurationMs,
          promptLength: request.prompt.length,
          responseLength: content?.length ?? 0,
        },
      );
      costUsd = recorded.costUsd;
      costKnown = recorded.costKnown;
    }

    if (!content) {
      this.logger.warn(
        `Completion finished with reason "${finishReason}" and no content (${resolved.provider}/${model}).`,
      );
    }

    return {
      content,
      provider: resolved.provider,
      model: billedModel,
      finishReason,
      usage,
      costUsd,
      costKnown,
      requestDurationMs,
    };
  }

  /** Runs a completion from a prompt template stored in the database. */
  async completeFromPrompt(
    promptKey: string,
    options: {
      variables?: Record<string, string>;
      languageCode?: string;
    } & Omit<CompletionRequest, 'prompt' | 'operationType'> = {},
  ): Promise<CompletionResult> {
    const { variables, languageCode = 'en', ...completionOptions } = options;
    const prompt = await this.promptsService.getPromptContent(
      promptKey,
      languageCode,
      variables,
    );

    return this.complete({
      ...completionOptions,
      prompt,
      operationType: `prompt_${promptKey}`,
    });
  }

  /** What the admin screen shows: where calls are going, without the key. */
  async describeConfiguration(): Promise<{
    provider: LlmProvider;
    baseUrl: string;
    model: string;
    configured: boolean;
  }> {
    const provider = await this.readProvider();
    const definition = PROVIDERS[provider];
    const [apiKey, baseUrl, model] = await Promise.all([
      this.settingsService.getLlmApiKey(),
      this.settingsService.getLlmBaseUrl(),
      this.settingsService.getLlmModel(),
    ]);

    return {
      provider,
      baseUrl: baseUrl || definition.baseUrl || 'https://api.openai.com/v1',
      model: model || definition.defaultModel,
      configured: Boolean(apiKey),
    };
  }

  private async recordUsage(
    request: CompletionRequest,
    provider: LlmProvider,
    model: string,
    usage: TokenUsage,
    metadata: Record<string, unknown>,
  ): Promise<{ costUsd: number; costKnown: boolean }> {
    const overrides = await this.settingsService.getLlmPricing();
    const cost = this.costTrackingService.calculateCost(
      provider,
      model,
      usage,
      overrides,
    );

    try {
      await this.costTrackingService.trackApiUsage({
        taskId: request.taskId,
        userId: request.userId,
        operationType: request.operationType ?? 'chat_completion',
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        costUsd: cost.totalCost,
        requestDuration: metadata.requestDurationMs as number,
        metadata: { ...metadata, costKnown: cost.known },
      });
    } catch (error) {
      // A bookkeeping failure must not discard a completion the account has
      // already been billed for.
      this.logger.error(
        `Failed to record API usage for ${provider}/${model}: ${(error as Error).message}`,
      );
    }

    if (!cost.known) {
      this.logger.warn(
        `No price is configured for ${provider}/${model}; ${usage.totalTokens} tokens recorded at zero cost. Set llm_pricing to fix the report.`,
      );
    }

    return { costUsd: cost.totalCost, costKnown: cost.known };
  }

  private async readProvider(): Promise<LlmProvider> {
    const configured = await this.settingsService.getLlmProvider();
    return configured && isLlmProvider(configured) ? configured : 'openai';
  }

  /**
   * The client is cached against the provider, key and base URL it was built
   * with, so changing any of them in the admin screen takes effect on the next
   * call rather than at the next process restart.
   */
  private async resolveProvider(): Promise<ResolvedProvider> {
    const provider = await this.readProvider();
    const definition = PROVIDERS[provider];

    const [apiKey, baseUrlSetting, modelSetting] = await Promise.all([
      this.settingsService.getLlmApiKey(),
      this.settingsService.getLlmBaseUrl(),
      this.settingsService.getLlmModel(),
    ]);

    if (!apiKey) {
      throw new ServiceUnavailableException(
        `No API key is configured for ${definition.label}. Set llm_api_key in the application settings.`,
      );
    }

    const baseUrl = baseUrlSetting || definition.baseUrl;

    if (provider === 'custom' && !baseUrl) {
      throw new ServiceUnavailableException(
        'The custom provider needs llm_base_url to be set.',
      );
    }

    if (
      this.cached &&
      this.cached.provider === provider &&
      this.cached.apiKey === apiKey &&
      this.cached.baseUrl === baseUrl
    ) {
      return {
        ...this.cached,
        defaultModel: modelSetting || definition.defaultModel,
      };
    }

    this.cached = {
      provider,
      apiKey,
      baseUrl,
      defaultModel: modelSetting || definition.defaultModel,
      client: new OpenAI({
        apiKey,
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      }),
    };

    this.logger.log(
      `Language model calls go to ${definition.label}${baseUrl ? ` (${baseUrl})` : ''}.`,
    );

    return this.cached;
  }

  private async callWithRetry<T>(call: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await call();
      } catch (error) {
        lastError = error;
        const status =
          error instanceof OpenAI.APIError ? error.status : undefined;

        if (
          attempt === MAX_ATTEMPTS ||
          status === undefined ||
          !RETRYABLE_STATUS.has(status)
        ) {
          throw error;
        }

        const backoffMs = 500 * 2 ** (attempt - 1);
        this.logger.warn(
          `Provider request failed with status ${status}; retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_ATTEMPTS}).`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError;
  }
}
