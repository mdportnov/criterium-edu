import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskCriterion } from './entities/task-criterion.entity';
import {
  CreateTaskDto,
  PaginatedResponse,
  PaginationDto,
  TaskCriterionDto,
  TaskDto,
  UpdateTaskDto,
} from '@app/shared';
import { Logger } from 'nestjs-pino';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskCriterion)
    private readonly criteriaRepository: Repository<TaskCriterion>,
    private readonly logger: Logger,
  ) {}

  private mapTaskCriterionToDto = (
    criterion: TaskCriterion,
  ): TaskCriterionDto => {
    return {
      id: criterion.id,
      name: criterion.name,
      description: criterion.description,
      maxPoints: criterion.maxPoints,
    };
  };

  private mapTaskToDto = (task: Task): TaskDto => {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      authorSolution: task.authorSolution,
      categories: task.categories,
      tags: task.tags,
      createdBy: task.createdBy,
      criteria: task.criteria
        ? task.criteria.map(this.mapTaskCriterionToDto)
        : [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  };

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<TaskDto>> {
    const { page = 1, size = 10 } = paginationDto || {};
    const skip = (page - 1) * size;

    const [tasks, total] = await this.tasksRepository.findAndCount({
      relations: ['criteria', 'creator'],
      skip,
      take: size,
    });

    this.logger.debug(
      { message: 'Found tasks', count: tasks.length, total },
      TasksService.name,
    );

    return {
      data: tasks.map((task) => this.mapTaskToDto(task)),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOne(id: string): Promise<TaskDto> {
    this.logger.debug(
      { message: 'Finding task by ID', taskId: id },
      TasksService.name,
    );

    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['criteria', 'creator'], // Eager load criteria and creator
    });

    if (!task) {
      this.logger.error(
        { message: 'Task not found', taskId: id },
        TasksService.name,
      );
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.mapTaskToDto(task);
  }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<TaskDto> {
    this.logger.log(
      {
        message: 'Creating new task',
        title: createTaskDto.title,
        userId,
        criteriaCount: createTaskDto.criteria?.length || 0,
      },
      TasksService.name,
    );

    const {
      criteria: criteriaDto,
      categories,
      tags,
      ...restTaskData
    } = createTaskDto;

    const newCriteriaEntities: TaskCriterion[] = criteriaDto.map(
      (criterion: TaskCriterionDto): TaskCriterion =>
        this.criteriaRepository.create(criterion),
    );

    const newTask = this.tasksRepository.create({
      ...restTaskData,
      createdBy: userId,
      categories: categories || [],
      tags: tags || [],
      criteria: newCriteriaEntities,
    });

    const savedTask = await this.tasksRepository.save(newTask);

    this.logger.log(
      {
        message: 'Task created successfully',
        taskId: savedTask.id,
        title: savedTask.title,
      },
      TasksService.name,
    );

    // Fetch the saved task with relations to ensure all data is present for DTO mapping
    const fullSavedTask = await this.tasksRepository.findOne({
      where: { id: savedTask.id },
      relations: ['criteria', 'creator'],
    });
    return this.mapTaskToDto(fullSavedTask);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskDto> {
    this.logger.debug(
      {
        message: 'Updating task',
        taskId: id,
        fieldsToUpdate: Object.keys(updateTaskDto),
      },
      TasksService.name,
    );

    const {
      criteria: criteriaDto,
      categories,
      tags,
      ...restTaskData
    } = updateTaskDto;

    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['criteria'],
    });

    if (!task) {
      this.logger.error(
        { message: 'Task not found for update', taskId: id },
        TasksService.name,
      );
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Update scalar properties
    this.tasksRepository.merge(task, restTaskData);
    if (categories !== undefined) {
      task.categories = categories;
    }
    if (tags !== undefined) {
      task.tags = tags;
    }

    // Handle criteria update
    if (criteriaDto) {
      this.logger.debug(
        {
          message: 'Updating task criteria',
          taskId: id,
          oldCriteriaCount: task.criteria?.length || 0,
          newCriteriaCount: criteriaDto.length,
        },
        TasksService.name,
      );

      // Remove old criteria associated with this task
      await this.criteriaRepository.delete({ task: { id: task.id } });
      // Add new criteria
      task.criteria = criteriaDto.map(
        (criterion: TaskCriterionDto): TaskCriterion =>
          this.criteriaRepository.create(criterion),
      );
    } else if (
      Object.prototype.hasOwnProperty.call(updateTaskDto, 'criteria') &&
      criteriaDto === null
    ) {
      this.logger.debug(
        {
          message: 'Removing all task criteria',
          taskId: id,
        },
        TasksService.name,
      );

      // If 'criteria' was explicitly passed as null (or empty array which becomes criteriaDto = null if not handled earlier)
      // This handles the case where the client wants to remove all criteria
      await this.criteriaRepository.delete({ task: { id: task.id } });
      task.criteria = [];
    }

    const updatedTask = await this.tasksRepository.save(task);

    this.logger.log(
      {
        message: 'Task updated successfully',
        taskId: id,
      },
      TasksService.name,
    );

    // Fetch the updated task with relations for DTO mapping
    const fullUpdatedTask = await this.tasksRepository.findOne({
      where: { id: updatedTask.id },
      relations: ['criteria', 'creator'],
    });
    return this.mapTaskToDto(fullUpdatedTask);
  }

  async remove(id: string): Promise<void> {
    // Ensure task exists before attempting to remove
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      this.logger.error(
        { message: 'Task not found for removal', taskId: id },
        TasksService.name,
      );
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Cascading delete for criteria should be handled by TypeORM if set up in entity
    // or explicitly delete criteria first if not.
    // Assuming Task entity has cascade:true for criteria, this is sufficient.
    await this.tasksRepository.remove(task);

    this.logger.debug(
      { message: 'Task removed successfully', taskId: id },
      TasksService.name,
    );
  }
}
