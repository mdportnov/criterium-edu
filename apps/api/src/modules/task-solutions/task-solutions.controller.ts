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

@ApiTags('task-solutions')
@ApiBearerAuth()
@Controller('task-solutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskSolutionsController {
  constructor(private readonly taskSolutionsService: TaskSolutionsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  async findAll(
    @Query('taskId') taskId?: number,
    @Query('studentId') studentId?: number,
  ): Promise<TaskSolutionDto[]> {
    if (taskId) {
      return this.taskSolutionsService.findByTask(taskId);
    }

    if (studentId) {
      return this.taskSolutionsService.findByStudent(studentId);
    }

    return this.taskSolutionsService.findAll();
  }

  @Get('my-solutions')
  @Roles(UserRole.STUDENT)
  async findMyTaskSolutions(@Request() req): Promise<TaskSolutionDto[]> {
    return this.taskSolutionsService.findByStudent(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Request() req,
  ): Promise<TaskSolutionDto> {
    const taskSolution = await this.taskSolutionsService.findOne(id);

    // Students can only view their own solutions
    if (
      req.user.role === UserRole.STUDENT &&
      taskSolution.studentId !== req.user.id
    ) {
      throw new Error('You can only view your own solutions');
    }

    return taskSolution;
  }

  @Post()
  @Roles(UserRole.STUDENT)
  async create(
    @Body() createTaskSolutionDto: CreateTaskSolutionDto,
    @Request() req,
  ): Promise<TaskSolutionDto> {
    return this.taskSolutionsService.create(createTaskSolutionDto, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateTaskSolutionDto: UpdateTaskSolutionDto,
    @Request() req,
  ): Promise<TaskSolutionDto> {
    return this.taskSolutionsService.update(
      id,
      updateTaskSolutionDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req): Promise<void> {
    await this.taskSolutionsService.remove(id, req.user.id, req.user.role);
  }
}
