import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSolutionReview } from './entities/task-solution-review.entity';
import { CriterionScore } from './entities/criterion-score.entity';
import { TaskSolutionReviewsService } from './task-solution-reviews.service';
import { TaskSolutionReviewsController } from './task-solution-reviews.controller';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';
import { TaskSolutionsModule } from '../task-solutions/task-solutions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskSolutionReview,
      CriterionScore,
      TaskSolution,
    ]),
    TaskSolutionsModule,
  ],
  providers: [TaskSolutionReviewsService],
  controllers: [TaskSolutionReviewsController],
  exports: [TaskSolutionReviewsService],
})
export class TaskSolutionReviewsModule {}
