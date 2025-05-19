import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TaskSolution } from './task-solution.entity';

@Entity('solution_sources')
export class SolutionSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @OneToMany(() => TaskSolution, (solution) => solution.source)
  solutions: TaskSolution[];
}
