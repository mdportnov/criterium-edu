import { z } from 'zod';

export const TaskCriterionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  maxPoints: z.number().positive(),
  checkerComments: z.string().optional(),
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
  criteria: z.array(TaskCriterionSchema),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TaskCriterionDto = z.infer<typeof TaskCriterionSchema>;
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
export type TaskDto = z.infer<typeof TaskSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const TaskCriterionDto = {} as TaskCriterionDto;
export const CreateTaskDto = {} as CreateTaskDto;
export const UpdateTaskDto = {} as UpdateTaskDto;
export const TaskDto = {} as TaskDto;
