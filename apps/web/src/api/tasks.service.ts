import api from './axios.ts';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types';

export const tasksService = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks');
    return response.data;
  },

  getById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const response = await api.post<Task>('/tasks', payload);
    return response.data;
  },

  update: async (id: number, payload: UpdateTaskPayload): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
