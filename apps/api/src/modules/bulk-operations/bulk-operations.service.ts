import { Injectable, BadRequestException } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import {
  BulkImportTaskDto,
  CreateTaskDto,
  TaskCriterionDto,
  TaskDto,
} from '@app/shared/dto';
// We'll need a CSV parsing library like 'papaparse' later
// import * as Papa from 'papaparse';

@Injectable()
export class BulkOperationsService {
  constructor(private readonly tasksService: TasksService) {}

  async importTasksJson(
    tasksData: BulkImportTaskDto[],
    userId: number /* Placeholder for actual user ID */,
  ): Promise<{
    successfullyImported: number;
    totalTasks: number;
    errors: any[];
  }> {
    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      throw new BadRequestException(
        'Invalid JSON data: Expected an array of tasks.',
      );
    }

    const results: TaskDto[] = [];
    const errors = [];

    for (const bulkTask of tasksData) {
      try {
        // Map BulkImportTaskDto and its criteria to CreateTaskDto and TaskCriterionDto
        const createTaskDto: CreateTaskDto = {
          title: bulkTask.title,
          description: bulkTask.description,
          authorSolution: bulkTask.authorSolution,
          categories: bulkTask.categories || [],
          tags: bulkTask.tags || [],
          criteria:
            bulkTask.criteria?.map(
              (crit): TaskCriterionDto => ({
                name: crit.name,
                description: crit.description,
                maxPoints: crit.maxPoints,
                // id and checkerComments are optional in TaskCriterionDto and not in BulkImportTaskCriterionDto
              }),
            ) || [],
        };

        // Assuming userId will be provided, e.g., from authenticated user or a specific import user
        const createdTask = await this.tasksService.create(
          createTaskDto,
          userId,
        );
        results.push(createdTask);
      } catch (error) {
        errors.push({ taskTitle: bulkTask.title, error: error.message });
      }
    }

    return {
      successfullyImported: results.length,
      totalTasks: tasksData.length,
      errors,
    };
  }

  async exportTasksJson(): Promise<string> {
    const tasks = await this.tasksService.findAll();
    return JSON.stringify(tasks, null, 2); // Pretty print JSON
  }
}
