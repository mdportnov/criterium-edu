import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskSolution } from './entities/task-solution.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateTaskSolutionDto,
  TaskSolutionStatus,
  UpdateTaskSolutionDto,
  UserRole,
  TaskSolutionDto,
} from '@app/shared';

@Injectable()
export class TaskSolutionsService {
  constructor(
    @InjectRepository(TaskSolution)
    private readonly taskSolutionsRepository: Repository<TaskSolution>,
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

  async findAll(): Promise<TaskSolution[]> {
    return this.taskSolutionsRepository.find({
      relations: ['task', 'user'],
    });
  }

  async findByStudent(studentId: number): Promise<TaskSolution[]> {
    return this.taskSolutionsRepository.find({
      where: { user: { id: studentId } },
      relations: ['task'],
    });
  }

  async findByTask(taskId: number): Promise<TaskSolution[]> {
    return this.taskSolutionsRepository.find({
      where: { task: { id: taskId } },
      relations: ['user'],
    });
  }

  async findOne(id: number, user?: User): Promise<TaskSolution> {
    const taskSolution = await this.taskSolutionsRepository.findOne({
      where: { id },
      relations: ['task', 'user'], // Ensure task and user are loaded for the DTO
    });

    if (!taskSolution) {
      throw new NotFoundException(`Task solution with ID ${id} not found`);
    }

    if (
      user &&
      user.role === UserRole.STUDENT &&
      taskSolution.user?.id !== user.id
    ) {
      throw new ForbiddenException('You can only view your own solutions');
    }

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
    user: User,
  ): Promise<TaskSolution> {
    const taskSolution = this.taskSolutionsRepository.create({
      content: createTaskSolutionDto.solutionText,
      task: { id: createTaskSolutionDto.taskId },
      user: user,
      status: TaskSolutionStatus.SUBMITTED,
    });

    return this.taskSolutionsRepository.save(taskSolution);
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
        throw new ForbiddenException('You can only update your own solutions');
      }

      if (updateTaskSolutionDto.status) {
        throw new ForbiddenException(
          'Students cannot change the status of a solution',
        );
      }

      // Only allow updating solution text if the solution is not already being reviewed
      if (
        taskSolution.status !== TaskSolutionStatus.SUBMITTED &&
        taskSolution.user?.id === userId
      ) {
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
    return this.taskSolutionsRepository.save(taskSolution);
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const taskSolution = await this.findOne(id);

    // Students can only delete their own solutions that haven't been reviewed
    if (userRole === UserRole.STUDENT) {
      if (taskSolution.user.id !== userId) {
        throw new ForbiddenException('You can only delete your own solutions');
      }

      if (taskSolution.status !== TaskSolutionStatus.SUBMITTED) {
        throw new ForbiddenException(
          'You cannot delete a solution that is under review or already reviewed',
        );
      }
    }

    await this.taskSolutionsRepository.remove(taskSolution);
  }
}
