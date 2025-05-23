import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from '../tasks/tasks.service';
import { TaskSolutionsService } from '../task-solutions/task-solutions.service';
import { UsersService } from '../users/users.service';
import {
  BulkImportTaskDto,
  CreateTaskDto,
  TaskCriterionDto,
  TaskDto,
  BulkImportSolutionDto,
  ProcessingOperationDto,
  ProcessingStatus,
  OperationType,
  CreateTaskSolutionDto,
  CreateUserDto,
} from '@app/shared/dto';
import { UserRole } from '@app/shared/interfaces';
import { ProcessingOperation } from './entities/processing-operation.entity';
import { User } from '../users/entities/user.entity';
// We'll need a CSV parsing library like 'papaparse' later
// import * as Papa from 'papaparse';

@Injectable()
export class BulkOperationsService {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskSolutionsService: TaskSolutionsService,
    private readonly usersService: UsersService,
    @InjectRepository(ProcessingOperation)
    private readonly processingOperationRepository: Repository<ProcessingOperation>,
  ) {}

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

  async importSolutionsJson(
    solutionsData: BulkImportSolutionDto[],
  ): Promise<ProcessingOperationDto> {
    if (!Array.isArray(solutionsData) || solutionsData.length === 0) {
      throw new BadRequestException(
        'Invalid JSON data: Expected an array of solutions.',
      );
    }

    const operation = await this.createProcessingOperation({
      type: OperationType.BULK_SOLUTION_IMPORT,
      totalItems: solutionsData.length,
      metadata: { taskIds: [...new Set(solutionsData.map(s => s.taskId))] },
    });

    this.processSolutionsAsync(operation.id, solutionsData);

    return this.mapOperationToDto(operation);
  }

  private async processSolutionsAsync(
    operationId: string,
    solutionsData: BulkImportSolutionDto[],
  ): Promise<void> {
    try {
      await this.updateOperationStatus(operationId, ProcessingStatus.IN_PROGRESS);

      const results = [];
      const errors = [];

      for (let i = 0; i < solutionsData.length; i++) {
        const solution = solutionsData[i];
        try {
          const user = await this.findOrCreateUser(solution.studentName, solution.studentId);
          
          const createSolutionDto: CreateTaskSolutionDto = {
            taskId: parseInt(solution.taskId, 10),
            solutionText: solution.solutionContent,
          };

          const createdSolution = await this.taskSolutionsService.create(
            createSolutionDto,
            user,
          );
          results.push(createdSolution);
        } catch (error) {
          errors.push({
            studentName: solution.studentName,
            studentId: solution.studentId,
            error: error.message,
          });
        }

        await this.updateOperationProgress(operationId, i + 1, solutionsData.length);
      }

      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.COMPLETED,
        { successfullyImported: results.length, errors }
      );
    } catch (error) {
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.FAILED,
        undefined,
        error.message
      );
    }
  }

  async createProcessingOperation(data: {
    type: OperationType;
    totalItems: number;
    metadata?: Record<string, any>;
  }): Promise<ProcessingOperation> {
    const operation = this.processingOperationRepository.create({
      type: data.type,
      status: ProcessingStatus.PENDING,
      totalItems: data.totalItems,
      metadata: data.metadata,
    });

    return this.processingOperationRepository.save(operation);
  }

  async updateOperationStatus(
    operationId: string,
    status: ProcessingStatus,
    metadata?: Record<string, any>,
    errorMessage?: string,
  ): Promise<void> {
    await this.processingOperationRepository.update(operationId, {
      status,
      ...(metadata && { metadata }),
      ...(errorMessage && { errorMessage }),
    });
  }

  async updateOperationProgress(
    operationId: string,
    processedItems: number,
    totalItems: number,
  ): Promise<void> {
    const progress = Math.round((processedItems / totalItems) * 100);
    await this.processingOperationRepository.update(operationId, {
      processedItems,
      progress,
    });
  }

  async getOperationStatus(operationId: string): Promise<ProcessingOperationDto> {
    const operation = await this.processingOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      throw new BadRequestException('Operation not found');
    }

    return this.mapOperationToDto(operation);
  }

  async startLLMAssessment(data: {
    solutionIds: string[];
    llmModel?: string;
    taskId?: string;
    systemPrompt?: string;
  }): Promise<ProcessingOperationDto> {
    const operation = await this.createProcessingOperation({
      type: OperationType.LLM_ASSESSMENT,
      totalItems: data.solutionIds.length,
      metadata: { 
        llmModel: data.llmModel,
        taskId: data.taskId,
        systemPrompt: data.systemPrompt,
      },
    });

    this.processLLMAssessmentAsync(operation.id, data);

    return this.mapOperationToDto(operation);
  }

  private async processLLMAssessmentAsync(
    operationId: string,
    data: { solutionIds: string[]; llmModel?: string; taskId?: string; systemPrompt?: string; }
  ): Promise<void> {
    try {
      await this.updateOperationStatus(operationId, ProcessingStatus.IN_PROGRESS);

      const results = [];
      const errors = [];

      for (let i = 0; i < data.solutionIds.length; i++) {
        const solutionId = data.solutionIds[i];
        try {
          // Here we would call the auto-assessment service or implement similar logic
          // For now, we'll simulate the processing
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
          results.push({ solutionId, status: 'processed' });
        } catch (error) {
          errors.push({
            solutionId,
            error: error.message,
          });
        }

        await this.updateOperationProgress(operationId, i + 1, data.solutionIds.length);
      }

      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.COMPLETED,
        { successfullyProcessed: results.length, errors }
      );
    } catch (error) {
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.FAILED,
        undefined,
        error.message
      );
    }
  }

  private async findOrCreateUser(studentName: string, studentId: string): Promise<User> {
    const email = `${studentId}@student.local`;
    
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      const createUserDto: CreateUserDto = {
        email,
        password: 'defaultPassword123!',
        role: UserRole.STUDENT,
        firstName: studentName.split(' ')[0] || studentName,
        lastName: studentName.split(' ').slice(1).join(' ') || 'Student',
      };
      
      user = await this.usersService.create(createUserDto);
    }
    
    return user;
  }

  private mapOperationToDto(operation: ProcessingOperation): ProcessingOperationDto {
    return {
      id: operation.id,
      type: operation.type,
      status: operation.status,
      progress: operation.progress,
      totalItems: operation.totalItems,
      processedItems: operation.processedItems,
      errorMessage: operation.errorMessage,
      metadata: operation.metadata,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt,
    };
  }
}
