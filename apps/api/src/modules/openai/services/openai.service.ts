import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../../settings/settings.service';
import { PromptsService } from '../../prompts/prompts.service';
import {
  CostTrackingService,
  type TokenUsage,
} from '../../cost-tracking/cost-tracking.service';

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
  model: string;
  finishReason: string;
  usage: TokenUsage | null;
  costUsd: number;
  requestDurationMs: number;
}

const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

/**
 * The single OpenAI client for the application.
 *
 * There used to be two: this one, which recorded token usage and cost, and a
 * near-copy in modules/shared that recorded nothing. Auto-assessment - the
 * bulk path, and by far the larger consumer - used the silent one, so its
 * spend never reached the cost dashboard. Every call now goes through here
 * and every call is recorded.
 */
@Injectable()
export class OpenaiApiService {
  private client: OpenAI | null = null;
  private readonly logger = new Logger(OpenaiApiService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly promptsService: PromptsService,
    private readonly costTrackingService: CostTrackingService,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const client = await this.getClient();
    const model =
      request.model ?? (await this.settingsService.getOpenAIDefaultModel());

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const startedAt = Date.now();
    const completion = await this.callWithRetry(() =>
      client.chat.completions.create({
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

    const usage: TokenUsage | null = completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        }
      : null;

    const costUsd = usage
      ? await this.recordUsage(request, completion.model ?? model, usage, {
          requestDurationMs,
          promptLength: request.prompt.length,
          responseLength: content?.length ?? 0,
        })
      : 0;

    if (!content) {
      this.logger.warn(
        `Completion finished with reason "${finishReason}" and no content (model ${model}).`,
      );
    }

    return {
      content,
      model: completion.model ?? model,
      finishReason,
      usage,
      costUsd,
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

  private async recordUsage(
    request: CompletionRequest,
    model: string,
    usage: TokenUsage,
    metadata: Record<string, unknown>,
  ): Promise<number> {
    const cost = this.costTrackingService.calculateCost('openai', model, usage);

    try {
      await this.costTrackingService.trackApiUsage({
        taskId: request.taskId,
        userId: request.userId,
        operationType: request.operationType ?? 'chat_completion',
        provider: 'openai',
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        costUsd: cost.totalCost,
        requestDuration: metadata.requestDurationMs as number,
        metadata,
      });
    } catch (error) {
      // A bookkeeping failure must not discard a completion the account has
      // already been billed for.
      this.logger.error(
        `Failed to record API usage for model ${model}: ${(error as Error).message}`,
      );
    }

    return cost.totalCost;
  }

  private async getClient(): Promise<OpenAI> {
    if (this.client) {
      return this.client;
    }

    const apiKey = await this.settingsService.getOpenAIApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OpenAI API key is not configured. Set it in the application settings.',
      );
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  /** Drops the cached client so a rotated key is picked up on the next call. */
  resetClient(): void {
    this.client = null;
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
          `OpenAI request failed with status ${status}; retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_ATTEMPTS}).`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError;
  }
}
