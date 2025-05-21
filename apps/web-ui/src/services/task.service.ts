import { apiRequest } from './api';
import type { CreateTaskRequest, Task, UpdateTaskRequest } from '@/types';

export const TaskService = {
  async getTasks(): Promise<Task[]> {
    return apiRequest<Task[]>({
      method: 'GET',
      url: '/tasks',
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
