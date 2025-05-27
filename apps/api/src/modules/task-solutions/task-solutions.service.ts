import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskSolution } from './entities/task-solution.entity';
import {
  CreateTaskSolutionDto,
  CurrentUser,
  PaginatedResponse,
  PaginationDto,
  TaskSolutionDto,
  TaskSolutionStatus,
  UpdateTaskSolutionDto,
  UserRole,
} from '@app/shared';
import { Logger } from 'nestjs-pino';

@Injectable()
export class TaskSolutionsService {
  constructor(
    @InjectRepository(TaskSolution)
    private readonly taskSolutionsRepository: Repository<TaskSolution>,
    private readonly logger: Logger,
  ) {}

  // Helper to map TaskSolution entity to TaskSolutionDto
  private mapTaskSolutionToDto(solution: TaskSolution): TaskSolutionDto {
    if (!solution) return null;
    return {
      id: solution.id,
      taskId: solution.task?.id, // Safely access task id
      studentId: solution.user?.id, // Safely access user id
      solutionText: solution.content, // Map entity's content to DTO's solutionText
      status: solution.status,
      submittedAt: solution.createdAt, // Add submittedAt mapping
      createdAt: solution.createdAt,
      updatedAt: solution.updatedAt,
      // Add other fields if present in your DTO and entity
    };
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<TaskSolution> | TaskSolution[]> {
    if (!paginationDto) {
      const solutions = await this.taskSolutionsRepository.find({
        relations: ['task', 'user'],
      });

      this.logger.debug(
        { message: 'Found task solutions', count: solutions.length },
        TaskSolutionsService.name,
      );

      return solutions;
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [solutions, total] = await this.taskSolutionsRepository.findAndCount({
      relations: ['task', 'user'],
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / size);

    this.logger.debug(
      {
        message: 'Found paginated task solutions',
        total,
        page,
        size,
        totalPages,
      },
      TaskSolutionsService.name,
    );

    return {
      data: solutions,
      total,
      page,
      size,
      totalPages,
    };
  }

  async findByStudent(
    studentId: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<TaskSolution> | TaskSolution[]> {
    if (!paginationDto) {
      const solutions = await this.taskSolutionsRepository.find({
        where: { user: { id: studentId } },
        relations: ['task'],
      });

      this.logger.debug(
        {
          message: 'Found student task solutions',
          studentId,
          count: solutions.length,
        },
        TaskSolutionsService.name,
      );

      return solutions;
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [solutions, total] = await this.taskSolutionsRepository.findAndCount({
      where: { user: { id: studentId } },
      relations: ['task'],
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / size);

    this.logger.debug(
      {
        message: 'Found paginated student task solutions',
        studentId,
        total,
        page,
        size,
        totalPages,
      },
      TaskSolutionsService.name,
    );

    return {
      data: solutions,
      total,
      page,
      size,
      totalPages,
    };
  }

  async findByTask(
    taskId: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<TaskSolution> | TaskSolution[]> {
    if (!paginationDto) {
      const solutions = await this.taskSolutionsRepository.find({
        where: { task: { id: taskId } },
        relations: ['user'],
      });

      this.logger.debug(
        {
          message: 'Found task solutions for task',
          taskId,
          count: solutions.length,
        },
        TaskSolutionsService.name,
      );

      return solutions;
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [solutions, total] = await this.taskSolutionsRepository.findAndCount({
      where: { task: { id: taskId } },
      relations: ['user'],
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / size);

    this.logger.debug(
      {
        message: 'Found paginated task solutions for task',
        taskId,
        total,
        page,
        size,
        totalPages,
      },
      TaskSolutionsService.name,
    );

    return {
      data: solutions,
      total,
      page,
      size,
      totalPages,
    };
  }

  async findOne(id: number, user?: CurrentUser): Promise<TaskSolution> {
    const taskSolution = await this.taskSolutionsRepository.findOne({
      where: { id },
      relations: ['task', 'user'], // Ensure task and user are loaded for the DTO
    });

    if (!taskSolution) {
      this.logger.error(
        { message: 'Task solution not found', solutionId: id },
        TaskSolutionsService.name,
      );
      throw new NotFoundException(`Task solution with ID ${id} not found`);
    }

    if (
      user &&
      user.role === UserRole.STUDENT &&
      taskSolution.user?.id !== user.id
    ) {
      this.logger.warn(
        {
          message: 'Access denied to task solution',
          solutionId: id,
          userId: user.id,
          solutionOwnerId: taskSolution.user?.id,
        },
        TaskSolutionsService.name,
      );
      throw new ForbiddenException('You can only view your own solutions');
    }

    this.logger.debug(
      {
        message: 'Found task solution',
        solutionId: id,
        taskId: taskSolution.task?.id,
        studentId: taskSolution.user?.id,
        status: taskSolution.status,
      },
      TaskSolutionsService.name,
    );

    return taskSolution;
  }

  // New method to find one TaskSolution and return as DTO
  async findOneAsDto(id: number): Promise<TaskSolutionDto> {
    // We call the existing findOne but without the user, as CheckerService acts with system privileges
    const taskSolutionEntity = await this.findOne(id);
    // findOne already throws NotFoundException if not found
    return this.mapTaskSolutionToDto(taskSolutionEntity);
  }

  async create(
    createTaskSolutionDto: CreateTaskSolutionDto,
    user: CurrentUser,
  ): Promise<TaskSolution> {
    const taskSolution = this.taskSolutionsRepository.create({
      content: createTaskSolutionDto.solutionText,
      task: { id: createTaskSolutionDto.taskId },
      user: { id: user.id },
      status: TaskSolutionStatus.SUBMITTED,
    });

    const savedSolution = await this.taskSolutionsRepository.save(taskSolution);

    this.logger.debug(
      {
        message: 'Task solution created successfully',
        solutionId: savedSolution.id,
        taskId: createTaskSolutionDto.taskId,
        userId: user.id,
      },
      TaskSolutionsService.name,
    );

    return savedSolution;
  }

  async update(
    id: number,
    updateTaskSolutionDto: UpdateTaskSolutionDto,
    userId: number,
    userRole: UserRole,
  ): Promise<TaskSolution> {
    const taskSolution = await this.findOne(id);

    // Students can only update their own solutions and can't change the status
    if (userRole === UserRole.STUDENT) {
      if (taskSolution.user.id !== userId) {
        this.logger.warn(
          {
            message: "Student attempted to update another user's solution",
            solutionId: id,
            userId,
            solutionOwnerId: taskSolution.user.id,
          },
          TaskSolutionsService.name,
        );
        throw new ForbiddenException('You can only update your own solutions');
      }

      if (updateTaskSolutionDto.status) {
        this.logger.warn(
          {
            message: 'Student attempted to change solution status',
            solutionId: id,
            userId,
            attemptedStatus: updateTaskSolutionDto.status,
          },
          TaskSolutionsService.name,
        );
        throw new ForbiddenException(
          'Students cannot change the status of a solution',
        );
      }

      // Only allow updating solution text if the solution is not already being reviewed
      if (
        taskSolution.status !== TaskSolutionStatus.SUBMITTED &&
        taskSolution.user?.id === userId
      ) {
        this.logger.warn(
          {
            message: 'Student attempted to update solution under review',
            solutionId: id,
            userId,
            currentStatus: taskSolution.status,
          },
          TaskSolutionsService.name,
        );
        throw new ForbiddenException(
          'You cannot update a solution that is already under review or reviewed',
        );
      }
    }

    const { solutionText, ...otherUpdates } = updateTaskSolutionDto;
    const entityUpdates: Partial<TaskSolution> = { ...otherUpdates };
    if (solutionText !== undefined) {
      entityUpdates.content = solutionText;
    }

    this.taskSolutionsRepository.merge(taskSolution, entityUpdates);
    const updatedSolution =
      await this.taskSolutionsRepository.save(taskSolution);

    this.logger.debug(
      {
        message: 'Task solution updated successfully',
        solutionId: id,
        newStatus: updatedSolution.status,
      },
      TaskSolutionsService.name,
    );

    return updatedSolution;
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const taskSolution = await this.findOne(id);

    // Students can only delete their own solutions that haven't been reviewed
    if (userRole === UserRole.STUDENT) {
      if (taskSolution.user.id !== userId) {
        this.logger.warn(
          {
            message: "Student attempted to delete another user's solution",
            solutionId: id,
            userId,
            solutionOwnerId: taskSolution.user.id,
          },
          TaskSolutionsService.name,
        );
        throw new ForbiddenException('You can only delete your own solutions');
      }

      if (taskSolution.status !== TaskSolutionStatus.SUBMITTED) {
        this.logger.warn(
          {
            message: 'Student attempted to delete solution under review',
            solutionId: id,
            userId,
            currentStatus: taskSolution.status,
          },
          TaskSolutionsService.name,
        );
        throw new ForbiddenException(
          'You cannot delete a solution that is under review or already reviewed',
        );
      }
    }

    await this.taskSolutionsRepository.remove(taskSolution);

    this.logger.debug(
      {
        message: 'Task solution removed successfully',
        solutionId: id,
      },
      TaskSolutionsService.name,
    );
  }
}
