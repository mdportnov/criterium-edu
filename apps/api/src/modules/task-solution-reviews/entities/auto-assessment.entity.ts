import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskSolution } from '../../task-solutions/entities/task-solution.entity';

@Entity('auto_assessments')
export class AutoAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TaskSolution)
  @JoinColumn({ name: 'solution_id' })
  solution: TaskSolution;

  @Column({ type: 'json' })
  criteriaScores: Record<string, number>;

  @Column({ type: 'text' })
  comments: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  totalScore: number;

  @Column({ type: 'varchar' })
  llmModel: string;

  @Column({ type: 'text', nullable: true })
  promptUsed: string;

  @Column({ type: 'json', nullable: true })
  rawResponse: object;

  @Column({ type: 'int', nullable: true })
  tokenUsage: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  cost: number;

  @Column({ type: 'int', nullable: true })
  processingTime: number;

  @Column({ type: 'int', nullable: true })
  sessionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
