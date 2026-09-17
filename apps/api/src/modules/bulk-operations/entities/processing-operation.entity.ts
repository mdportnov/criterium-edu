import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProcessingStatus, OperationType } from '@app/shared/dto';

/**
 * What an operation stores about itself. The keys below are the ones the code
 * reads; the index signature keeps the column open for whatever else a
 * particular operation type wants to record.
 */
export interface ProcessingOperationMetadata {
  assessmentSessionId?: string;
  restartedAt?: string;
  restartCount?: number;
  solutionIds?: string[];
  llmModel?: string;
  taskId?: string;
  systemPrompt?: string;
  userId?: string;
  sessionName?: string;
  sessionDescription?: string;
  [key: string]: unknown;
}

@Entity('processing_operations')
export class ProcessingOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: OperationType,
  })
  type: OperationType;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  status: ProcessingStatus;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'int', default: 0 })
  processedItems: number;

  @Column({ type: 'int', default: 0 })
  failedItems: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastProgressUpdate?: Date;

  @Column({ type: 'int', default: 30 })
  timeoutMinutes: number;

  @Column({ type: 'json', nullable: true })
  metadata?: ProcessingOperationMetadata;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
