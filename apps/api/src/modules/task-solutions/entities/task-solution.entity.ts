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
import { Task } from '../../tasks/entities/task.entity';
import { TaskSolutionReview } from '../../task-solution-reviews/entities/task-solution-review.entity';
import { SolutionSource } from './solution-source.entity';
import { TaskSolutionStatus } from '@app/shared';

@Entity('task_solutions')
export class TaskSolution {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => SolutionSource, { nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SolutionSource;

  @OneToMany(() => TaskSolutionReview, (review) => review.taskSolution)
  reviews: TaskSolutionReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
