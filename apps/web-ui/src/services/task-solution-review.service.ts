import { apiRequest } from './api';
import type {
  CreateTaskSolutionReviewRequest,
  PaginatedResponse,
  PaginationParams,
  TaskSolutionReview,
  UpdateTaskSolutionReviewRequest,
} from '@/types';

export const TaskSolutionReviewService = {
  async getReviews(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<TaskSolutionReview>> {
    return apiRequest<PaginatedResponse<TaskSolutionReview>>({
      method: 'GET',
      url: '/task-solution-reviews',
      params: pagination,
    });
  },

  async getReviewById(id: string): Promise<TaskSolutionReview> {
    return apiRequest<TaskSolutionReview>({
      method: 'GET',
      url: `/task-solution-reviews/${id}`,
    });
  },

  async getReviewsByTaskSolutionId(
    taskSolutionId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<TaskSolutionReview>> {
    return apiRequest<PaginatedResponse<TaskSolutionReview>>({
      method: 'GET',
      url: `/task-solution-reviews?taskSolutionId=${taskSolutionId}`,
      params: pagination,
    });
  },

  async getReviewsByTaskId(
    taskId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<TaskSolutionReview>> {
    return apiRequest<PaginatedResponse<TaskSolutionReview>>({
      method: 'GET',
      url: `/task-solution-reviews?taskId=${taskId}`,
      params: pagination,
    });
  },

  async approveAutoReview(id: string): Promise<TaskSolutionReview> {
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
    id: string,
    data: UpdateTaskSolutionReviewRequest,
  ): Promise<TaskSolutionReview> {
    return apiRequest<TaskSolutionReview>({
      method: 'PATCH',
      url: `/task-solution-reviews/${id}`,
      data,
    });
  },

  async deleteReview(id: string): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/task-solution-reviews/${id}`,
    });
  },

  async getPendingAutoReviews(
    taskId?: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<TaskSolutionReview>> {
    const url = taskId
      ? `/task-solution-reviews/pending-auto?taskId=${taskId}`
      : '/task-solution-reviews/pending-auto';

    return apiRequest<PaginatedResponse<TaskSolutionReview>>({
      method: 'GET',
      url,
      params: pagination,
    });
  },

  async rejectAutoReview(id: string): Promise<void> {
    return apiRequest<void>({
      method: 'POST',
      url: `/task-solution-reviews/${id}/reject`,
    });
  },

  async batchApproveReviews(
    reviewIds: string[],
  ): Promise<{ approvedCount: number; errors: any[] }> {
    return apiRequest<{ approvedCount: number; errors: any[] }>({
      method: 'POST',
      url: '/task-solution-reviews/batch-approve',
      data: { reviewIds },
    });
  },

  async batchRejectReviews(
    reviewIds: string[],
  ): Promise<{ rejectedCount: number; errors: any[] }> {
    return apiRequest<{ rejectedCount: number; errors: any[] }>({
      method: 'POST',
      url: '/task-solution-reviews/batch-reject',
      data: { reviewIds },
    });
  },

  // Alias methods for backward compatibility with component naming
  async getTaskSolutionReviewsBySolutionId(
    solutionId: string,
    pagination?: PaginationParams,
  ): Promise<TaskSolutionReview[] | PaginatedResponse<TaskSolutionReview>> {
    return this.getReviewsByTaskSolutionId(solutionId, pagination);
  },

  async createTaskSolutionReview(
    data: CreateTaskSolutionReviewRequest,
  ): Promise<TaskSolutionReview> {
    return this.createReview(data);
  },

  async updateTaskSolutionReview(
    id: string,
    data: UpdateTaskSolutionReviewRequest,
  ): Promise<TaskSolutionReview> {
    return this.updateReview(id, data);
  },
};
