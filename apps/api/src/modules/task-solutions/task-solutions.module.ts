import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSolution } from './entities/task-solution.entity';
import { TaskSolutionsService } from './task-solutions.service';
import { TaskSolutionsController } from './task-solutions.controller';
import { SolutionSource } from './entities/solution-source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskSolution, SolutionSource])],
  providers: [TaskSolutionsService],
  controllers: [TaskSolutionsController],
  exports: [TaskSolutionsService],
})
export class TaskSolutionsModule {}
