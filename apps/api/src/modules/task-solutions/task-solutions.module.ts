import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSolution } from './entities/task-solution.entity';
import { TaskSolutionsService } from './task-solutions.service';
import { TaskSolutionsController } from './task-solutions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskSolution])],
  providers: [TaskSolutionsService],
  controllers: [TaskSolutionsController],
  exports: [TaskSolutionsService],
})
export class TaskSolutionsModule {}
