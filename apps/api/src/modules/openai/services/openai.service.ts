import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../../settings/settings.service';
import { PromptsService } from '../../prompts/prompts.service';

@Injectable()
export class OpenaiApiService implements OnModuleInit {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenaiApiService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly promptsService: PromptsService,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'OpenAI service initialized. API key will be checked when service is used.',
    );
  }

  /**
   * Gets a chat completion from the OpenAI API.
   * @param prompt The user prompt to send to the model.
   * @param model The model to use for the completion (e.g., 'gpt-3.5-turbo', 'gpt-4').
   * @returns The content of the chat completion or null if not available.
   * @throws Error if the OpenAI client is not initialized or if the API call fails.
   */
  async getChatCompletion(
    prompt: string,
    model: string = 'gpt-3.5-turbo',
  ): Promise<string | null> {
    if (!this.openai) {
      const apiKey = await this.settingsService.getOpenAIApiKey();
      if (!apiKey) {
        this.logger.error(
          'OpenAI API key is not configured. Please set it in the application settings.',
        );
        throw new Error('OpenAI API key is not configured.');
      }
      try {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
        this.logger.log('OpenAI client initialized successfully.');
      } catch (error) {
        this.logger.error('Failed to initialize OpenAI client:', error);
        throw error;
      }
    }

    this.logger.debug(
      `Requesting chat completion with model: ${model}, prompt: "${prompt.substring(0, 100)}..."`,
    );

    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        // temperature: 0.7, // Example: Adjust creativity. Higher values mean more random.
        // max_tokens: 150,  // Example: Limit response length.
      });

      const content = completion.choices[0]?.message?.content ?? null;
      if (content) {
        this.logger.debug(
          `Received chat completion: "${content.substring(0, 100)}..."`,
        );
      } else {
        this.logger.warn('Chat completion response did not contain content.');
      }
      // Log token usage if available and needed
      if (completion.usage) {
        this.logger.log(
          `OpenAI API usage: ${JSON.stringify(completion.usage)}`,
        );
      }

      return content;
    } catch (error) {
      this.logger.error(
        `Error getting chat completion from OpenAI (model: ${model}):`,
        error.message,
      );
      // TODO: Implement more sophisticated error handling as per Subtask 6.1 (e.g., retry logic for rate limits/transient errors)
      // For now, re-throwing the original error or a more specific one.
      // Consider checking error.status or error.code for specific OpenAI error types.
      if (error instanceof OpenAI.APIError) {
        // Handle specific OpenAI API errors
        // e.g., error.status, error.headers, error.error
      }
      throw error;
    }
  }

  /**
   * Gets a chat completion using a prompt from the database.
   * @param promptKey The key of the prompt to use from the database.
   * @param variables Variables to interpolate into the prompt template.
   * @param languageCode Language code for the prompt (defaults to 'en').
   * @param model The model to use for the completion.
   * @returns The content of the chat completion or null if not available.
   */
  async getChatCompletionWithPrompt(
    promptKey: string,
    variables?: Record<string, string>,
    languageCode: string = 'en',
    model: string = 'gpt-3.5-turbo',
  ): Promise<string | null> {
    try {
      const promptContent = await this.promptsService.getPromptContent(
        promptKey,
        languageCode,
        variables,
      );

      return this.getChatCompletion(promptContent, model);
    } catch (error) {
      this.logger.error(
        `Error getting chat completion with prompt ${promptKey}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Gets multiple chat completions using prompts from the database.
   * @param requests Array of prompt requests with their configurations.
   * @param model The model to use for all completions.
   * @returns Array of completion results.
   */
  async getBatchChatCompletions(
    requests: Array<{
      promptKey: string;
      variables?: Record<string, string>;
      languageCode?: string;
    }>,
    model: string = 'gpt-3.5-turbo',
  ): Promise<
    Array<{ promptKey: string; content: string | null; error?: string }>
  > {
    const results = [];

    for (const request of requests) {
      try {
        const content = await this.getChatCompletionWithPrompt(
          request.promptKey,
          request.variables,
          request.languageCode || 'en',
          model,
        );
        results.push({ promptKey: request.promptKey, content });
      } catch (error) {
        results.push({
          promptKey: request.promptKey,
          content: null,
          error: error.message,
        });
      }
    }

    return results;
  }
}
