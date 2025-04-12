import api from './axios.ts';
import {
  TaskSolutionReview,
  CreateTaskSolutionReviewPayload,
  UpdateTaskSolutionReviewPayload,
} from '@/types';

export const taskSolutionReviewsService = {
  getAll: async (): Promise<TaskSolutionReview[]> => {
    const response = await api.get<TaskSolutionReview[]>(
      '/task-solution-reviews',
    );
    return response.data;
  },

  getById: async (id: number): Promise<TaskSolutionReview> => {
    const response = await api.get<TaskSolutionReview>(
      `/task-solution-reviews/${id}`,
    );
    return response.data;
  },

  getByTaskSolutionId: async (
    taskSolutionId: number,
  ): Promise<TaskSolutionReview> => {
    const response = await api.get<TaskSolutionReview>(
      `/task-solution-reviews?taskSolutionId=${taskSolutionId}`,
    );
    return response.data;
  },

  create: async (
    payload: CreateTaskSolutionReviewPayload,
  ): Promise<TaskSolutionReview> => {
    const response = await api.post<TaskSolutionReview>(
      '/task-solution-reviews',
      payload,
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: UpdateTaskSolutionReviewPayload,
  ): Promise<TaskSolutionReview> => {
    const response = await api.patch<TaskSolutionReview>(
      `/task-solution-reviews/${id}`,
      payload,
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/task-solution-reviews/${id}`);
  },
};
