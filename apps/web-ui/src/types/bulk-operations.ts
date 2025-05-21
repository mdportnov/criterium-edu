export interface BulkImportTaskCriterion {
  name: string;
  description: string;
  maxPoints: number;
}

export interface BulkImportTask {
  title: string;
  description: string;
  authorSolution?: string;
  categories?: string[];
  tags?: string[];
  criteria?: BulkImportTaskCriterion[];
}

export interface BulkImportResponse {
  success: boolean;
  message: string;
  operationId: string;
  importedCount: number;
  failedCount: number;
  errors?: string[];
}

export interface BulkOperationStatus {
  id: string;
  operation: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedCount: number;
  totalItems: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errors?: string[];
}
