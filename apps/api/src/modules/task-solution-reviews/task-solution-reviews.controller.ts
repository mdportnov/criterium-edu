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
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '@app/shared';

@ApiTags('task-solution-reviews')
@ApiBearerAuth()
@Controller('task-solution-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskSolutionReviewsController {
  constructor(private readonly reviewsService: TaskSolutionReviewsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @ApiQuery({ name: 'taskSolutionId', required: false })
  @ApiQuery({ name: 'taskId', required: false })
  async findAll(
    @Query('taskSolutionId') taskSolutionId?: number,
    @Query('taskId') taskId?: number,
  ): Promise<TaskSolutionReviewDto[]> {
    if (taskId) {
      return this.reviewsService.findByTask(taskId);
    } else if (taskSolutionId) {
      return this.reviewsService.findByTaskSolution(taskSolutionId);
    }

    return this.reviewsService.findAll();
  }

  @Get('pending-auto')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @ApiQuery({ name: 'taskId', required: false })
  async findPendingAutoReviews(
    @Query('taskId') taskId?: number,
  ): Promise<TaskSolutionReviewDto[]> {
    return this.reviewsService.findPendingAutoReviews(taskId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskSolutionReviewDto> {
    const review = await this.reviewsService.findOne(id, {
      relations: ['taskSolution', 'taskSolution.user'],
    });

    // If student, verify they are the owner of the associated task solution
    if (user.role === UserRole.STUDENT) {
      const taskSolution = review.taskSolution;
      if (!taskSolution.user || taskSolution.user.id !== user.id) {
        throw new Error('You can only view reviews for your own solutions');
      }
    }

    return review;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async create(
    @Body() createReviewDto: CreateTaskSolutionReviewDto,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskSolutionReviewDto> {
    // Set the source based on the user's role
    if (user.role === UserRole.REVIEWER) {
      createReviewDto.source = ReviewSource.MANUAL;
    }

    return this.reviewsService.create(createReviewDto, user.id);
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
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async update(
    @Param('id') id: number,
    @Body() updateReviewDto: UpdateTaskSolutionReviewDto,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskSolutionReviewDto> {
    const review = await this.reviewsService.findOne(id);

    // If reviewer, check if they are the original reviewer or an admin
    if (user.role === UserRole.REVIEWER && review.reviewerId !== user.id) {
      throw new Error('You can only update reviews that you created');
    }

    // Update the source based on the original source and user's role
    if (review.source === ReviewSource.AUTO) {
      updateReviewDto.source = ReviewSource.AUTO_MODIFIED;
    } else if (user.role === UserRole.REVIEWER) {
      updateReviewDto.source = ReviewSource.MANUAL;
    }

    return this.reviewsService.update(id, updateReviewDto);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async approveAutoReview(
    @Param('id') id: number,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TaskSolutionReviewDto> {
    const review = await this.reviewsService.findOne(id);

    // Only auto reviews can be approved
    if (review.source !== ReviewSource.AUTO) {
      throw new Error('Only automated reviews can be approved');
    }

    return this.reviewsService.update(id, {
      source: ReviewSource.AUTO_APPROVED,
      reviewerId: user.id,
    });
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async rejectAutoReview(@Param('id') id: number): Promise<void> {
    const review = await this.reviewsService.findOne(id);

    // Only auto reviews can be rejected
    if (review.source !== ReviewSource.AUTO) {
      throw new Error('Only automated reviews can be rejected');
    }

    // Delete the rejected auto review
    await this.reviewsService.remove(id);
  }

  @Post('batch-approve')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async batchApproveAutoReviews(
    @Body() data: { reviewIds: number[] },
    @GetCurrentUser() user: CurrentUser,
  ): Promise<{ approvedCount: number; errors: any[] }> {
    return this.reviewsService.batchApproveReviews(data.reviewIds, user.id);
  }

  @Post('batch-reject')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async batchRejectAutoReviews(
    @Body() data: { reviewIds: number[] },
  ): Promise<{ rejectedCount: number; errors: any[] }> {
    return this.reviewsService.batchRejectReviews(data.reviewIds);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: number): Promise<void> {
    await this.reviewsService.remove(id);
  }
}
