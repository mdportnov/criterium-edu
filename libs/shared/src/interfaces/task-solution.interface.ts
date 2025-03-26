export interface TaskSolution {
  id: number;
  taskId: number;
  studentId: number;
  solutionText: string;
  status: TaskSolutionStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskSolutionStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  REVIEWED = 'reviewed',
}
