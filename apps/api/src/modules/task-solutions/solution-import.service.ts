import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BatchImportSolutionsDto,
  ImportSolutionDto,
} from './entities/solution-import.dto';
import { TaskSolution } from './entities/task-solution.entity';
import { SolutionSource } from './entities/solution-source.entity';
import { UsersService } from '../users/users.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskSolutionStatus } from '@app/shared';

@Injectable()
export class SolutionImportService {
  constructor(
    @InjectRepository(TaskSolution)
    private readonly solutionRepository: Repository<TaskSolution>,
    @InjectRepository(SolutionSource)
    private readonly sourceRepository: Repository<SolutionSource>,
    private readonly usersService: UsersService,
    private readonly tasksService: TasksService,
  ) {}

  async importBatch(
    importDto: BatchImportSolutionsDto,
  ): Promise<TaskSolution[]> {
    // Get or create the source
    let source = await this.sourceRepository.findOne({
      where: { name: importDto.sourceName },
    });

    if (!source) {
      source = this.sourceRepository.create({
        name: importDto.sourceName,
      });
      await this.sourceRepository.save(source);
    }

    // Import each solution
    const importedSolutions: TaskSolution[] = [];
    for (const solutionDto of importDto.solutions) {
      const solution = await this.importSolution(solutionDto, source);
      importedSolutions.push(solution);
    }

    return importedSolutions;
  }

  private async importSolution(
    importDto: ImportSolutionDto,
    source: SolutionSource,
  ): Promise<TaskSolution> {
    // Check if task exists
    const task = await this.tasksService.findOne(importDto.taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${importDto.taskId} not found`);
    }

    // Check if user exists (if provided)
    let user = null;
    if (importDto.userId) {
      user = await this.usersService.findOne(importDto.userId);
      if (!user) {
        throw new NotFoundException(
          `User with ID ${importDto.userId} not found`,
        );
      }
    }

    // Check if solution with this externalId already exists
    if (importDto.externalId) {
      const existingSolution = await this.solutionRepository.findOne({
        where: {
          externalId: importDto.externalId,
          source: { id: source.id },
        },
        relations: ['source'],
      });

      if (existingSolution) {
        // Update the existing solution
        existingSolution.content = importDto.content;
        if (user) {
          existingSolution.user = user;
        }
        return this.solutionRepository.save(existingSolution);
      }
    }

    // Create new solution
    const solution = this.solutionRepository.create({
      content: importDto.content,
      externalId: importDto.externalId || null,
      task,
      user,
      source,
      status: TaskSolutionStatus.SUBMITTED,
    });

    return this.solutionRepository.save(solution);
  }

  async getSources(): Promise<SolutionSource[]> {
    return this.sourceRepository.find();
  }

  async getSource(id: string): Promise<SolutionSource> {
    const source = await this.sourceRepository.findOne({
      where: { id },
      relations: ['solutions'],
    });

    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }

    return source;
  }
}
