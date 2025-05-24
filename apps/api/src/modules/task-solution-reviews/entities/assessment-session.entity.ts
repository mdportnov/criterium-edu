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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AssessmentSessionStatus,
    default: AssessmentSessionStatus.PENDING,
  })
  status: AssessmentSessionStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'initiated_by_id' })
  initiatedBy: User;

  @Column({ name: 'initiated_by_id' })
  initiatedById: number;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ name: 'task_id', nullable: true })
  taskId?: number;

  @Column({ type: 'varchar', length: 100, default: 'gpt-4o' })
  llmModel: string;

  @Column({ type: 'text', nullable: true })
  systemPrompt?: string;

  @Column({ type: 'json', nullable: true })
  configuration?: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    batchSize?: number;
  };

  @Column({ type: 'json' })
  solutionIds: number[];

  @Column({ type: 'int', default: 0 })
  totalSolutions: number;

  @Column({ type: 'int', default: 0 })
  processedSolutions: number;

  @Column({ type: 'int', default: 0 })
  successfulAssessments: number;

  @Column({ type: 'int', default: 0 })
  failedAssessments: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'json', nullable: true })
  errors?: Array<{
    solutionId: number;
    error: string;
    timestamp: Date;
  }>;

  @Column({ type: 'json', nullable: true })
  statistics?: {
    averageProcessingTime?: number;
    averageScore?: number;
    modelUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost?: number;
    };
    criteriaDistribution?: Record<string, number>;
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
