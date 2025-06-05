import { ApiProperty } from '@nestjs/swagger';

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

export class ProcessingOperationDto {
  @ApiProperty({
    description: 'Unique operation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Type of operation',
    enum: OperationType,
  })
  type: OperationType;

  @ApiProperty({
    description: 'Current status of the operation',
    enum: ProcessingStatus,
  })
  status: ProcessingStatus;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 45,
  })
  progress: number;

  @ApiProperty({
    description: 'Total items to process',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Items processed so far',
    example: 45,
  })
  processedItems: number;

  @ApiProperty({
    description: 'Items that failed processing',
    example: 5,
  })
  failedItems: number;

  @ApiProperty({
    description: 'Timeout in minutes',
    example: 30,
  })
  timeoutMinutes: number;

  @ApiProperty({
    description: 'Error message if failed',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Last progress update timestamp',
    required: false,
  })
  lastProgressUpdate?: Date;
}
