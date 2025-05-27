import { apiRequest } from './api';
import type {
  BulkImportResponse,
  BulkImportSolution,
  BulkOperationStatus,
  LLMAssessmentRequest,
  PaginatedResponse,
  PaginationParams,
  ProcessingOperation,
} from '@/types';

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

  async getAllOperations(
    pagination?: PaginationParams,
  ): Promise<BulkOperationStatus[] | PaginatedResponse<BulkOperationStatus>> {
    return apiRequest<
      BulkOperationStatus[] | PaginatedResponse<BulkOperationStatus>
    >({
      method: 'GET',
      url: '/bulk-operations',
      params: pagination,
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

  async importSolutions(
    solutions: BulkImportSolution[],
  ): Promise<ProcessingOperation> {
    return apiRequest<ProcessingOperation>({
      method: 'POST',
      url: '/bulk-operations/solutions/import/json',
      data: solutions,
    });
  },

  async startLLMAssessment(
    request: LLMAssessmentRequest,
  ): Promise<ProcessingOperation> {
    return apiRequest<ProcessingOperation>({
      method: 'POST',
      url: '/bulk-operations/solutions/assess-llm',
      data: request,
    });
  },

  async getAllProcessingOperations(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<ProcessingOperation>> {
    return apiRequest<PaginatedResponse<ProcessingOperation>>({
      method: 'GET',
      url: '/bulk-operations/operations',
      params: pagination,
    });
  },

  async getProcessingOperationStatus(
    operationId: string,
  ): Promise<ProcessingOperation> {
    return apiRequest<ProcessingOperation>({
      method: 'GET',
      url: `/bulk-operations/operations/${operationId}/status`,
    });
  },

  async stopOperation(operationId: string): Promise<ProcessingOperation> {
    return apiRequest<ProcessingOperation>({
      method: 'POST',
      url: `/bulk-operations/operations/${operationId}/stop`,
    });
  },

  async restartOperation(operationId: string): Promise<ProcessingOperation> {
    return apiRequest<ProcessingOperation>({
      method: 'POST',
      url: `/bulk-operations/operations/${operationId}/restart`,
    });
  },

  async deleteOperation(operationId: string): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/bulk-operations/operations/${operationId}`,
    });
  },
};
