import { Module } from '@nestjs/common';
import { CheckerService } from './checker.service';
import { CheckerController } from './checker.controller';
import { TasksModule } from '../tasks/tasks.module';
import { TaskSolutionsModule } from '../task-solutions/task-solutions.module';
import { TaskSolutionReviewsModule } from '../task-solution-reviews/task-solution-reviews.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    TasksModule,
    TaskSolutionsModule,
    TaskSolutionReviewsModule,
    LlmModule,
  ],
  providers: [CheckerService],
  controllers: [CheckerController],
  exports: [CheckerService],
})
export class CheckerModule {}
