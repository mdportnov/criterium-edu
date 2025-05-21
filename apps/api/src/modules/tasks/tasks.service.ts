import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskCriterion } from './entities/task-criterion.entity';
import {
  CreateTaskDto,
  TaskDto,
  UpdateTaskDto,
  TaskCriterionDto,
} from '@app/shared';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskCriterion)
    private readonly criteriaRepository: Repository<TaskCriterion>,
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

  async findAll(): Promise<TaskDto[]> {
    const tasks = await this.tasksRepository.find({
      relations: ['criteria', 'creator'], // Eager load criteria and creator
    });
    return tasks.map((task) => this.mapTaskToDto(task));
  }

  async findOne(id: number): Promise<TaskDto> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['criteria', 'creator'], // Eager load criteria and creator
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return this.mapTaskToDto(task);
  }

  async create(createTaskDto: CreateTaskDto, userId: number): Promise<TaskDto> {
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
    // Fetch the saved task with relations to ensure all data is present for DTO mapping
    const fullSavedTask = await this.tasksRepository.findOne({
      where: { id: savedTask.id },
      relations: ['criteria', 'creator'],
    });
    return this.mapTaskToDto(fullSavedTask);
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<TaskDto> {
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
      // Remove old criteria associated with this task
      await this.criteriaRepository.delete({ task: { id: task.id } });
      // Add new criteria
      const newCriteriaEntities: TaskCriterion[] = criteriaDto.map(
        (criterion: TaskCriterionDto): TaskCriterion =>
          this.criteriaRepository.create(criterion),
      );
      task.criteria = newCriteriaEntities;
    } else if (
      updateTaskDto.hasOwnProperty('criteria') &&
      criteriaDto === null
    ) {
      // If 'criteria' was explicitly passed as null (or empty array which becomes criteriaDto = null if not handled earlier)
      // This handles the case where the client wants to remove all criteria
      await this.criteriaRepository.delete({ task: { id: task.id } });
      task.criteria = [];
    }

    const updatedTask = await this.tasksRepository.save(task);
    // Fetch the updated task with relations for DTO mapping
    const fullUpdatedTask = await this.tasksRepository.findOne({
      where: { id: updatedTask.id },
      relations: ['criteria', 'creator'],
    });
    return this.mapTaskToDto(fullUpdatedTask);
  }

  async remove(id: number): Promise<void> {
    // Ensure task exists before attempting to remove
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    // Cascading delete for criteria should be handled by TypeORM if set up in entity
    // or explicitly delete criteria first if not.
    // Assuming Task entity has cascade:true for criteria, this is sufficient.
    await this.tasksRepository.remove(task);
  }
}
