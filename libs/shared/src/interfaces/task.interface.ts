export interface TaskCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  checkerComments?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  authorSolution?: string;
  criteria: TaskCriterion[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
