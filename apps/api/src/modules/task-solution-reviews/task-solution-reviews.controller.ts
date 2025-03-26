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
import { TaskSolutionReviewsService } from './task-solution-reviews.service';
import {
  CreateTaskSolutionReviewDto,
  ReviewSource,
  TaskSolutionReviewDto,
  UpdateTaskSolutionReviewDto,
  UserRole,
} from '@app/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('task-solution-reviews')
@ApiBearerAuth()
@Controller('task-solution-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskSolutionReviewsController {
  constructor(private readonly reviewsService: TaskSolutionReviewsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiQuery({ name: 'taskSolutionId', required: false })
  async findAll(
    @Query('taskSolutionId') taskSolutionId?: number,
  ): Promise<TaskSolutionReviewDto[]> {
    if (taskSolutionId) {
      return this.reviewsService.findByTaskSolution(taskSolutionId);
    }

    return this.reviewsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Request() req,
  ): Promise<TaskSolutionReviewDto> {
    const review = await this.reviewsService.findOne(id);

    // If student, verify they are the owner of the associated task solution
    if (req.user.role === UserRole.STUDENT) {
      const taskSolution = review.taskSolution;
      if (taskSolution.studentId !== req.user.id) {
        throw new Error('You can only view reviews for your own solutions');
      }
    }

    return review;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async create(
    @Body() createReviewDto: CreateTaskSolutionReviewDto,
    @Request() req,
  ): Promise<TaskSolutionReviewDto> {
    // Set the source based on the user's role
    if (req.user.role === UserRole.MENTOR) {
      createReviewDto.source = ReviewSource.MANUAL;
    }

    return this.reviewsService.create(createReviewDto, req.user.id);
  }

  @Post('auto-review')
  @Roles(UserRole.ADMIN)
  async createAutoReview(
    @Body() createReviewDto: CreateTaskSolutionReviewDto,
  ): Promise<TaskSolutionReviewDto> {
    // Ensure source is set to AUTO
    createReviewDto.source = ReviewSource.AUTO;

    return this.reviewsService.create(createReviewDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async update(
    @Param('id') id: number,
    @Body() updateReviewDto: UpdateTaskSolutionReviewDto,
    @Request() req,
  ): Promise<TaskSolutionReviewDto> {
    const review = await this.reviewsService.findOne(id);

    // If mentor, check if they are the original reviewer or an admin
    if (req.user.role === UserRole.MENTOR && review.mentorId !== req.user.id) {
      throw new Error('You can only update reviews that you created');
    }

    // Update the source based on the original source and user's role
    if (review.source === ReviewSource.AUTO) {
      updateReviewDto.source = ReviewSource.AUTO_MODIFIED;
    } else if (req.user.role === UserRole.MENTOR) {
      updateReviewDto.source = ReviewSource.MANUAL;
    }

    return this.reviewsService.update(id, updateReviewDto);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async approveAutoReview(
    @Param('id') id: number,
  ): Promise<TaskSolutionReviewDto> {
    const review = await this.reviewsService.findOne(id);

    // Only auto reviews can be approved
    if (review.source !== ReviewSource.AUTO) {
      throw new Error('Only automated reviews can be approved');
    }

    return this.reviewsService.update(id, {
      source: ReviewSource.AUTO_APPROVED,
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: number): Promise<void> {
    await this.reviewsService.remove(id);
  }
}
