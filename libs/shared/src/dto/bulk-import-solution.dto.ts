import { z } from 'zod';

export const BulkImportSolutionDtoSchema = z.object({
  studentName: z.string(),
  studentId: z.string(),
  solutionContent: z.string(),
  taskId: z.string().uuid(),
  notes: z.string().optional(),
});

export type BulkImportSolutionDto = z.infer<typeof BulkImportSolutionDtoSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const BulkImportSolutionDto = {} as BulkImportSolutionDto;
