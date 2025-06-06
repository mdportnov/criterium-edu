import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskSolutionsService } from './task-solutions.service';
import {
  CreateTaskSolutionDto,
  CurrentUser,
  PaginatedResponse,
  PaginationDto,
  TaskSolutionDto,
  UpdateTaskSolutionDto,
  UserRole,
} from '@app/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TaskSolution } from './entities/task-solution.entity';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';

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
    @Query() paginationDto: PaginationDto,
    @Query('taskId') taskId?: string,
    @Query('studentId') studentId?: string,
  ): Promise<PaginatedResponse<TaskSolutionDto>> {
    let result;

    if (taskId) {
      result = await this.taskSolutionsService.findByTask(
        taskId,
        paginationDto,
      );
    } else if (studentId) {
      result = await this.taskSolutionsService.findByStudent(
        studentId,
        paginationDto,
      );
    } else {
      result = await this.taskSolutionsService.findAll(paginationDto);
    }

    if (Array.isArray(result)) {
      return {
        data: mapTaskSolutionsToDtos(result),
        total: result.length,
        page: 1,
        size: result.length,
        totalPages: 1,
      };
    }

    return {
      data: mapTaskSolutionsToDtos(result.data),
      total: result.total,
      page: result.page,
      size: result.size,
      totalPages: result.totalPages,
    };
  }

  @Get('my-solutions')
  @Roles(UserRole.STUDENT)
  async findMyTaskSolutions(
    @Query() paginationDto: PaginationDto,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<PaginatedResponse<TaskSolutionDto>> {
    const result = await this.taskSolutionsService.findByStudent(
      user.id,
      paginationDto,
    );

    if (Array.isArray(result)) {
      return {
        data: mapTaskSolutionsToDtos(result),
        total: result.length,
        page: 1,
        size: result.length,
        totalPages: 1,
      };
    }

    return {
      data: mapTaskSolutionsToDtos(result.data),
      total: result.total,
      page: result.page,
      size: result.size,
      totalPages: result.totalPages,
    };
  }

  @Get('by-task/:taskId')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async findByTask(
    @Param('taskId') taskId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<TaskSolutionDto>> {
    const result = await this.taskSolutionsService.findByTask(
      taskId,
      paginationDto,
    );

    if (Array.isArray(result)) {
      return {
        data: mapTaskSolutionsToDtos(result),
        total: result.length,
        page: 1,
        size: result.length,
        totalPages: 1,
      };
    }

    return {
      data: mapTaskSolutionsToDtos(result.data),
      total: result.total,
      page: result.page,
      size: result.size,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskSolutionDto> {
    const solution = await this.taskSolutionsService.findOne(id, user);
    // Need to ensure findOne in service also loads relations if not already
    return mapTaskSolutionToDto(solution);
  }

  @Post()
  @Roles(UserRole.STUDENT)
  async create(
    @Body() createTaskSolutionDto: CreateTaskSolutionDto,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskSolutionDto> {
    const solution = await this.taskSolutionsService.create(
      createTaskSolutionDto,
      user,
    );
    return mapTaskSolutionToDto(solution);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskSolutionDto: UpdateTaskSolutionDto,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskSolutionDto> {
    const solution = await this.taskSolutionsService.update(
      id,
      updateTaskSolutionDto,
      user.id,
      user.role,
    );
    return mapTaskSolutionToDto(solution);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<void> {
    await this.taskSolutionsService.remove(id, user.id, user.role);
  }
}
