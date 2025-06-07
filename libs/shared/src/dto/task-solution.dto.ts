import { z } from 'zod';
import { TaskSolutionStatus } from '../interfaces';

export const CreateTaskSolutionDtoSchema = z.object({
  taskId: z.string(),
  solutionText: z.string(),
  notes: z.string().optional(),
});

export const UpdateTaskSolutionDtoSchema = z.object({
  solutionText: z.string().optional(),
  status: z.nativeEnum(TaskSolutionStatus).optional(),
});

export const TaskSolutionDtoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  studentId: z.string(),
  solutionText: z.string(),
  status: z.nativeEnum(TaskSolutionStatus),
  submittedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateTaskSolutionDto = z.infer<typeof CreateTaskSolutionDtoSchema>;
export type UpdateTaskSolutionDto = z.infer<typeof UpdateTaskSolutionDtoSchema>;
export type TaskSolutionDto = z.infer<typeof TaskSolutionDtoSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const CreateTaskSolutionDto = {} as CreateTaskSolutionDto;
export const UpdateTaskSolutionDto = {} as UpdateTaskSolutionDto;
export const TaskSolutionDto = {} as TaskSolutionDto;
