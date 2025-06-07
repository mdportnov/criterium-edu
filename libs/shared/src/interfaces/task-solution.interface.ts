export interface TaskSolution {
  id: string;
  taskId: string;
  studentId: string;
  solutionText: string;
  status: TaskSolutionStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  task?: {
    id: string;
    title: string;
  };
}

export enum TaskSolutionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  REVIEWED = 'reviewed',
}
