export interface SystemCostsDto {
  totalCost: number;
  dailyCosts: Record<string, number>;
  modelBreakdown: Record<string, { cost: number; requests: number; tokens: number }>;
  operationBreakdown: Record<string, { cost: number; requests: number }>;
}

export interface TaskCostsDto {
  totalCost: number;
  usageRecords: ApiUsageDto[];
  summary: {
    totalRequests: number;
    totalTokens: number;
    avgCostPerRequest: number;
  };
}

export interface UserCostsDto {
  totalCost: number;
  usageRecords: ApiUsageDto[];
  dailyCosts: Record<string, number>;
}

export interface ApiUsageDto {
  id: string;
  taskId?: string;
  userId?: string;
  operationType: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  requestDuration?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}