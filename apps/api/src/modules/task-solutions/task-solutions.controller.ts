import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TaskSolutionsService } from './task-solutions.service';
import {
  CreateTaskSolutionDto,
  TaskSolutionDto,
  UpdateTaskSolutionDto,
  UserRole,
} from '@app/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TaskSolution } from './entities/task-solution.entity';

// Helper function to map a single TaskSolution entity to TaskSolutionDto
function mapTaskSolutionToDto(solution: TaskSolution): TaskSolutionDto {
  if (!solution) {
    // Or throw an error, or ensure relations are always loaded by the service
    // For now, returning null and filtering later, but this might hide issues
    // if task or user are unexpectedly null.
    return null;
  }
  return {
    id: solution.id,
    // Ensure 'task' and 'user' relations are loaded by the service methods
    // If they might not be, add checks or ensure they are always loaded.
    taskId: solution.task?.id,
    studentId: solution.user?.id,
    solutionText: solution.content,
    status: solution.status,
    submittedAt: solution.createdAt, // Assuming createdAt is the submission time
    createdAt: solution.createdAt,
    updatedAt: solution.updatedAt,
  };
}

// Helper function to map an array of TaskSolution entities to TaskSolutionDto[]
function mapTaskSolutionsToDtos(solutions: TaskSolution[]): TaskSolutionDto[] {
  if (!solutions) return [];
  return solutions.map(mapTaskSolutionToDto).filter((dto) => dto !== null);
}

@ApiTags('task-solutions')
@ApiBearerAuth()
@Controller('task-solutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskSolutionsController {
  constructor(private readonly taskSolutionsService: TaskSolutionsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  async findAll(
    @Query('taskId') taskId?: number,
    @Query('studentId') studentId?: number,
  ): Promise<TaskSolutionDto[]> {
    let solutions: TaskSolution[];
    if (taskId) {
      solutions = await this.taskSolutionsService.findByTask(taskId);
    } else if (studentId) {
      solutions = await this.taskSolutionsService.findByStudent(studentId);
    } else {
      solutions = await this.taskSolutionsService.findAll();
    }
    return mapTaskSolutionsToDtos(solutions);
  }

  @Get('my-solutions')
  @Roles(UserRole.STUDENT)
  async findMyTaskSolutions(@Request() req): Promise<TaskSolutionDto[]> {
    const solutions = await this.taskSolutionsService.findByStudent(
      req.user.id,
    );
    return mapTaskSolutionsToDtos(solutions);
  }

  @Get('by-task/:taskId')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async findByTask(@Param('taskId') taskId: number): Promise<TaskSolutionDto[]> {
    const solutions = await this.taskSolutionsService.findByTask(taskId);
    return mapTaskSolutionsToDtos(solutions);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Request() req,
  ): Promise<TaskSolutionDto> {
    const solution = await this.taskSolutionsService.findOne(id, req.user);
    // Need to ensure findOne in service also loads relations if not already
    return mapTaskSolutionToDto(solution);
  }

  @Post()
  @Roles(UserRole.STUDENT)
  async create(
    @Body() createTaskSolutionDto: CreateTaskSolutionDto,
    @Request() req,
  ): Promise<TaskSolutionDto> {
    const solution = await this.taskSolutionsService.create(
      createTaskSolutionDto,
      req.user,
    );
    return mapTaskSolutionToDto(solution);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateTaskSolutionDto: UpdateTaskSolutionDto,
    @Request() req,
  ): Promise<TaskSolutionDto> {
    const solution = await this.taskSolutionsService.update(
      id,
      updateTaskSolutionDto,
      req.user.id,
      req.user.role,
    );
    return mapTaskSolutionToDto(solution);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req): Promise<void> {
    await this.taskSolutionsService.remove(id, req.user.id, req.user.role);
  }
}
