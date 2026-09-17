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
  /**
   * A stub, not the whole task: the API returns the id and title only. It used
   * to declare a `criteria` array of `{ id, title }`, which the API never
   * sends and which does not match a criterion's real shape. Fetch the task
   * through TaskService when the criteria are needed.
   */
  task?: {
    id: string;
    title: string;
  };
}

export interface CreateTaskSolutionRequest {
  taskId: string;
  solutionText: string;
}

export interface UpdateTaskSolutionRequest {
  solutionText?: string;
  status?: TaskSolutionStatus;
}
