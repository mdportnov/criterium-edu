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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxPoints: number;

  @Column({ type: 'text', nullable: true })
  checkerComments: string;

  @Column({ type: 'int' })
  taskId: number;

  @ManyToOne(() => Task, (task) => task.criteria, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}
