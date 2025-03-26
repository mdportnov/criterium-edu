import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskSolutionReview } from './entities/task-solution-review.entity';
import { CriterionScore } from './entities/criterion-score.entity';
import {
  CreateTaskSolutionReviewDto,
  ReviewSource,
  TaskSolutionStatus,
  UpdateTaskSolutionReviewDto,
} from '@app/shared';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';

@Injectable()
export class TaskSolutionReviewsService {
  constructor(
    @InjectRepository(TaskSolutionReview)
    private readonly reviewsRepository: Repository<TaskSolutionReview>,
    @InjectRepository(CriterionScore)
    private readonly criterionScoresRepository: Repository<CriterionScore>,
    @InjectRepository(TaskSolution)
    private readonly taskSolutionsRepository: Repository<TaskSolution>,
  ) {}

  async findAll(): Promise<TaskSolutionReview[]> {
    return this.reviewsRepository.find({
      relations: [
        'taskSolution',
        'mentor',
        'criteriaScores',
        'criteriaScores.criterion',
      ],
    });
  }

  async findByTaskSolution(
    taskSolutionId: number,
  ): Promise<TaskSolutionReview[]> {
    return this.reviewsRepository.find({
      where: { taskSolutionId },
      relations: ['mentor', 'criteriaScores', 'criteriaScores.criterion'],
    });
  }

  async findOne(id: number): Promise<TaskSolutionReview> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: [
        'taskSolution',
        'mentor',
        'criteriaScores',
        'criteriaScores.criterion',
      ],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async create(
    createReviewDto: CreateTaskSolutionReviewDto,
    mentorId?: number,
  ): Promise<TaskSolutionReview> {
    // Check if task solution exists
    const taskSolution = await this.taskSolutionsRepository.findOne({
      where: { id: createReviewDto.taskSolutionId },
      relations: ['task', 'task.criteria'],
    });

    if (!taskSolution) {
      throw new NotFoundException(
        `Task solution with ID ${createReviewDto.taskSolutionId} not found`,
      );
    }

    // Calculate total score
    const totalScore = createReviewDto.criteriaScores.reduce(
      (sum, criterionScore) => sum + criterionScore.score,
      0,
    );

    // Create review
    const review = this.reviewsRepository.create({
      taskSolutionId: createReviewDto.taskSolutionId,
      mentorId,
      totalScore,
      feedbackToStudent: createReviewDto.feedbackToStudent,
      mentorComment: createReviewDto.mentorComment,
      source: createReviewDto.source,
    });

    const savedReview = await this.reviewsRepository.save(review);

    // Create criterion scores
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

    // Update task solution status
    taskSolution.status = TaskSolutionStatus.REVIEWED;
    await this.taskSolutionsRepository.save(taskSolution);

    return savedReview;
  }

  async update(
    id: number,
    updateReviewDto: UpdateTaskSolutionReviewDto,
  ): Promise<TaskSolutionReview> {
    const review = await this.findOne(id);

    // Update basic review info
    if (updateReviewDto.feedbackToStudent)
      review.feedbackToStudent = updateReviewDto.feedbackToStudent;
    if (updateReviewDto.mentorComment !== undefined)
      review.mentorComment = updateReviewDto.mentorComment;
    if (updateReviewDto.source) review.source = updateReviewDto.source;

    // Update criteria scores if provided
    if (
      updateReviewDto.criteriaScores &&
      updateReviewDto.criteriaScores.length > 0
    ) {
      // Remove existing scores
      if (review.criteriaScores && review.criteriaScores.length > 0) {
        await this.criterionScoresRepository.remove(review.criteriaScores);
      }

      // Calculate new total score
      const totalScore = updateReviewDto.criteriaScores.reduce(
        (sum, criterionScore) => sum + criterionScore.score,
        0,
      );

      review.totalScore = totalScore;

      // Create new scores
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

    return this.reviewsRepository.save(review);
  }

  async remove(id: number): Promise<void> {
    const review = await this.findOne(id);

    // Get the associated task solution
    const taskSolution = await this.taskSolutionsRepository.findOneBy({
      id: review.taskSolutionId,
    });

    // Update task solution status back to IN_REVIEW if it was REVIEWED
    if (taskSolution && taskSolution.status === TaskSolutionStatus.REVIEWED) {
      taskSolution.status = TaskSolutionStatus.IN_REVIEW;
      await this.taskSolutionsRepository.save(taskSolution);
    }

    await this.reviewsRepository.remove(review);
  }
}
