import type { z } from 'zod';
import type {
  AutoAssessRequestSchema,
  BatchImportSolutionsSchema,
  ImportSolutionSchema,
  SourceAutoAssessRequestSchema,
  TaskAutoAssessRequestSchema,
} from '../../../common/dto';

// Service-facing types. The validated shapes live in common/dto, where the
// HTTP layer wraps them into ZodDto classes.
export type ImportSolutionDto = z.infer<typeof ImportSolutionSchema>;
export type BatchImportSolutionsDto = z.infer<
  typeof BatchImportSolutionsSchema
>;

export type AutoAssessRequestDto = z.infer<typeof AutoAssessRequestSchema>;
export type TaskAutoAssessRequestDto = z.infer<
  typeof TaskAutoAssessRequestSchema
>;
export type SourceAutoAssessRequestDto = z.infer<
  typeof SourceAutoAssessRequestSchema
>;
