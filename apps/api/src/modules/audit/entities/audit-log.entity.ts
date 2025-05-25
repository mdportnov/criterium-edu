import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
@Index('IDX_AUDIT_LOGS_USER_ID', ['user'])
@Index('IDX_AUDIT_LOGS_ACTION', ['action'])
@Index('IDX_AUDIT_LOGS_RESOURCE', ['resourceType', 'resourceId'])
@Index('IDX_AUDIT_LOGS_CREATED_AT', ['createdAt'])
@Index('IDX_AUDIT_LOGS_USER_CREATED', ['user', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ length: 255 })
  action: string;

  @Column({ name: 'resource_type', length: 100, nullable: true })
  resourceType?: string;

  @Column({ name: 'resource_id', length: 255, nullable: true })
  resourceId?: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ length: 10 })
  method: string;

  @Column({ length: 500 })
  url: string;

  @Column({ name: 'status_code', nullable: true })
  statusCode?: number;

  @Column({ name: 'request_data', type: 'jsonb', nullable: true })
  requestData?: any;

  @Column({ name: 'response_data', type: 'jsonb', nullable: true })
  responseData?: any;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
