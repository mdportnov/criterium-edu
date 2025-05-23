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

  async getPendingAutoReviews(taskId?: number): Promise<TaskSolutionReview[]> {
    const url = taskId
      ? `/task-solution-reviews/pending-auto?taskId=${taskId}`
      : '/task-solution-reviews/pending-auto';

    return apiRequest<TaskSolutionReview[]>({
      method: 'GET',
      url,
    });
  },

  async rejectAutoReview(id: number): Promise<void> {
    return apiRequest<void>({
      method: 'POST',
      url: `/task-solution-reviews/${id}/reject`,
    });
  },

  async batchApproveReviews(
    reviewIds: number[],
  ): Promise<{ approvedCount: number; errors: any[] }> {
    return apiRequest<{ approvedCount: number; errors: any[] }>({
      method: 'POST',
      url: '/task-solution-reviews/batch-approve',
      data: { reviewIds },
    });
  },

  async batchRejectReviews(
    reviewIds: number[],
  ): Promise<{ rejectedCount: number; errors: any[] }> {
    return apiRequest<{ rejectedCount: number; errors: any[] }>({
      method: 'POST',
      url: '/task-solution-reviews/batch-reject',
      data: { reviewIds },
    });
  },

  // Alias methods for backward compatibility with component naming
  async getTaskSolutionReviewsBySolutionId(
    solutionId: number,
  ): Promise<TaskSolutionReview[]> {
    return this.getReviewsByTaskSolutionId(solutionId);
  },

  async createTaskSolutionReview(
    data: CreateTaskSolutionReviewRequest,
  ): Promise<TaskSolutionReview> {
    return this.createReview(data);
  },

  async updateTaskSolutionReview(
    id: number,
    data: UpdateTaskSolutionReviewRequest,
  ): Promise<TaskSolutionReview> {
    return this.updateReview(id, data);
  },
};
