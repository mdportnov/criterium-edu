export enum TaskSolutionStatus {
  PENDING = 'pending',
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
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskSolutionRequest {
  taskId: number;
  solutionText: string;
}

export interface UpdateTaskSolutionRequest {
  solutionText?: string;
  status?: TaskSolutionStatus;
}
