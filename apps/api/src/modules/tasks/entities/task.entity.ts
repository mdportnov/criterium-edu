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

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'int' })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => TaskCriterion, (criterion) => criterion.task, {
    cascade: true,
    eager: true,
  })
  criteria: TaskCriterion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
