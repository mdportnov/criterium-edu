import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulkOperationsController } from './bulk-operations.controller';
import { BulkOperationsService } from './bulk-operations.service';
import { TasksModule } from '../tasks/tasks.module';
import { TaskSolutionsModule } from '../task-solutions/task-solutions.module';
import { UsersModule } from '../users/users.module';
import { TaskSolutionReviewsModule } from '../task-solution-reviews/task-solution-reviews.module';
import { ProcessingOperation } from './entities/processing-operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessingOperation]),
    TasksModule,
    TaskSolutionsModule,
    UsersModule,
    TaskSolutionReviewsModule,
  ],
  controllers: [BulkOperationsController],
  providers: [BulkOperationsService],
  exports: [BulkOperationsService],
})
export class BulkOperationsModule {}
