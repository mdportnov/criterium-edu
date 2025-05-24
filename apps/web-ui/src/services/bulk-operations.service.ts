import { apiRequest } from './api';
import type {
  BulkImportResponse,
  BulkOperationStatus,
  BulkImportSolution,
  ProcessingOperation,
  LLMAssessmentRequest,
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

  async getAllProcessingOperations(): Promise<ProcessingOperation[]> {
    return apiRequest<ProcessingOperation[]>({
      method: 'GET',
      url: '/bulk-operations/operations',
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
};
