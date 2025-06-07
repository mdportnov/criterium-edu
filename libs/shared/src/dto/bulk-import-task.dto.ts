import { z } from 'zod';
import { BulkImportTaskCriterionDtoSchema } from './bulk-import-task-criterion.dto';

export const BulkImportTaskDtoSchema = z.object({
  title: z.string(),
  description: z.string(),
  authorSolution: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  criteria: z.array(BulkImportTaskCriterionDtoSchema).optional(),
});

export type BulkImportTaskDto = z.infer<typeof BulkImportTaskDtoSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const BulkImportTaskDto = {} as BulkImportTaskDto;
