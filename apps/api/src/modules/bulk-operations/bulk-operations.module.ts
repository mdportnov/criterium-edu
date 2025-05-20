import { Module } from '@nestjs/common';
import { BulkOperationsController } from './bulk-operations.controller';
import { BulkOperationsService } from './bulk-operations.service';
import { TasksModule } from '../tasks/tasks.module'; // Likely needed to interact with TasksService/Repository

@Module({
  imports: [TasksModule], // Import TasksModule to use TasksService for CRUD operations
  controllers: [BulkOperationsController],
  providers: [BulkOperationsService],
})
export class BulkOperationsModule {}
