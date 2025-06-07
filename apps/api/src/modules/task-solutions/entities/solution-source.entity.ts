import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { TaskSolution } from './task-solution.entity';

@Entity('solution_sources')
export class SolutionSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @OneToMany('TaskSolution', (solution: TaskSolution) => solution.source)
  solutions: TaskSolution[];
}
