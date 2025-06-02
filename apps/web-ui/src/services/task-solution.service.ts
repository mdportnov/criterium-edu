import { apiRequest } from './api';
import type {
  CreateTaskSolutionRequest,
  PaginatedResponse,
  PaginationParams,
  TaskSolution,
  UpdateTaskSolutionRequest,
} from '@/types';

export const TaskSolutionService = {
  async getTaskSolutions(
    pagination?: PaginationParams,
  ): Promise<TaskSolution[] | PaginatedResponse<TaskSolution>> {
    return apiRequest<TaskSolution[] | PaginatedResponse<TaskSolution>>({
      method: 'GET',
      url: '/task-solutions',
      params: pagination,
    });
  },

  async getTaskSolutionById(id: string): Promise<TaskSolution> {
    return apiRequest<TaskSolution>({
      method: 'GET',
      url: `/task-solutions/${id}`,
    });
  },

  async getTaskSolutionsByTaskId(
    taskId: string,
    pagination?: PaginationParams,
  ): Promise<TaskSolution[] | PaginatedResponse<TaskSolution>> {
    return apiRequest<TaskSolution[] | PaginatedResponse<TaskSolution>>({
      method: 'GET',
      url: `/task-solutions/by-task/${taskId}`,
      params: pagination,
    });
  },

  async getMyTaskSolutions(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<TaskSolution>> {
    return apiRequest<PaginatedResponse<TaskSolution>>({
      method: 'GET',
      url: '/task-solutions/my-solutions',
      params: pagination,
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
    id: string,
    data: UpdateTaskSolutionRequest,
  ): Promise<TaskSolution> {
    return apiRequest<TaskSolution>({
      method: 'PATCH',
      url: `/task-solutions/${id}`,
      data,
    });
  },

  async deleteTaskSolution(id: string): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/task-solutions/${id}`,
    });
  },
};
