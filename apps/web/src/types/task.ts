import { TaskCriterionDto } from '@app/shared';

export interface Task {
  id: number;
  title: string;
  description: string;
  authorSolution?: string;
  criteria: TaskCriterionDto[];
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  authorSolution?: string;
  criteria: TaskCriterionDto[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  authorSolution?: string;
  criteria?: TaskCriterionDto[];
}
