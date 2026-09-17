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
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  // The model's reply verbatim. It was declared json, but what actually gets
  // stored is the message text, which is not a JSON document - models wrap
  // the payload in prose or fences often enough that it frequently was not
  // even valid JSON.
  @Column({ type: 'text', nullable: true })
  rawResponse: string | null;

  @Column({ type: 'int', nullable: true })
  tokenUsage: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  cost: number;

  @Column({ type: 'int', nullable: true })
  processingTime: number;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
