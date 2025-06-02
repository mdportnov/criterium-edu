import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskSolutionReview } from './task-solution-review.entity';
import { TaskCriterion } from '../../tasks/entities/task-criterion.entity';

@Entity('criterion_scores')
export class CriterionScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reviewId: string;

  @ManyToOne(() => TaskSolutionReview, (review) => review.criteriaScores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reviewId' })
  review: TaskSolutionReview;

  @Column({ type: 'uuid' })
  criterionId: string;

  @ManyToOne(() => TaskCriterion)
  @JoinColumn({ name: 'criterionId' })
  criterion: TaskCriterion;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string;
}
