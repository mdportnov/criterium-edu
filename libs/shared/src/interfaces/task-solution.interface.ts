export interface TaskSolution {
  id: string;
  taskId: string;
  studentId: string;
  solutionText: string;
  status: TaskSolutionStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskSolutionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  REVIEWED = 'reviewed',
}
