import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { BulkImportTaskDto, CreateTaskDto, TaskCriterionDto, TaskDto } from '@app/shared/dto';
// We'll need a CSV parsing library like 'papaparse' later
// import * as Papa from 'papaparse';

@Injectable()
export class BulkOperationsService {
  constructor(private readonly tasksService: TasksService) {}

  async importTasksJson(tasksData: BulkImportTaskDto[], userId: number /* Placeholder for actual user ID */): Promise<{ successfullyImported: number; totalTasks: number; errors: any[] }> {
    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      throw new BadRequestException('Invalid JSON data: Expected an array of tasks.');
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
          criteria: bulkTask.criteria?.map(
            (crit): TaskCriterionDto => ({
              name: crit.name,
              description: crit.description,
              maxPoints: crit.maxPoints,
              // id and checkerComments are optional in TaskCriterionDto and not in BulkImportTaskCriterionDto
            }),
          ) || [],
        };
        
        // Assuming userId will be provided, e.g., from authenticated user or a specific import user
        const createdTask = await this.tasksService.create(createTaskDto, userId); 
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

  async importTasksCsv(fileBuffer: Buffer): Promise<any> {
    const csvString = fileBuffer.toString('utf-8');
    // const parseResult = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    // if (parseResult.errors.length > 0) {
    //   throw new BadRequestException(`CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`);
    // }
    // const tasksData = parseResult.data;
    // Process tasksData similar to importTasksJson
    // This will require careful mapping from CSV columns to TaskDto fields
    // and handling criteria (e.g., from a JSON string in a 'criteria' column)
    console.log('Importing tasks from CSV string of length:', csvString.length);
    // Placeholder implementation
    return { message: 'Successfully imported tasks from CSV. (Placeholder - CSV parsing to be implemented)' };
  }

  async exportTasksJson(): Promise<string> {
    const tasks = await this.tasksService.findAll({}); // Pass appropriate filter options if needed
    return JSON.stringify(tasks, null, 2);
  }

  async exportTasksCsv(): Promise<string> {
    const tasks = await this.tasksService.findAll({}); // Pass appropriate filter options if needed
    // Convert tasks array to CSV string
    // const csvFields = ['id', 'title', 'description', 'status', 'priority', 'criteria_json_string'];
    // const csv = Papa.unparse(tasks.map(task => ({
    //   ...task,
    //   criteria_json_string: JSON.stringify(task.criteria) // Example for criteria
    // })), { fields: csvFields });
    // return csv;
    // Placeholder implementation
    return 'id,title,description\n1,Task A,Description A (Placeholder - CSV generation to be implemented)';
  }
}
