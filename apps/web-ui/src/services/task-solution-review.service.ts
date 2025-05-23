import { apiRequest } from './api';
import type {
  CreateTaskSolutionReviewRequest,
  TaskSolutionReview,
  UpdateTaskSolutionReviewRequest,
} from '@/types';

export const TaskSolutionReviewService = {
  async getReviews(): Promise<TaskSolutionReview[]> {
    return apiRequest<TaskSolutionReview[]>({
      method: 'GET',
      url: '/task-solution-reviews',
    });
  },

  async getReviewById(id: number): Promise<TaskSolutionReview> {
    return apiRequest<TaskSolutionReview>({
      method: 'GET',
      url: `/task-solution-reviews/${id}`,
    });
  },

  async getReviewsByTaskSolutionId(
    taskSolutionId: number,
  ): Promise<TaskSolutionReview[]> {
    return apiRequest<TaskSolutionReview[]>({
      method: 'GET',
      url: `/task-solution-reviews?taskSolutionId=${taskSolutionId}`,
    });
  },

  async getReviewsByTaskId(taskId: number): Promise<TaskSolutionReview[]> {
    return apiRequest<TaskSolutionReview[]>({
      method: 'GET',
      url: `/task-solution-reviews?taskId=${taskId}`,
    });
  },

  async approveAutoReview(id: number): Promise<TaskSolutionReview> {
    return apiRequest<TaskSolutionReview>({
      method: 'POST',
      url: `/task-solution-reviews/${id}/approve`,
    });
  },

  async createReview(
    data: CreateTaskSolutionReviewRequest,
  ): Promise<TaskSolutionReview> {
    return apiRequest<TaskSolutionReview>({
      method: 'POST',
      url: '/task-solution-reviews',
      data,
    });
  },

  async updateReview(
    id: number,
    data: UpdateTaskSolutionReviewRequest,
  ): Promise<TaskSolutionReview> {
    return apiRequest<TaskSolutionReview>({
      method: 'PATCH',
      url: `/task-solution-reviews/${id}`,
      data,
    });
  },

  async deleteReview(id: number): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/task-solution-reviews/${id}`,
    });
  },
};
