import { z } from 'zod';

export const BulkImportSolutionDtoSchema = z.object({
  studentName: z.string(),
  studentId: z.string(),
  solutionContent: z.string(),
  taskId: z.string().uuid(),
  notes: z.string().optional(),
});

export type BulkImportSolutionDto = z.infer<typeof BulkImportSolutionDtoSchema>;
