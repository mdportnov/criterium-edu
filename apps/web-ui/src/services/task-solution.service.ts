import { apiRequest } from './api';
import type {
  CreateTaskSolutionRequest,
  TaskSolution,
  UpdateTaskSolutionRequest,
} from '@/types';

export const TaskSolutionService = {
  async getTaskSolutions(): Promise<TaskSolution[]> {
    return apiRequest<TaskSolution[]>({
      method: 'GET',
      url: '/task-solutions',
    });
  },

  async getTaskSolutionById(id: number): Promise<TaskSolution> {
    return apiRequest<TaskSolution>({
      method: 'GET',
      url: `/task-solutions/${id}`,
    });
  },

  async getTaskSolutionsByTaskId(taskId: number): Promise<TaskSolution[]> {
    return apiRequest<TaskSolution[]>({
      method: 'GET',
      url: `/task-solutions/by-task/${taskId}`,
    });
  },

  async getMyTaskSolutions(): Promise<TaskSolution[]> {
    return apiRequest<TaskSolution[]>({
      method: 'GET',
      url: '/task-solutions/my',
    });
  },

  async createTaskSolution(
    data: CreateTaskSolutionRequest,
  ): Promise<TaskSolution> {
    return apiRequest<TaskSolution>({
      method: 'POST',
      url: '/task-solutions',
      data,
    });
  },

  async updateTaskSolution(
    id: number,
    data: UpdateTaskSolutionRequest,
  ): Promise<TaskSolution> {
    return apiRequest<TaskSolution>({
      method: 'PATCH',
      url: `/task-solutions/${id}`,
      data,
    });
  },

  async deleteTaskSolution(id: number): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/task-solutions/${id}`,
    });
  },
};
