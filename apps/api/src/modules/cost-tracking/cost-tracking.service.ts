import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiUsage } from './entities/api-usage.entity';
import { PROVIDERS, type LlmProvider } from '../llm/providers';

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
  metadata?: Record<string, unknown>;
}

export interface CostCalculationDetail extends CostCalculationResult {
  /** False when no price is configured for this model. */
  known: boolean;
}

@Injectable()
export class CostTrackingService {
  constructor(
    @InjectRepository(ApiUsage)
    private apiUsageRepository: Repository<ApiUsage>,
  ) {}

  /**
   * Prices come from the provider registry, or from an admin override for
   * providers whose catalogue we cannot ship (OpenRouter fronts hundreds of
   * models at prices that move). Overrides are quoted per million tokens,
   * which is how every provider publishes them.
   *
   * An unknown model costs zero and says so. It used to fall back to an
   * invented $0.001/$0.002 per 1K, which put made-up numbers in the cost
   * report and was indistinguishable from a real one.
   */
  calculateCost(
    provider: string,
    model: string,
    usage: TokenUsage,
    overrides: Record<string, { prompt: number; completion: number }> = {},
  ): CostCalculationDetail {
    const override = overrides[model];
    const pricing = override
      ? {
          prompt: override.prompt / 1_000_000,
          completion: override.completion / 1_000_000,
        }
      : PROVIDERS[provider as LlmProvider]?.pricing[model];

    if (!pricing) {
      return { promptCost: 0, completionCost: 0, totalCost: 0, known: false };
    }

    const promptCost = usage.promptTokens * pricing.prompt;
    const completionCost = usage.completionTokens * pricing.completion;

    return {
      promptCost,
      completionCost,
      totalCost: promptCost + completionCost,
      known: true,
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
