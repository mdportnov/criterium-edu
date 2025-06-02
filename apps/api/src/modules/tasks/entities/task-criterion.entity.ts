import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_criteria')
export class TaskCriterion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxPoints: number;

  @Column({ type: 'text', nullable: true })
  checkerComments: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.criteria, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}
