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
import { User } from '../../users/entities/user.entity';
import type { TaskSolutionReview } from '../../task-solution-reviews/entities/task-solution-review.entity';
import type { SolutionSource } from './solution-source.entity';
import { TaskSolutionStatus } from '@app/shared';

// Interface to avoid circular import with Task
interface ITask {
  id: string;
  title: string;
  description: string;
  criteria: any[];
}

@Entity('task_solutions')
export class TaskSolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  externalId: string;

  @Column({
    type: 'enum',
    enum: TaskSolutionStatus,
    default: TaskSolutionStatus.SUBMITTED,
  })
  status: TaskSolutionStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne('Task')
  @JoinColumn({ name: 'task_id' })
  task: ITask;

  @ManyToOne('SolutionSource', { nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SolutionSource;

  @OneToMany('TaskSolutionReview', (review: TaskSolutionReview) => review.taskSolution)
  reviews: TaskSolutionReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
