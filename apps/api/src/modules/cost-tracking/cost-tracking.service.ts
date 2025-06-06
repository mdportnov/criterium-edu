import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiUsage } from './entities/api-usage.entity';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostCalculationResult {
  promptCost: number;
  completionCost: number;
  totalCost: number;
}

export interface ApiUsageCreateData {
  taskId?: string;
  userId?: string;
  operationType: string;
  provider?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  requestDuration?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class CostTrackingService {
  private readonly PRICING = {
    openai: {
      'gpt-4': {
        prompt: 0.03 / 1000, // $0.03 per 1K tokens
        completion: 0.06 / 1000, // $0.06 per 1K tokens
      },
      'gpt-4-turbo': {
        prompt: 0.01 / 1000, // $0.01 per 1K tokens
        completion: 0.03 / 1000, // $0.03 per 1K tokens
      },
      'gpt-4o': {
        prompt: 0.005 / 1000, // $0.005 per 1K tokens
        completion: 0.015 / 1000, // $0.015 per 1K tokens
      },
      'gpt-4o-mini': {
        prompt: 0.00015 / 1000, // $0.00015 per 1K tokens
        completion: 0.0006 / 1000, // $0.0006 per 1K tokens
      },
      'gpt-3.5-turbo': {
        prompt: 0.0015 / 1000, // $0.0015 per 1K tokens
        completion: 0.002 / 1000, // $0.002 per 1K tokens
      },
    },
  };

  constructor(
    @InjectRepository(ApiUsage)
    private apiUsageRepository: Repository<ApiUsage>,
  ) {}

  calculateCost(
    provider: string,
    model: string,
    usage: TokenUsage,
  ): CostCalculationResult {
    const pricing = this.PRICING[provider]?.[model];

    if (!pricing) {
      // Fallback to default pricing if model not found
      const promptCost = (usage.promptTokens * 0.001) / 1000;
      const completionCost = (usage.completionTokens * 0.002) / 1000;
      return {
        promptCost,
        completionCost,
        totalCost: promptCost + completionCost,
      };
    }

    const promptCost = usage.promptTokens * pricing.prompt;
    const completionCost = usage.completionTokens * pricing.completion;

    return {
      promptCost,
      completionCost,
      totalCost: promptCost + completionCost,
    };
  }

  async trackApiUsage(data: ApiUsageCreateData): Promise<ApiUsage> {
    const apiUsage = this.apiUsageRepository.create(data);
    return this.apiUsageRepository.save(apiUsage);
  }

  async getTaskCosts(taskId: string): Promise<{
    totalCost: number;
    usageRecords: ApiUsage[];
    summary: {
      totalRequests: number;
      totalTokens: number;
      avgCostPerRequest: number;
    };
  }> {
    const usageRecords = await this.apiUsageRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });

    const totalCost = usageRecords.reduce(
      (sum, record) => sum + Number(record.costUsd),
      0,
    );

    const totalTokens = usageRecords.reduce(
      (sum, record) => sum + record.totalTokens,
      0,
    );

    return {
      totalCost,
      usageRecords,
      summary: {
        totalRequests: usageRecords.length,
        totalTokens,
        avgCostPerRequest:
          usageRecords.length > 0 ? totalCost / usageRecords.length : 0,
      },
    };
  }

  async getUserCosts(
    userId: string,
    days = 30,
  ): Promise<{
    totalCost: number;
    usageRecords: ApiUsage[];
    dailyCosts: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usageRecords = await this.apiUsageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const recentRecords = usageRecords.filter(
      (record) => record.createdAt >= startDate,
    );

    const totalCost = recentRecords.reduce(
      (sum, record) => sum + Number(record.costUsd),
      0,
    );

    const dailyCosts: Record<string, number> = {};
    recentRecords.forEach((record) => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      dailyCosts[dateKey] = (dailyCosts[dateKey] || 0) + Number(record.costUsd);
    });

    return {
      totalCost,
      usageRecords: recentRecords,
      dailyCosts,
    };
  }

  async getSystemCosts(days = 30): Promise<{
    totalCost: number;
    dailyCosts: Record<string, number>;
    modelBreakdown: Record<
      string,
      { cost: number; requests: number; tokens: number }
    >;
    operationBreakdown: Record<string, { cost: number; requests: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usageRecords = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .where('usage.createdAt >= :startDate', { startDate })
      .orderBy('usage.createdAt', 'DESC')
      .getMany();

    const totalCost = usageRecords.reduce(
      (sum, record) => sum + Number(record.costUsd),
      0,
    );

    const dailyCosts: Record<string, number> = {};
    const modelBreakdown: Record<
      string,
      { cost: number; requests: number; tokens: number }
    > = {};
    const operationBreakdown: Record<
      string,
      { cost: number; requests: number }
    > = {};

    usageRecords.forEach((record) => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      const cost = Number(record.costUsd);

      dailyCosts[dateKey] = (dailyCosts[dateKey] || 0) + cost;

      if (!modelBreakdown[record.model]) {
        modelBreakdown[record.model] = { cost: 0, requests: 0, tokens: 0 };
      }
      modelBreakdown[record.model].cost += cost;
      modelBreakdown[record.model].requests += 1;
      modelBreakdown[record.model].tokens += record.totalTokens;

      if (!operationBreakdown[record.operationType]) {
        operationBreakdown[record.operationType] = { cost: 0, requests: 0 };
      }
      operationBreakdown[record.operationType].cost += cost;
      operationBreakdown[record.operationType].requests += 1;
    });

    return {
      totalCost,
      dailyCosts,
      modelBreakdown,
      operationBreakdown,
    };
  }
}
