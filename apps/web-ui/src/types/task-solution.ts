export enum TaskSolutionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  REVIEWED = 'reviewed',
}

export interface TaskSolution {
  id: string;
  taskId: string;
  studentId: string;
  solutionText: string;
  status: TaskSolutionStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskSolutionRequest {
  taskId: string;
  solutionText: string;
}

export interface UpdateTaskSolutionRequest {
  solutionText?: string;
  status?: TaskSolutionStatus;
}
