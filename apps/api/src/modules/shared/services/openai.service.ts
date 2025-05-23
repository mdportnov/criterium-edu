import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async createCompletion(
    prompt: string,
    model: string = 'gpt-4o',
  ): Promise<any> {
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
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  async createCompletionWithMetrics(
    prompt: string,
    model: string = 'gpt-4o',
    temperature: number = 0.2,
    maxTokens: number = 2000,
    systemPrompt?: string,
  ): Promise<{ content: any; usage: any; model: string; finishReason: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt || 
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

      return {
        content: response,
        usage: response.usage,
        model: response.model,
        finishReason: response.choices[0]?.finish_reason || 'unknown',
      };
    } catch (error) {
      console.error('Error calling OpenAI API with metrics:', error);
      throw error;
    }
  }
}
