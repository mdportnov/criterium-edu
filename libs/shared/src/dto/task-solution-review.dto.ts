import { z } from 'zod';
import { ReviewSource } from '../interfaces';

export const CriterionScoreDtoSchema = z.object({
  criterionId: z.string(),
  score: z.number(),
  comment: z.string().optional(),
});

export const CreateTaskSolutionReviewDtoSchema = z.object({
  taskSolutionId: z.string(),
  criteriaScores: z.array(CriterionScoreDtoSchema),
  feedbackToStudent: z.string(),
  reviewerComment: z.string().optional(),
  source: z.nativeEnum(ReviewSource),
});

export const UpdateTaskSolutionReviewDtoSchema = z.object({
  criteriaScores: z.array(CriterionScoreDtoSchema).optional(),
  feedbackToStudent: z.string().optional(),
  reviewerComment: z.string().optional(),
  source: z.nativeEnum(ReviewSource).optional(),
  reviewerId: z.string().optional(),
});

export const TaskSolutionReviewDtoSchema = z.object({
  id: z.string(),
  taskSolutionId: z.string(),
  reviewerId: z.string().optional(),
  criteriaScores: z.array(CriterionScoreDtoSchema),
  totalScore: z.number(),
  feedbackToStudent: z.string(),
  reviewerComment: z.string().optional(),
  source: z.nativeEnum(ReviewSource),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateSessionDtoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  solutionIds: z.array(z.string()),
  llmModel: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});

export type CriterionScoreDto = z.infer<typeof CriterionScoreDtoSchema>;
export type CreateTaskSolutionReviewDto = z.infer<
  typeof CreateTaskSolutionReviewDtoSchema
>;
export type UpdateTaskSolutionReviewDto = z.infer<
  typeof UpdateTaskSolutionReviewDtoSchema
>;
export type TaskSolutionReviewDto = z.infer<typeof TaskSolutionReviewDtoSchema>;
export type CreateSessionDto = z.infer<typeof CreateSessionDtoSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const CriterionScoreDto = {} as CriterionScoreDto;
export const CreateTaskSolutionReviewDto = {} as CreateTaskSolutionReviewDto;
export const UpdateTaskSolutionReviewDto = {} as UpdateTaskSolutionReviewDto;
export const TaskSolutionReviewDto = {} as TaskSolutionReviewDto;
export const CreateSessionDto = {} as CreateSessionDto;
