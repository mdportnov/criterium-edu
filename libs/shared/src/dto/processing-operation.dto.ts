import { z } from 'zod';

export enum ProcessingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum OperationType {
  BULK_SOLUTION_IMPORT = 'bulk_solution_import',
  LLM_ASSESSMENT = 'llm_assessment',
}

export const ProcessingOperationDtoSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(OperationType),
  status: z.nativeEnum(ProcessingStatus),
  progress: z.number(),
  totalItems: z.number(),
  processedItems: z.number(),
  failedItems: z.number(),
  timeoutMinutes: z.number(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastProgressUpdate: z.date().optional(),
});

export type ProcessingOperationDto = z.infer<
  typeof ProcessingOperationDtoSchema
>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const ProcessingOperationDto = {} as ProcessingOperationDto;
