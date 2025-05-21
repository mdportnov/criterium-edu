import { Module } from '@nestjs/common';
import { CheckerService } from './checker.service';
import { CheckerController } from './checker.controller';
import { TasksModule } from '../tasks/tasks.module';
import { TaskSolutionsModule } from '../task-solutions/task-solutions.module';
import { TaskSolutionReviewsModule } from '../task-solution-reviews/task-solution-reviews.module';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [
    TasksModule,
    TaskSolutionsModule,
    TaskSolutionReviewsModule,
    OpenaiModule,
  ],
  providers: [CheckerService],
  controllers: [CheckerController],
  exports: [CheckerService],
})
export class CheckerModule {}
