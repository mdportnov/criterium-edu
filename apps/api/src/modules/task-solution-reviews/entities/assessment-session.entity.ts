import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { AutoAssessment } from './auto-assessment.entity';

export enum AssessmentSessionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('assessment_sessions')
export class AssessmentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // varchar with a CHECK constraint in the schema, not a native enum type.
  @Column({
    type: 'varchar',
    length: 32,
    default: AssessmentSessionStatus.PENDING,
  })
  status: AssessmentSessionStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'initiated_by_id' })
  initiatedBy: User;

  @Column({ type: 'uuid', name: 'initiated_by_id', nullable: true })
  initiatedById: string;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ type: 'uuid', name: 'task_id', nullable: true })
  taskId?: string;

  @Column({ type: 'varchar', name: 'llm_model', default: 'gpt-4o' })
  llmModel: string;

  @Column({ type: 'text', name: 'system_prompt', nullable: true })
  systemPrompt?: string;

  @Column({ type: 'json', nullable: true })
  configuration?: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    batchSize?: number;
  };

  @Column({ type: 'json', name: 'solution_ids' })
  solutionIds: string[];

  @Column({ type: 'int', name: 'total_solutions', default: 0 })
  totalSolutions: number;

  @Column({ type: 'int', name: 'processed_solutions', default: 0 })
  processedSolutions: number;

  @Column({ type: 'int', name: 'successful_assessments', default: 0 })
  successfulAssessments: number;

  @Column({ type: 'int', name: 'failed_assessments', default: 0 })
  failedAssessments: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number;

  @CreateDateColumn({ name: 'created_at' })
  startedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', name: 'completion_time', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'json', nullable: true })
  errors?: Array<{
    solutionId: string;
    error: string;
    timestamp: Date;
  }> | null;

  @Column({ type: 'json', nullable: true })
  statistics?: null | {
    totalTime?: number;
    averageProcessingTime?: number;
    averageScore?: number;
    modelUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost?: number;
    };
    criteriaDistribution?: Record<string, number>;
    processingTimes?: number[];
    totalAssessments?: number;
    successfulAssessments?: number;
    failedAssessments?: number;
  };

  @Column({ type: 'json', nullable: true })
  metadata?: {
    taskTitle?: string;
    taskDescription?: string;
    taskCriteria?: Array<{
      name: string;
      description: string;
      maxPoints: number;
    }>;
    processingMode?: 'batch' | 'individual';
    retryAttempts?: number;
  };

  @OneToMany(() => AutoAssessment, (assessment) => assessment.sessionId)
  assessments: AutoAssessment[];
}
