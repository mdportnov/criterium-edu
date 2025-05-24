import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from '../tasks/tasks.service';
import { TaskSolutionsService } from '../task-solutions/task-solutions.service';
import { UsersService } from '../users/users.service';
import { AutoAssessmentService } from '../task-solution-reviews/auto-assessment.service';
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

@Injectable()
export class BulkOperationsService {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskSolutionsService: TaskSolutionsService,
    private readonly usersService: UsersService,
    private readonly autoAssessmentService: AutoAssessmentService,
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
    return JSON.stringify(tasks, null, 2);
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
      metadata: { taskIds: [...new Set(solutionsData.map((s) => s.taskId))] },
    });

    await this.processSolutionsAsync(operation.id, solutionsData);

    return this.mapOperationToDto(operation);
  }

  private async processSolutionsAsync(
    operationId: string,
    solutionsData: BulkImportSolutionDto[],
  ): Promise<void> {
    try {
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.IN_PROGRESS,
      );

      const results = [];
      const errors = [];

      for (let i = 0; i < solutionsData.length; i++) {
        const solution = solutionsData[i];
        try {
          const user = await this.findOrCreateUser(
            solution.studentName,
            solution.studentId,
          );

          const createSolutionDto: CreateTaskSolutionDto = {
            taskId: parseInt(solution.taskId, 10),
            solutionText: solution.solutionContent,
          };

          const createdSolution = await this.taskSolutionsService.create(
            createSolutionDto,
            { id: user.id, role: user.role },
          );
          results.push(createdSolution);
        } catch (error) {
          errors.push({
            studentName: solution.studentName,
            studentId: solution.studentId,
            error: error.message,
          });
        }

        await this.updateOperationProgress(
          operationId,
          i + 1,
          solutionsData.length,
        );
      }

      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.COMPLETED,
        { successfullyImported: results.length, errors },
      );
    } catch (error) {
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.FAILED,
        undefined,
        error.message,
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

  async getAllOperations(): Promise<ProcessingOperationDto[]> {
    const operations = await this.processingOperationRepository.find({
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 operations
    });

    return operations.map((operation) => this.mapOperationToDto(operation));
  }

  async getOperationStatus(
    operationId: string,
  ): Promise<ProcessingOperationDto> {
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
    userId: number;
    sessionName?: string;
    sessionDescription?: string;
  }): Promise<ProcessingOperationDto> {
    const operation = await this.createProcessingOperation({
      type: OperationType.LLM_ASSESSMENT,
      totalItems: data.solutionIds.length,
      metadata: {
        llmModel: data.llmModel,
        taskId: data.taskId,
        systemPrompt: data.systemPrompt,
        userId: data.userId,
        sessionName: data.sessionName,
        sessionDescription: data.sessionDescription,
      },
    });

    await this.processLLMAssessmentAsync(operation.id, data);

    return this.mapOperationToDto(operation);
  }

  private async processLLMAssessmentAsync(
    operationId: string,
    data: {
      solutionIds: string[];
      llmModel?: string;
      taskId?: string;
      systemPrompt?: string;
      userId: number;
      sessionName?: string;
      sessionDescription?: string;
    },
  ): Promise<void> {
    try {
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.IN_PROGRESS,
      );

      // Create assessment session with comprehensive logging
      const session = await this.autoAssessmentService.createAssessmentSession({
        name: data.sessionName || `Assessment Session ${operationId}`,
        description:
          data.sessionDescription ||
          `Bulk assessment for operation ${operationId}`,
        solutionIds: data.solutionIds.map((id) => parseInt(id, 10)),
        llmModel: data.llmModel,
        systemPrompt: data.systemPrompt,
        userId: data.userId,
      });

      // Update operation metadata with session info
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.IN_PROGRESS,
        {
          assessmentSessionId: session.id,
          llmModel: data.llmModel,
          taskId: data.taskId,
          systemPrompt: data.systemPrompt,
          sessionStartTime: new Date(),
        },
      );

      // Process the assessment session
      const completedSession =
        await this.autoAssessmentService.processAssessmentSession(session.id);

      // Update operation with final results
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.COMPLETED,
        {
          assessmentSessionId: completedSession.id,
          sessionStatus: completedSession.status,
          totalSolutions: completedSession.totalSolutions,
          successfulAssessments: completedSession.successfulAssessments,
          failedAssessments: completedSession.failedAssessments,
          totalTokens:
            completedSession.statistics?.modelUsage?.totalTokens || 0,
          totalCost:
            completedSession.statistics?.modelUsage?.estimatedCost || 0,
          averageScore: completedSession.statistics?.averageScore || 0,
          sessionCompletionTime: completedSession.completedAt || new Date(),
          totalProcessingTime:
            completedSession.statistics?.averageProcessingTime || 0,
        },
      );
    } catch (error) {
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.FAILED,
        undefined,
        (error as Error).message,
      );
    }
  }

  private async findOrCreateUser(
    studentName: string,
    studentId: string,
  ): Promise<User> {
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

  async stopOperation(operationId: string): Promise<ProcessingOperationDto> {
    const operation = await this.processingOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      throw new BadRequestException('Operation not found');
    }

    if (
      operation.status === ProcessingStatus.COMPLETED ||
      operation.status === ProcessingStatus.FAILED
    ) {
      throw new BadRequestException(
        `Cannot stop ${operation.status} operation`,
      );
    }

    // If it's an LLM assessment operation, also stop the assessment session
    if (
      operation.type === OperationType.LLM_ASSESSMENT &&
      operation.metadata?.assessmentSessionId
    ) {
      try {
        await this.autoAssessmentService.stopSession(
          operation.metadata.assessmentSessionId,
        );
      } catch (error) {
        console.error('Error stopping assessment session:', error);
      }
    }

    await this.updateOperationStatus(
      operationId,
      ProcessingStatus.FAILED,
      { ...operation.metadata, stoppedByUser: true },
      'Operation stopped by user',
    );

    return this.getOperationStatus(operationId);
  }

  async restartOperation(operationId: string): Promise<ProcessingOperationDto> {
    const operation = await this.processingOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      throw new BadRequestException('Operation not found');
    }

    if (operation.status !== ProcessingStatus.FAILED) {
      throw new BadRequestException('Only failed operations can be restarted');
    }

    // Reset operation to initial state
    await this.processingOperationRepository.update(operationId, {
      status: ProcessingStatus.PENDING,
      processedItems: 0,
      progress: 0,
      errorMessage: null,
    });

    // If it's an LLM assessment operation, restart the assessment session and reprocess
    if (
      operation.type === OperationType.LLM_ASSESSMENT &&
      operation.metadata?.assessmentSessionId
    ) {
      try {
        await this.autoAssessmentService.restartSession(
          operation.metadata.assessmentSessionId,
        );

        // Restart the processing
        const restartData = {
          solutionIds: operation.metadata.solutionIds || [],
          llmModel: operation.metadata.llmModel,
          taskId: operation.metadata.taskId,
          systemPrompt: operation.metadata.systemPrompt,
          userId: operation.metadata.userId,
          sessionName: operation.metadata.sessionName,
          sessionDescription: operation.metadata.sessionDescription,
        };

        await this.processLLMAssessmentAsync(operationId, restartData);
      } catch (error) {
        await this.updateOperationStatus(
          operationId,
          ProcessingStatus.FAILED,
          operation.metadata,
          `Restart failed: ${error.message}`,
        );
      }
    }

    return this.getOperationStatus(operationId);
  }

  private mapOperationToDto(
    operation: ProcessingOperation,
  ): ProcessingOperationDto {
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
