import api from './axios.ts';
import {
  TaskSolution,
  CreateTaskSolutionPayload,
  UpdateTaskSolutionPayload,
} from '@/types';

export const taskSolutionsService = {
  getAll: async (): Promise<TaskSolution[]> => {
    const response = await api.get<TaskSolution[]>('/task-solutions');
    return response.data;
  },

  getById: async (id: number): Promise<TaskSolution> => {
    const response = await api.get<TaskSolution>(`/task-solutions/${id}`);
    return response.data;
  },

  getAllByTaskId: async (taskId: number): Promise<TaskSolution[]> => {
    const response = await api.get<TaskSolution[]>(
      `/task-solutions?taskId=${taskId}`,
    );
    return response.data;
  },

  getAllByStudentId: async (studentId: number): Promise<TaskSolution[]> => {
    const response = await api.get<TaskSolution[]>(
      `/task-solutions?studentId=${studentId}`,
    );
    return response.data;
  },

  create: async (payload: CreateTaskSolutionPayload): Promise<TaskSolution> => {
    const response = await api.post<TaskSolution>('/task-solutions', payload);
    return response.data;
  },

  update: async (
    id: number,
    payload: UpdateTaskSolutionPayload,
  ): Promise<TaskSolution> => {
    const response = await api.patch<TaskSolution>(
      `/task-solutions/${id}`,
      payload,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/task-solutions/${id}`);
  },
};
