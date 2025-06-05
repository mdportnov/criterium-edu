import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { Logger } from 'nestjs-pino';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly logger: Logger,
  ) {}

  async createCompletion(
    prompt: string,
    model: string = 'gpt-4o',
  ): Promise<any> {
    if (!this.openai) {
      const apiKey = await this.settingsService.getOpenAIApiKey();
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured.');
      }
      this.openai = new OpenAI({ apiKey });
    }
    try {
      return await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educator and assessor. Return assessments in valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Lower temperature for more consistent results
      });
    } catch (error) {
      this.logger.error(
        {
          message: 'Error calling OpenAI API',
          error: error instanceof Error ? error.message : String(error),
          model,
        },
        OpenAIService.name,
      );
      throw error;
    }
  }

  async createCompletionWithMetrics(
    prompt: string,
    model: string = 'gpt-4o',
    temperature: number = 0.2,
    maxTokens: number = 2000,
    systemPrompt?: string,
  ): Promise<{
    content: any;
    usage: any;
    model: string;
    finishReason: string;
  }> {
    if (!this.openai) {
      const apiKey = await this.settingsService.getOpenAIApiKey();
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured.');
      }
      this.openai = new OpenAI({ apiKey });
    }
    try {
      this.logger.log(
        {
          message: 'Calling OpenAI API',
          model,
          temperature,
          maxTokens,
          promptLength: prompt.length,
        },
        OpenAIService.name,
      );

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              systemPrompt ||
              'You are an expert educator and assessor. Return assessments in valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      this.logger.log(
        {
          message: 'OpenAI API response received',
          model: response.model,
          finishReason: response.choices[0]?.finish_reason || 'unknown',
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
        OpenAIService.name,
      );

      return {
        content: response,
        usage: response.usage,
        model: response.model,
        finishReason: response.choices[0]?.finish_reason || 'unknown',
      };
    } catch (error) {
      this.logger.error(
        {
          message: 'Error calling OpenAI API with metrics',
          error: error instanceof Error ? error.message : String(error),
          model,
          temperature,
          maxTokens,
        },
        OpenAIService.name,
      );
      throw error;
    }
  }
}
