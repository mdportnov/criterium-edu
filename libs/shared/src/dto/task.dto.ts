import { z } from 'zod';

export const TaskCriterionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  maxPoints: z.number().positive(),
  checkerComments: z.string().optional(),
});

/**
 * A criterion that has been saved always has an id; one being submitted does
 * not yet. Keeping that distinction in the schema is what lets consumers -
 * the checker, for one - use `criterion.id` without asserting.
 */
export const PersistedTaskCriterionSchema = TaskCriterionSchema.extend({
  id: z.string(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  authorSolution: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  criteria: z.array(TaskCriterionSchema),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  authorSolution: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  criteria: z.array(TaskCriterionSchema).optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  authorSolution: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  criteria: z.array(PersistedTaskCriterionSchema),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TaskCriterionDto = z.infer<typeof TaskCriterionSchema>;
export type PersistedTaskCriterionDto = z.infer<
  typeof PersistedTaskCriterionSchema
>;
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
export type TaskDto = z.infer<typeof TaskSchema>;
