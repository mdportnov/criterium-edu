import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { TaskSolutionReview } from './entities/task-solution-review.entity';
import { CriterionScore } from './entities/criterion-score.entity';
import {
  CreateTaskSolutionReviewDto,
  CriterionScoreDto,
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
        ? review.criteriaScores.map(this.mapCriterionScoreToDto)
        : [],
      totalScore: review.totalScore,
      feedbackToStudent: review.feedbackToStudent,
      reviewerComment: review.reviewerComment,
      source: review.source,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async findAll(): Promise<TaskSolutionReviewDto[]> {
    const reviews = await this.reviewsRepository.find({
      relations: [
        'taskSolution',
        'reviewer',
        'criteriaScores',
        'criteriaScores.criterion',
      ],
    });
    return reviews.map((review) => this.mapReviewToDto(review));
  }

  async findByTask(taskId: number): Promise<TaskSolutionReviewDto[]> {
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
    return reviews.map(this.mapReviewToDto);
  }

  async findByTaskSolution(
    taskSolutionId: number,
  ): Promise<TaskSolutionReviewDto[]> {
    const reviews = await this.reviewsRepository.find({
      where: { taskSolutionId },
      relations: ['reviewer', 'criteriaScores', 'criteriaScores.criterion'],
    });
    return reviews.map((review) => this.mapReviewToDto(review));
  }

  async findOne(
    id: number,
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
    reviewerId?: number,
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
    id: number,
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

  async remove(id: number): Promise<void> {
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
    reviewIds: number[],
    reviewerId: number,
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
          error: error.message,
        });
      }
    }

    return {
      approvedCount: results.length,
      errors,
    };
  }

  async batchRejectReviews(
    reviewIds: number[],
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
          error: error.message,
        });
      }
    }

    return {
      rejectedCount: results.length,
      errors,
    };
  }

  async findPendingAutoReviews(
    taskId?: number,
  ): Promise<TaskSolutionReviewDto[]> {
    const queryBuilder = this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.taskSolution', 'taskSolution')
      .leftJoinAndSelect('review.criteriaScores', 'criteriaScores')
      .where('review.source = :source', { source: ReviewSource.AUTO });

    if (taskId) {
      queryBuilder.andWhere('taskSolution.task = :taskId', { taskId });
    }

    const reviews = await queryBuilder.getMany();
    return reviews.map((review) => this.mapReviewToDto(review));
  }
}
