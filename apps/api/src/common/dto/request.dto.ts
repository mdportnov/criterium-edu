import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  BulkImportSolutionDtoSchema,
  BulkImportTaskDtoSchema,
  CreatePromptDtoSchema,
  CreateSessionDtoSchema,
  CreateTaskSchema,
  CreateTaskSolutionDtoSchema,
  CreateTaskSolutionReviewDtoSchema,
  CreateUserDtoSchema,
  LoginAsSchema,
  LoginSchema,
  PaginationDtoSchema,
  RegisterSchema,
  UpdatePromptDtoSchema,
  UpdateTaskSchema,
  UpdateTaskSolutionDtoSchema,
  UpdateTaskSolutionReviewDtoSchema,
  UpdateUserDtoSchema,
} from '@app/shared';

/**
 * Request DTOs for the HTTP layer.
 *
 * `@app/shared` holds the framework-free Zod schemas, shared with the
 * frontend. The global ZodValidationPipe only validates a parameter whose
 * type is a class produced by createZodDto, so every schema that backs a
 * request body or query string is wrapped here. Plain interfaces - which is
 * what the controllers used to declare - are erased at runtime and the pipe
 * silently waves them through.
 */

// --- auth ---
export class LoginDto extends createZodDto(LoginSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginAsDto extends createZodDto(LoginAsSchema) {}

// --- shared query strings ---
export class PaginationDto extends createZodDto(PaginationDtoSchema) {}

// --- users ---
export class CreateUserDto extends createZodDto(CreateUserDtoSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserDtoSchema) {}

// --- tasks ---
export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
export class UpdateTaskDto extends createZodDto(UpdateTaskSchema) {}

// --- solutions ---
export class CreateTaskSolutionDto extends createZodDto(
  CreateTaskSolutionDtoSchema,
) {}
export class UpdateTaskSolutionDto extends createZodDto(
  UpdateTaskSolutionDtoSchema,
) {}

// --- reviews ---
export class CreateTaskSolutionReviewDto extends createZodDto(
  CreateTaskSolutionReviewDtoSchema,
) {}
export class UpdateTaskSolutionReviewDto extends createZodDto(
  UpdateTaskSolutionReviewDtoSchema,
) {}
export class CreateSessionDto extends createZodDto(CreateSessionDtoSchema) {}

// --- prompts ---
export class CreatePromptDto extends createZodDto(CreatePromptDtoSchema) {}
export class UpdatePromptDto extends createZodDto(UpdatePromptDtoSchema) {}

// --- bulk import ---
export class BulkImportTasksDto extends createZodDto(
  z.array(BulkImportTaskDtoSchema),
) {}
export class BulkImportSolutionsDto extends createZodDto(
  z.array(BulkImportSolutionDtoSchema),
) {}

export const StartLlmAssessmentSchema = z.object({
  solutionIds: z.array(z.string().uuid()).min(1),
  llmModel: z.string().min(1).optional(),
  taskId: z.string().uuid().optional(),
  systemPrompt: z.string().optional(),
});
export class StartLlmAssessmentDto extends createZodDto(
  StartLlmAssessmentSchema,
) {}
export type StartLlmAssessmentInput = z.infer<
  typeof StartLlmAssessmentSchema
> & {
  userId: string;
  sessionName?: string;
  sessionDescription?: string;
};

// --- solution import / auto assessment ---
export const ImportSolutionSchema = z.object({
  content: z.string().min(1),
  taskId: z.string().uuid(),
  externalId: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const BatchImportSolutionsSchema = z.object({
  solutions: z.array(ImportSolutionSchema).min(1),
  sourceName: z.string().min(1),
});
export class BatchImportSolutionsDto extends createZodDto(
  BatchImportSolutionsSchema,
) {}

export const AutoAssessRequestSchema = z.object({
  solutionIds: z.array(z.string().uuid()).min(1),
  llmModel: z.string().min(1).optional(),
});
export class AutoAssessRequestDto extends createZodDto(
  AutoAssessRequestSchema,
) {}

export const TaskAutoAssessRequestSchema = z.object({
  taskId: z.string().uuid(),
  llmModel: z.string().min(1).optional(),
});
export class TaskAutoAssessRequestDto extends createZodDto(
  TaskAutoAssessRequestSchema,
) {}

export const SourceAutoAssessRequestSchema = z.object({
  sourceId: z.string().uuid(),
  llmModel: z.string().min(1).optional(),
});
export class SourceAutoAssessRequestDto extends createZodDto(
  SourceAutoAssessRequestSchema,
) {}

export const UpdateSettingsSchema = z.record(z.string(), z.string());
export class UpdateSettingsDto extends createZodDto(UpdateSettingsSchema) {}
