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

export interface BulkImportSolution {
  studentName: string;
  studentId: string;
  solutionContent: string;
  taskId: string;
  notes?: string;
}

export enum ProcessingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum OperationType {
  BULK_SOLUTION_IMPORT = 'bulk_solution_import',
  LLM_ASSESSMENT = 'llm_assessment',
}

export interface ProcessingOperation {
  id: string;
  type: OperationType;
  status: ProcessingStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMAssessmentRequest {
  solutionIds: string[];
  llmModel?: string;
  taskId?: string;
  systemPrompt?: string;
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
