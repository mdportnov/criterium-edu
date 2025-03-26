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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  taskSolutionId: number;

  @ManyToOne(() => TaskSolution)
  @JoinColumn({ name: 'taskSolutionId' })
  taskSolution: TaskSolution;

  @Column({ type: 'int', nullable: true })
  mentorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'mentorId' })
  mentor: User;

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
  mentorComment: string;

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
