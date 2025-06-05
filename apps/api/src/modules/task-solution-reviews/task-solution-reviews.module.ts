import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSolutionReview } from './entities/task-solution-review.entity';
import { CriterionScore } from './entities/criterion-score.entity';
import { AutoAssessment } from './entities/auto-assessment.entity';
import { AssessmentSession } from './entities/assessment-session.entity';
import { TaskSolutionReviewsService } from './task-solution-reviews.service';
import { TaskSolutionReviewsController } from './task-solution-reviews.controller';
import { AutoAssessmentController } from './auto-assessment.controller';
import { AutoAssessmentService } from './auto-assessment.service';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TaskSolutionsModule } from '../task-solutions/task-solutions.module';
import { SharedModule } from '../shared/shared.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskSolutionReview,
      CriterionScore,
      AutoAssessment,
      AssessmentSession,
      TaskSolution,
      Task,
      User,
    ]),
    TaskSolutionsModule,
    SharedModule,
    SettingsModule,
  ],
  providers: [TaskSolutionReviewsService, AutoAssessmentService],
  controllers: [TaskSolutionReviewsController, AutoAssessmentController],
  exports: [TaskSolutionReviewsService, AutoAssessmentService],
})
export class TaskSolutionReviewsModule {}
