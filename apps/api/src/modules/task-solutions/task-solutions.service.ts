import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskSolution } from './entities/task-solution.entity';
import {
  CreateTaskSolutionDto,
  TaskSolutionStatus,
  UpdateTaskSolutionDto,
  UserRole,
} from '@app/shared';

@Injectable()
export class TaskSolutionsService {
  constructor(
    @InjectRepository(TaskSolution)
    private readonly taskSolutionsRepository: Repository<TaskSolution>,
  ) {}

  async findAll(): Promise<TaskSolution[]> {
    return this.taskSolutionsRepository.find({
      relations: ['task', 'student'],
    });
  }

  async findByStudent(studentId: number): Promise<TaskSolution[]> {
    return this.taskSolutionsRepository.find({
      where: { studentId },
      relations: ['task'],
    });
  }

  async findByTask(taskId: number): Promise<TaskSolution[]> {
    return this.taskSolutionsRepository.find({
      where: { taskId },
      relations: ['student'],
    });
  }

  async findOne(id: number): Promise<TaskSolution> {
    const taskSolution = await this.taskSolutionsRepository.findOne({
      where: { id },
      relations: ['task', 'student'],
    });

    if (!taskSolution) {
      throw new NotFoundException(`Task solution with ID ${id} not found`);
    }

    return taskSolution;
  }

  async create(
    createTaskSolutionDto: CreateTaskSolutionDto,
    studentId: number,
  ): Promise<TaskSolution> {
    const taskSolution = this.taskSolutionsRepository.create({
      ...createTaskSolutionDto,
      studentId,
      status: TaskSolutionStatus.SUBMITTED,
      submittedAt: new Date(),
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
      if (taskSolution.studentId !== userId) {
        throw new ForbiddenException('You can only update your own solutions');
      }

      if (updateTaskSolutionDto.status) {
        throw new ForbiddenException(
          'Students cannot change the status of a solution',
        );
      }

      // Only allow updating solution text if the solution is not already being reviewed
      if (taskSolution.status !== TaskSolutionStatus.SUBMITTED) {
        throw new ForbiddenException(
          'You cannot update a solution that is already under review or reviewed',
        );
      }
    }

    this.taskSolutionsRepository.merge(taskSolution, updateTaskSolutionDto);
    return this.taskSolutionsRepository.save(taskSolution);
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const taskSolution = await this.findOne(id);

    // Students can only delete their own solutions that haven't been reviewed
    if (userRole === UserRole.STUDENT) {
      if (taskSolution.studentId !== userId) {
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
