import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskCriterion } from './entities/task-criterion.entity';
import { CreateTaskDto, UpdateTaskDto } from '@app/shared';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskCriterion)
    private readonly criteriaRepository: Repository<TaskCriterion>,
  ) {}

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      relations: ['criteria'],
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['criteria'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto, userId: number): Promise<Task> {
    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      authorSolution: createTaskDto.authorSolution,
      createdBy: userId,
    });

    const savedTask = await this.tasksRepository.save(task);

    // Create criteria
    if (createTaskDto.criteria && createTaskDto.criteria.length > 0) {
      const criteria = createTaskDto.criteria.map((criterionDto) =>
        this.criteriaRepository.create({
          ...criterionDto,
          taskId: savedTask.id,
        }),
      );

      savedTask.criteria = await this.criteriaRepository.save(criteria);
    }

    return savedTask;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    // Update basic task info
    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description) task.description = updateTaskDto.description;
    if (updateTaskDto.authorSolution !== undefined)
      task.authorSolution = updateTaskDto.authorSolution;

    // Update criteria if provided
    if (updateTaskDto.criteria && updateTaskDto.criteria.length > 0) {
      // Remove existing criteria
      if (task.criteria && task.criteria.length > 0) {
        await this.criteriaRepository.remove(task.criteria);
      }

      // Create new criteria
      const criteria = updateTaskDto.criteria.map((criterionDto) =>
        this.criteriaRepository.create({
          ...criterionDto,
          taskId: task.id,
        }),
      );

      task.criteria = await this.criteriaRepository.save(criteria);
    }

    return this.tasksRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
