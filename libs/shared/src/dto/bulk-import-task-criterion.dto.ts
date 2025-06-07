import { z } from 'zod';

export const BulkImportTaskCriterionDtoSchema = z.object({
  name: z.string(),
  description: z.string(),
  maxPoints: z.number(),
});

export type BulkImportTaskCriterionDto = z.infer<
  typeof BulkImportTaskCriterionDtoSchema
>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const BulkImportTaskCriterionDto = {} as BulkImportTaskCriterionDto;
