import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from '../tasks/tasks.service';
import { TaskSolutionsService } from '../task-solutions/task-solutions.service';
import { UsersService } from '../users/users.service';
import { AutoAssessmentService } from '../task-solution-reviews/auto-assessment.service';
import {
  BulkImportSolutionDto,
  BulkImportTaskDto,
  CreateTaskDto,
  CreateTaskSolutionDto,
  CreateUserDto,
  OperationType,
  PaginatedResponse,
  PaginationDto,
  ProcessingOperationDto,
  ProcessingStatus,
  TaskCriterionDto,
  TaskDto,
} from '@app/shared/dto';
import { UserRole } from '@app/shared/interfaces';
import { ProcessingOperation } from './entities/processing-operation.entity';
import { User } from '../users/entities/user.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class BulkOperationsService {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskSolutionsService: TaskSolutionsService,
    private readonly usersService: UsersService,
    private readonly autoAssessmentService: AutoAssessmentService,
    @InjectRepository(ProcessingOperation)
    private readonly processingOperationRepository: Repository<ProcessingOperation>,
    private readonly logger: Logger,
  ) {}

  async importTasksJson(
    tasksData: BulkImportTaskDto[],
    userId: string,
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

    this.logger.log(
      {
        message: 'Starting bulk task import',
        totalTasks: tasksData.length,
        userId,
      },
      BulkOperationsService.name,
    );

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
        this.logger.error(
          {
            message: 'Error importing task',
            taskTitle: bulkTask.title,
            error: error instanceof Error ? error.message : String(error),
          },
          BulkOperationsService.name,
        );
        errors.push({ taskTitle: bulkTask.title, error: error.message });
      }
    }

    this.logger.log(
      {
        message: 'Bulk task import completed',
        successfullyImported: results.length,
        totalTasks: tasksData.length,
        errorCount: errors.length,
      },
      BulkOperationsService.name,
    );

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

    this.logger.log(
      {
        message: 'Starting bulk solution import',
        totalSolutions: solutionsData.length,
        taskIds: [...new Set(solutionsData.map((s) => s.taskId))],
      },
      BulkOperationsService.name,
    );

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
            taskId: solution.taskId,
            solutionText: solution.solutionContent,
          };

          const createdSolution = await this.taskSolutionsService.create(
            createSolutionDto,
            { id: user.id, role: user.role },
          );
          results.push(createdSolution);

          this.logger.debug(
            {
              message: 'Solution imported successfully',
              solutionId: createdSolution.id,
              taskId: solution.taskId,
              studentId: solution.studentId,
              progress: `${i + 1}/${solutionsData.length}`,
            },
            BulkOperationsService.name,
          );
        } catch (error) {
          this.logger.error(
            {
              message: 'Error importing solution',
              studentName: solution.studentName,
              studentId: solution.studentId,
              taskId: solution.taskId,
              error: error instanceof Error ? error.message : String(error),
              progress: `${i + 1}/${solutionsData.length}`,
            },
            BulkOperationsService.name,
          );

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

      this.logger.log(
        {
          message: 'Solution import completed',
          operationId,
          successfullyImported: results.length,
          errorCount: errors.length,
        },
        BulkOperationsService.name,
      );

      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.COMPLETED,
        { successfullyImported: results.length, errors },
      );
    } catch (error) {
      this.logger.error(
        {
          message: 'Solution import process failed',
          operationId,
          error: error instanceof Error ? error.message : String(error),
        },
        BulkOperationsService.name,
      );

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
    failedItems: number = 0,
  ): Promise<void> {
    const progress = Math.round((processedItems / totalItems) * 100);

    await this.processingOperationRepository.update(operationId, {
      processedItems,
      progress,
      failedItems,
      lastProgressUpdate: new Date(),
    });
  }

  async getAllOperations(
    paginationDto?: PaginationDto,
  ): Promise<
    PaginatedResponse<ProcessingOperationDto> | ProcessingOperationDto[]
  > {
    if (!paginationDto) {
      const operations = await this.processingOperationRepository.find({
        order: { createdAt: 'DESC' },
        take: 50, // Limit to last 50 operations
      });

      return operations.map((operation) => this.mapOperationToDto(operation));
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [operations, total] =
      await this.processingOperationRepository.findAndCount({
        skip,
        take: size,
        order: { createdAt: 'DESC' },
      });

    const totalPages = Math.ceil(total / size);

    return {
      data: operations.map((operation) => this.mapOperationToDto(operation)),
      total,
      page,
      size,
      totalPages,
    };
  }

  async getOperationStatus(
    operationId: string,
  ): Promise<ProcessingOperationDto> {
    const operation = await this.processingOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      this.logger.error(
        {
          message: 'Operation not found',
          operationId,
        },
        BulkOperationsService.name,
      );
      throw new BadRequestException('Operation not found');
    }

    return this.mapOperationToDto(operation);
  }

  async startLLMAssessment(data: {
    solutionIds: string[];
    llmModel?: string;
    taskId?: string;
    systemPrompt?: string;
    userId: string;
    sessionName?: string;
    sessionDescription?: string;
  }): Promise<ProcessingOperationDto> {
    this.logger.log(
      {
        message: 'Starting LLM assessment',
        solutionCount: data.solutionIds.length,
        llmModel: data.llmModel,
        taskId: data.taskId,
        userId: data.userId,
      },
      BulkOperationsService.name,
    );

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
      userId: string;
      sessionName?: string;
      sessionDescription?: string;
    },
  ): Promise<void> {
    try {
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.IN_PROGRESS,
      );

      this.logger.debug(
        {
          message: 'Processing LLM assessment asynchronously',
          operationId,
          totalSolutions: data.solutionIds.length,
        },
        BulkOperationsService.name,
      );

      // Create assessment session with comprehensive logging
      const session = await this.autoAssessmentService.createAssessmentSession(
        {
          name: data.sessionName || `Assessment Session ${operationId}`,
          description:
            data.sessionDescription ||
            `Bulk assessment for operation ${operationId}`,
          solutionIds: data.solutionIds,
          llmModel: data.llmModel,
          systemPrompt: data.systemPrompt,
        },
        data.userId,
      );

      // Update operation metadata with session info
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.IN_PROGRESS,
        {
          assessmentSessionId: session.id,
          llmModel: data.llmModel,
          taskId: data.taskId,
          systemPrompt: data.systemPrompt,
          sessionStartTime: new Date().toISOString(),
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
          sessionCompletionTime:
            completedSession.completedAt || new Date().toISOString(),
          totalProcessingTime:
            completedSession.statistics?.averageProcessingTime || 0,
        },
      );
    } catch (error) {
      this.logger.error(
        {
          message: 'LLM assessment process failed',
          operationId,
          error: error instanceof Error ? error.message : String(error),
        },
        BulkOperationsService.name,
      );

      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.FAILED,
        undefined,
        error.message,
      );
    }
  }

  async findOrCreateUser(
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

      this.logger.debug(
        {
          message: 'Creating new user for imported solution',
          studentName,
          studentId,
          email: createUserDto.email,
        },
        BulkOperationsService.name,
      );

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

    this.logger.log(
      {
        message: 'Stopping operation',
        operationId,
        currentStatus: operation.status,
        processedItems: operation.processedItems,
        totalItems: operation.totalItems,
      },
      BulkOperationsService.name,
    );

    // Actually stop the operation by updating its status
    await this.updateOperationStatus(
      operationId,
      ProcessingStatus.FAILED,
      {
        ...operation.metadata,
        stoppedAt: new Date().toISOString(),
        stoppedByUser: true,
      },
      'Operation was manually stopped by user',
    );

    // If it's an LLM assessment, try to stop the assessment session too
    if (
      operation.type === OperationType.LLM_ASSESSMENT &&
      operation.metadata?.assessmentSessionId
    ) {
      try {
        await this.autoAssessmentService.stopSession(
          operation.metadata.assessmentSessionId,
        );
      } catch (error) {
        this.logger.warn(
          {
            message: 'Failed to stop assessment session',
            operationId,
            assessmentSessionId: operation.metadata.assessmentSessionId,
            error: error.message,
          },
          BulkOperationsService.name,
        );
      }
    }

    return this.getOperationStatus(operationId);
  }

  async restartOperation(operationId: string): Promise<ProcessingOperationDto> {
    const operation = await this.processingOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      throw new BadRequestException('Operation not found');
    }

    this.logger.log(
      {
        message: 'Restarting operation',
        operationId,
        type: operation.type,
        currentStatus: operation.status,
      },
      BulkOperationsService.name,
    );

    // Create a new operation object with updated metadata
    if (operation.metadata) {
      operation.metadata.restartedAt = new Date().toISOString();
      operation.metadata.restartCount =
        (operation.metadata.restartCount || 0) + 1;
    } else {
      operation.metadata = {
        restartedAt: new Date().toISOString(),
        restartCount: 1,
      };
    }

    // Update other fields
    operation.status = ProcessingStatus.PENDING;
    operation.processedItems = 0;
    operation.progress = 0;
    operation.errorMessage = null;

    // Re-process based on operation type
    if (operation.type === OperationType.LLM_ASSESSMENT) {
      try {
        // For LLM assessments, we can restart with the stored metadata
        const restartData = {
          solutionIds: operation.metadata.solutionIds || [],
          llmModel: operation.metadata.llmModel,
          taskId: operation.metadata.taskId,
          systemPrompt: operation.metadata.systemPrompt,
          userId: operation.metadata.userId,
          sessionName:
            operation.metadata.sessionName ||
            `Restarted Assessment ${operationId}`,
          sessionDescription:
            operation.metadata.sessionDescription ||
            `Restarted LLM assessment for operation ${operationId}`,
        };

        // Create a new assessment session for restart
        await this.processLLMAssessmentAsync(operationId, restartData);
      } catch (error) {
        await this.updateOperationStatus(
          operationId,
          ProcessingStatus.FAILED,
          operation.metadata,
          `Restart failed: ${error.message}`,
        );
      }
    } else if (operation.type === OperationType.BULK_SOLUTION_IMPORT) {
      // For bulk solution imports, we would need to store the original data
      // This is a more complex case as we need the original solutions data
      await this.updateOperationStatus(
        operationId,
        ProcessingStatus.FAILED,
        operation.metadata,
        'Cannot restart bulk import operations - original data not stored',
      );
    }

    return this.getOperationStatus(operationId);
  }

  async deleteOperation(operationId: string): Promise<void> {
    const operation = await this.processingOperationRepository.findOne({
      where: { id: operationId },
    });

    if (!operation) {
      throw new NotFoundException('Operation not found');
    }

    if (
      operation.status === ProcessingStatus.IN_PROGRESS ||
      operation.status === ProcessingStatus.PENDING
    ) {
      throw new BadRequestException(
        'Cannot delete operation that is still in progress. Stop the operation first.',
      );
    }

    await this.processingOperationRepository.delete(operationId);
  }

  async checkAndHandleStuckOperations(): Promise<{
    checkedCount: number;
    stuckCount: number;
    handledOperations: string[];
  }> {
    const timeoutThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const stuckOperations = await this.processingOperationRepository
      .createQueryBuilder('operation')
      .where('operation.status IN (:...statuses)', {
        statuses: [ProcessingStatus.IN_PROGRESS, ProcessingStatus.PENDING],
      })
      .andWhere(
        '(operation.lastProgressUpdate IS NULL AND operation.createdAt < :timeoutThreshold) OR ' +
          '(operation.lastProgressUpdate IS NOT NULL AND operation.lastProgressUpdate < :timeoutThreshold)',
        { timeoutThreshold },
      )
      .getMany();

    const handledOperations: string[] = [];

    for (const operation of stuckOperations) {
      try {
        this.logger.warn(
          {
            message: 'Detected stuck operation',
            operationId: operation.id,
            type: operation.type,
            status: operation.status,
            createdAt: operation.createdAt,
            lastProgressUpdate: operation.lastProgressUpdate,
            processedItems: operation.processedItems,
            totalItems: operation.totalItems,
          },
          BulkOperationsService.name,
        );

        // Mark operation as failed due to timeout
        await this.updateOperationStatus(
          operation.id,
          ProcessingStatus.FAILED,
          {
            ...operation.metadata,
            timeoutAt: new Date().toISOString(),
            reason: 'Operation timed out - no progress for 30 minutes',
            originalStatus: operation.status,
          },
          'Operation timed out due to no progress updates for 30 minutes',
        );

        // Try to stop related services
        if (
          operation.type === OperationType.LLM_ASSESSMENT &&
          operation.metadata?.assessmentSessionId
        ) {
          try {
            await this.autoAssessmentService.stopSession(
              operation.metadata.assessmentSessionId,
            );
          } catch (error) {
            this.logger.warn(
              {
                message: 'Failed to stop stuck assessment session',
                operationId: operation.id,
                assessmentSessionId: operation.metadata.assessmentSessionId,
                error: error.message,
              },
              BulkOperationsService.name,
            );
          }
        }

        handledOperations.push(operation.id);
      } catch (error) {
        this.logger.error(
          {
            message: 'Failed to handle stuck operation',
            operationId: operation.id,
            error: error.message,
          },
          BulkOperationsService.name,
        );
      }
    }

    this.logger.log(
      {
        message: 'Stuck operations check completed',
        checkedCount: stuckOperations.length,
        handledCount: handledOperations.length,
      },
      BulkOperationsService.name,
    );

    return {
      checkedCount: stuckOperations.length,
      stuckCount: handledOperations.length,
      handledOperations,
    };
  }

  private mapOperationToDto(
    operation: ProcessingOperation,
  ): ProcessingOperationDto {
    return {
      id: operation.id,
      type: operation.type,
      status: operation.status,
      totalItems: operation.totalItems,
      processedItems: operation.processedItems,
      failedItems: operation.failedItems || 0,
      progress: operation.progress,
      metadata: operation.metadata,
      errorMessage: operation.errorMessage,
      lastProgressUpdate: operation.lastProgressUpdate,
      timeoutMinutes: operation.timeoutMinutes,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt,
    };
  }
}
