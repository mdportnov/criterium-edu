import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';

@Entity('api_usage')
@Index('IDX_api_usage_task_id', ['taskId'])
@Index('IDX_api_usage_user_id', ['userId'])
@Index('IDX_api_usage_created_at', ['createdAt'])
@Index('IDX_api_usage_operation_type', ['operationType'])
export class ApiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  taskId?: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar' })
  operationType: string;

  @Column({ type: 'varchar', default: 'openai' })
  provider: string;

  @Column({ type: 'varchar' })
  model: string;

  @Column({ type: 'integer', default: 0 })
  promptTokens: number;

  @Column({ type: 'integer', default: 0 })
  completionTokens: number;

  @Column({ type: 'integer', default: 0 })
  totalTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  costUsd: number;

  @Column({ type: 'integer', nullable: true })
  requestDuration?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'taskId' })
  task?: Task;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
