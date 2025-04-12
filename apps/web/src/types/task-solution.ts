import { Task } from './task.ts';
import { User } from './user.ts';

export enum TaskSolutionStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  REVIEWED = 'reviewed',
}

export interface TaskSolution {
  id: number;
  taskId: number;
  studentId: number;
  solutionText: string;
  status: TaskSolutionStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  task?: Task;
  student?: User;
}

export interface CreateTaskSolutionPayload {
  taskId: number;
  solutionText: string;
}

export interface UpdateTaskSolutionPayload {
  solutionText?: string;
  status?: TaskSolutionStatus;
}
