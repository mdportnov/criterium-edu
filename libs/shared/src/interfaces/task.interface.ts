export interface TaskCriterion {
  id: number;
  name: string;
  description: string;
  maxPoints: number;
  checkerComments?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  authorSolution?: string;
  criteria: TaskCriterion[];
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}
