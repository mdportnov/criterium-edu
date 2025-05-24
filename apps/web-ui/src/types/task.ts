export interface TaskCriterion {
  id?: number;
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
  categories?: string[];
  tags?: string[];
  criteria: TaskCriterion[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  authorSolution?: string;
  categories?: string[];
  tags?: string[];
  criteria: TaskCriterion[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  authorSolution?: string;
  categories?: string[];
  tags?: string[];
  criteria?: TaskCriterion[];
}
