import { apiRequest } from './api';
import type { BulkImportResponse, BulkOperationStatus } from '@/types';

export const BulkOperationsService = {
  async importTasks(formData: FormData): Promise<BulkImportResponse> {
    return apiRequest<BulkImportResponse>({
      method: 'POST',
      url: '/bulk-operations/import-tasks',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getOperationStatus(operationId: string): Promise<BulkOperationStatus> {
    return apiRequest<BulkOperationStatus>({
      method: 'GET',
      url: `/bulk-operations/status/${operationId}`,
    });
  },

  async getAllOperations(): Promise<BulkOperationStatus[]> {
    return apiRequest<BulkOperationStatus[]>({
      method: 'GET',
      url: '/bulk-operations',
    });
  },

  async runChecker(
    taskSolutionIds: number[],
  ): Promise<{ operationId: string }> {
    return apiRequest<{ operationId: string }>({
      method: 'POST',
      url: '/bulk-operations/run-checker',
      data: { taskSolutionIds },
    });
  },
};
