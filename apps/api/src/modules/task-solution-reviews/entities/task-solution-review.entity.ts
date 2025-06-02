import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewSource } from '@app/shared';
import { User } from '../../users/entities/user.entity';
import { TaskSolution } from '../../task-solutions/entities/task-solution.entity';
import { CriterionScore } from './criterion-score.entity';

@Entity('task_solution_reviews')
export class TaskSolutionReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  taskSolutionId: string;

  @ManyToOne(() => TaskSolution)
  @JoinColumn({ name: 'taskSolutionId' })
  taskSolution: TaskSolution;

  @Column({ type: 'uuid', nullable: true })
  reviewerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @OneToMany(() => CriterionScore, (criterionScore) => criterionScore.review, {
    cascade: true,
    eager: true,
  })
  criteriaScores: CriterionScore[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalScore: number;

  @Column({ type: 'text' })
  feedbackToStudent: string;

  @Column({ type: 'text', nullable: true })
  reviewerComment: string;

  @Column({
    type: 'enum',
    enum: ReviewSource,
    default: ReviewSource.AUTO,
  })
  source: ReviewSource;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
