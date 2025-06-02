import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { TaskSolutionReview } from './entities/task-solution-review.entity';
import { CriterionScore } from './entities/criterion-score.entity';
import {
  CreateTaskSolutionReviewDto,
  CriterionScoreDto,
  PaginatedResponse,
  PaginationDto,
  ReviewSource,
  TaskSolutionReviewDto,
  TaskSolutionStatus,
  UpdateTaskSolutionReviewDto,
} from '@app/shared';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';
import { TaskSolutionsService } from '../task-solutions/task-solutions.service';

@Injectable()
export class TaskSolutionReviewsService {
  constructor(
    @InjectRepository(TaskSolutionReview)
    private readonly reviewsRepository: Repository<TaskSolutionReview>,
    @InjectRepository(CriterionScore)
    private readonly criterionScoresRepository: Repository<CriterionScore>,
    @InjectRepository(TaskSolution)
    private readonly taskSolutionsRepository: Repository<TaskSolution>,
    private readonly taskSolutionsService: TaskSolutionsService,
  ) {}

  private mapCriterionScoreToDto(
    criterionScore: CriterionScore,
  ): CriterionScoreDto {
    return {
      criterionId: criterionScore.criterionId,
      score: criterionScore.score,
      comment: criterionScore.comment,
    };
  }

  private mapReviewToDto(review: TaskSolutionReview): TaskSolutionReviewDto {
    return {
      id: review.id,
      taskSolutionId: review.taskSolutionId,
      reviewerId: review.reviewerId,
      criteriaScores: review.criteriaScores
        ? review.criteriaScores.map((score) =>
            this.mapCriterionScoreToDto(score),
          )
        : [],
      totalScore: review.totalScore,
      feedbackToStudent: review.feedbackToStudent,
      reviewerComment: review.reviewerComment,
      source: review.source,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async findAll(
    paginationDto?: PaginationDto,
    taskId?: string,
    taskSolutionId?: string,
  ): Promise<PaginatedResponse<TaskSolutionReviewDto>> {
    const { page = 1, size = 10 } = paginationDto || {};
    const skip = (page - 1) * size;

    // Build query conditions
    const where: any = {};
    if (taskId) {
      where.taskSolution = { task: { id: taskId } };
    }
    if (taskSolutionId) {
      where.taskSolutionId = taskSolutionId;
    }

    // If pagination is not provided, we'll still return in paginated format
    // but with a large size to effectively get all results
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where,
      relations: [
        'taskSolution',
        'reviewer',
        'criteriaScores',
        'criteriaScores.criterion',
      ],
      skip: paginationDto ? skip : 0,
      take: paginationDto ? size : 1000, // Use a reasonable limit if no pagination
      order: { createdAt: 'DESC' },
    });

    return {
      data: reviews.map((review) => this.mapReviewToDto(review)),
      total,
      page: paginationDto ? page : 1,
      size: paginationDto ? size : total,
      totalPages: Math.ceil(total / (paginationDto ? size : 1)),
    };
  }

  async findByTask(
    taskId: string,
    paginationDto?: PaginationDto,
  ): Promise<
    PaginatedResponse<TaskSolutionReviewDto> | TaskSolutionReviewDto[]
  > {
    if (!paginationDto) {
      const reviews = await this.reviewsRepository.find({
        where: {
          taskSolution: { task: { id: taskId } },
        },
        relations: [
          'taskSolution',
          'taskSolution.task',
          'reviewer',
          'criteriaScores',
        ],
      });
      return reviews.map((review) => this.mapReviewToDto(review));
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: {
        taskSolution: { task: { id: taskId } },
      },
      relations: [
        'taskSolution',
        'taskSolution.task',
        'reviewer',
        'criteriaScores',
      ],
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / size);

    return {
      data: reviews.map((review) => this.mapReviewToDto(review)),
      total,
      page,
      size,
      totalPages,
    };
  }

  async findByTaskSolution(
    taskSolutionId: string,
    paginationDto?: PaginationDto,
  ): Promise<
    PaginatedResponse<TaskSolutionReviewDto> | TaskSolutionReviewDto[]
  > {
    if (!paginationDto) {
      const reviews = await this.reviewsRepository.find({
        where: { taskSolutionId },
        relations: ['reviewer', 'criteriaScores', 'criteriaScores.criterion'],
      });
      return reviews.map((review) => this.mapReviewToDto(review));
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { taskSolutionId },
      relations: ['reviewer', 'criteriaScores', 'criteriaScores.criterion'],
      skip,
      take: size,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / size);

    return {
      data: reviews.map((review) => this.mapReviewToDto(review)),
      total,
      page,
      size,
      totalPages,
    };
  }

  async findOne(
    id: string,
    options?: FindOneOptions<TaskSolutionReview>,
  ): Promise<TaskSolutionReview> {
    const findOptions: FindOneOptions<TaskSolutionReview> = {
      where: { id },
      relations: [
        'taskSolution',
        'taskSolution.user',
        'reviewer',
        'criteriaScores',
        'criteriaScores.criterion',
      ],
      ...options,
    };
    const review = await this.reviewsRepository.findOne(findOptions);

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async create(
    createReviewDto: CreateTaskSolutionReviewDto,
    reviewerId?: string,
  ): Promise<TaskSolutionReviewDto> {
    const taskSolution = await this.taskSolutionsRepository.findOne({
      where: { id: createReviewDto.taskSolutionId },
      relations: ['task', 'task.criteria'],
    });

    if (!taskSolution) {
      throw new NotFoundException(
        `Task solution with ID ${createReviewDto.taskSolutionId} not found`,
      );
    }

    const totalScore = createReviewDto.criteriaScores.reduce(
      (sum, criterionScore) => sum + criterionScore.score,
      0,
    );

    const review = this.reviewsRepository.create({
      taskSolutionId: createReviewDto.taskSolutionId,
      reviewerId: reviewerId,
      totalScore,
      feedbackToStudent: createReviewDto.feedbackToStudent,
      reviewerComment: createReviewDto.reviewerComment,
      source: createReviewDto.source,
    });

    const savedReview = await this.reviewsRepository.save(review);

    const criteriaScores = createReviewDto.criteriaScores.map(
      (criterionScoreDto) =>
        this.criterionScoresRepository.create({
          reviewId: savedReview.id,
          criterionId: criterionScoreDto.criterionId,
          score: criterionScoreDto.score,
          comment: criterionScoreDto.comment,
        }),
    );

    savedReview.criteriaScores =
      await this.criterionScoresRepository.save(criteriaScores);

    taskSolution.status = TaskSolutionStatus.REVIEWED;
    await this.taskSolutionsRepository.save(taskSolution);

    return this.mapReviewToDto(savedReview);
  }

  async update(
    id: string,
    updateReviewDto: UpdateTaskSolutionReviewDto,
  ): Promise<TaskSolutionReviewDto> {
    const review = await this.findOne(id);

    if (updateReviewDto.feedbackToStudent)
      review.feedbackToStudent = updateReviewDto.feedbackToStudent;
    if (updateReviewDto.reviewerComment !== undefined)
      review.reviewerComment = updateReviewDto.reviewerComment;
    if (updateReviewDto.source) review.source = updateReviewDto.source;
    if (updateReviewDto.reviewerId !== undefined)
      review.reviewerId = updateReviewDto.reviewerId;

    if (
      updateReviewDto.criteriaScores &&
      updateReviewDto.criteriaScores.length > 0
    ) {
      if (review.criteriaScores && review.criteriaScores.length > 0) {
        await this.criterionScoresRepository.remove(review.criteriaScores);
      }

      const totalScore = updateReviewDto.criteriaScores.reduce(
        (sum, criterionScore) => sum + criterionScore.score,
        0,
      );

      review.totalScore = totalScore;

      const criteriaScores = updateReviewDto.criteriaScores.map(
        (criterionScoreDto) =>
          this.criterionScoresRepository.create({
            reviewId: review.id,
            criterionId: criterionScoreDto.criterionId,
            score: criterionScoreDto.score,
            comment: criterionScoreDto.comment,
          }),
      );

      review.criteriaScores =
        await this.criterionScoresRepository.save(criteriaScores);
    }

    await this.reviewsRepository.save(review);

    return this.mapReviewToDto(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);

    const taskSolution = await this.taskSolutionsRepository.findOneBy({
      id: review.taskSolutionId,
    });

    if (taskSolution && taskSolution.status === TaskSolutionStatus.REVIEWED) {
      taskSolution.status = TaskSolutionStatus.IN_REVIEW;
      await this.taskSolutionsRepository.save(taskSolution);
    }

    await this.reviewsRepository.remove(review);
  }

  async batchApproveReviews(
    reviewIds: string[],
    reviewerId: string,
  ): Promise<{ approvedCount: number; errors: any[] }> {
    const results = [];
    const errors = [];

    for (const reviewId of reviewIds) {
      try {
        const review = await this.findOne(reviewId);

        if (review.source !== ReviewSource.AUTO) {
          errors.push({
            reviewId,
            error: 'Only automated reviews can be approved',
          });
          continue;
        }

        await this.update(reviewId, {
          source: ReviewSource.AUTO_APPROVED,
          reviewerId,
        });

        results.push(reviewId);
      } catch (error) {
        errors.push({
          reviewId,
          error: (error as Error).message,
        });
      }
    }

    return {
      approvedCount: results.length,
      errors,
    };
  }

  async batchRejectReviews(
    reviewIds: string[],
  ): Promise<{ rejectedCount: number; errors: any[] }> {
    const results = [];
    const errors = [];

    for (const reviewId of reviewIds) {
      try {
        const review = await this.findOne(reviewId);

        if (review.source !== ReviewSource.AUTO) {
          errors.push({
            reviewId,
            error: 'Only automated reviews can be rejected',
          });
          continue;
        }

        await this.remove(reviewId);
        results.push(reviewId);
      } catch (error) {
        errors.push({
          reviewId,
          error: (error as Error).message,
        });
      }
    }

    return {
      rejectedCount: results.length,
      errors,
    };
  }

  async findPendingAutoReviews(
    paginationDto?: PaginationDto,
    taskId?: string,
  ): Promise<PaginatedResponse<TaskSolutionReviewDto>> {
    const { page = 1, size = 10 } = paginationDto || {};
    const skip = (page - 1) * size;

    // Build query conditions for pending auto-reviews
    const where: any = {
      source: ReviewSource.AUTO,
      status: 'pending',
    };

    if (taskId) {
      where.taskSolution = { task: { id: taskId } };
    }

    // Get pending auto-reviews with pagination
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where,
      relations: [
        'taskSolution',
        'taskSolution.task',
        'taskSolution.user',
        'criteriaScores',
      ],
      skip: paginationDto ? skip : 0,
      take: paginationDto ? size : 100,
      order: { createdAt: 'DESC' },
    });

    return {
      data: reviews.map((review) => this.mapReviewToDto(review)),
      total,
      page: paginationDto ? page : 1,
      size: paginationDto ? size : total,
      totalPages: Math.ceil(total / (paginationDto ? size : 1)),
    };
  }
}
