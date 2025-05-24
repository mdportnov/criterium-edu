import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, TaskDto, UpdateTaskDto, UserRole } from '@app/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '@app/shared';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(): Promise<TaskDto[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<TaskDto> {
    return this.tasksService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskDto> {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async update(
    @Param('id') id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDto> {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async remove(@Param('id') id: number): Promise<void> {
    await this.tasksService.remove(id);
  }
}
