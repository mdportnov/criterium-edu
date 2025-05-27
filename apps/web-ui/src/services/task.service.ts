import { apiRequest } from './api';
import type {
  CreateTaskRequest,
  PaginatedResponse,
  PaginationParams,
  Task,
  UpdateTaskRequest,
} from '@/types';

export const TaskService = {
  async getTasks(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Task>> {
    const params = pagination
      ? { page: pagination.page, size: pagination.size }
      : {};
    return apiRequest<PaginatedResponse<Task>>({
      method: 'GET',
      url: '/tasks',
      params,
    });
  },

  async getTaskById(id: number): Promise<Task> {
    return apiRequest<Task>({
      method: 'GET',
      url: `/tasks/${id}`,
    });
  },

  async createTask(data: CreateTaskRequest): Promise<Task> {
    return apiRequest<Task>({
      method: 'POST',
      url: '/tasks',
      data,
    });
  },

  async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    return apiRequest<Task>({
      method: 'PATCH',
      url: `/tasks/${id}`,
      data,
    });
  },

  async deleteTask(id: number): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/tasks/${id}`,
    });
  },
};
