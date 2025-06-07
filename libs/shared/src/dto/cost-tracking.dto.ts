import { z } from 'zod';

export const ApiUsageDtoSchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  userId: z.string().optional(),
  operationType: z.string(),
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  costUsd: z.number(),
  requestDuration: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
});

export const SystemCostsDtoSchema = z.object({
  totalCost: z.number(),
  dailyCosts: z.record(z.number()),
  modelBreakdown: z.record(
    z.object({
      cost: z.number(),
      requests: z.number(),
      tokens: z.number(),
    }),
  ),
  operationBreakdown: z.record(
    z.object({
      cost: z.number(),
      requests: z.number(),
    }),
  ),
});

export const TaskCostsDtoSchema = z.object({
  totalCost: z.number(),
  usageRecords: z.array(ApiUsageDtoSchema),
  summary: z.object({
    totalRequests: z.number(),
    totalTokens: z.number(),
    avgCostPerRequest: z.number(),
  }),
});

export const UserCostsDtoSchema = z.object({
  totalCost: z.number(),
  usageRecords: z.array(ApiUsageDtoSchema),
  dailyCosts: z.record(z.number()),
});

export type ApiUsageDto = z.infer<typeof ApiUsageDtoSchema>;
export type SystemCostsDto = z.infer<typeof SystemCostsDtoSchema>;
export type TaskCostsDto = z.infer<typeof TaskCostsDtoSchema>;
export type UserCostsDto = z.infer<typeof UserCostsDtoSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const ApiUsageDto = {} as ApiUsageDto;
export const SystemCostsDto = {} as SystemCostsDto;
export const TaskCostsDto = {} as TaskCostsDto;
export const UserCostsDto = {} as UserCostsDto;
