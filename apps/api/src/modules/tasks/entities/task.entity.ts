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
import { TaskCriterion } from './task-criterion.entity';
import { TaskSolution } from '../../task-solutions/entities/task-solution.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  authorSolution: string;

  @Column({ type: 'simple-array', nullable: true })
  categories: string[];

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => TaskCriterion, (criterion) => criterion.task, {
    cascade: true,
    eager: true,
  })
  criteria: TaskCriterion[];

  @OneToMany(() => TaskSolution, (solution) => solution.task)
  solutions: TaskSolution[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
