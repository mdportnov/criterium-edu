import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CriterionScoreDto, ReviewSource } from '@app/shared';
import { TasksService } from '../tasks/tasks.service';
import { TaskSolutionsService } from '../task-solutions/task-solutions.service';
import { TaskSolutionReviewsService } from '../task-solution-reviews/task-solution-reviews.service';

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tasksService: TasksService,
    private readonly taskSolutionsService: TaskSolutionsService,
    private readonly reviewsService: TaskSolutionReviewsService,
  ) {}

  /**
   * Process a task solution to generate an automated review
   */
  async processTaskSolution(taskSolutionId: number): Promise<any> {
    this.logger.log(`Processing task solution with ID: ${taskSolutionId}`);

    try {
      // Get task solution with task details
      const taskSolution =
        await this.taskSolutionsService.findOne(taskSolutionId);
      const task = await this.tasksService.findOne(taskSolution.task.id);

      // Generate criteria scores based on AI model evaluation
      const criteriaScores = await this.evaluateSolution(task, taskSolution);

      // Generate feedback for the student
      const feedbackToStudent = await this.generateFeedback(
        task,
        taskSolution,
        criteriaScores,
      );

      // Create review
      const review = await this.reviewsService.create({
        taskSolutionId: taskSolution.id,
        criteriaScores,
        feedbackToStudent,
        source: ReviewSource.AUTO,
      });

      this.logger.log(
        `Successfully created automated review for task solution ID: ${taskSolutionId}`,
      );

      return review;
    } catch (error) {
      this.logger.error(
        `Error processing task solution ID: ${taskSolutionId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Mock implementation of solution evaluation with AI
   * In a real implementation, this would call the AI model
   */
  private async evaluateSolution(
    task: any,
    taskSolution: any,
  ): Promise<CriterionScoreDto[]> {
    this.logger.log(`Evaluating solution for task: ${task.title}`);

    // In a real implementation, this would use an AI model to evaluate the solution
    // For now, we'll create mock criteria scores
    return task.criteria.map((criterion) => ({
      criterionId: criterion.id,
      score: Math.floor(Math.random() * (criterion.maxPoints + 1)), // Random score between 0 and maxPoints
      comment: `Automated assessment for criterion "${criterion.name}"`,
    }));
  }

  /**
   * Mock implementation of feedback generation with AI
   * In a real implementation, this would call the AI model
   */
  private async generateFeedback(
    task: any,
    taskSolution: any,
    criteriaScores: CriterionScoreDto[],
  ): Promise<string> {
    this.logger.log(`Generating feedback for task: ${task.title}`);

    // Calculate total score
    const totalScore = criteriaScores.reduce(
      (sum, criterionScore) => sum + criterionScore.score,
      0,
    );
    const maxPossibleScore = task.criteria.reduce(
      (sum, criterion) => sum + criterion.maxPoints,
      0,
    );
    const scorePercentage = (totalScore / maxPossibleScore) * 100;

    // In a real implementation, this would use an AI model to generate personalized feedback
    // For now, we'll return a basic template
    return `
# Automated Assessment

Your solution for "${task.title}" has been evaluated.

## Overall Score: ${totalScore}/${maxPossibleScore} (${scorePercentage.toFixed(2)}%)

## Feedback by Criteria:
${criteriaScores
  .map((score) => {
    const criterion = task.criteria.find((c) => c.id === score.criterionId);
    return `### ${criterion.name}: ${score.score}/${criterion.maxPoints}\n${score.comment}\n`;
  })
  .join('\n')}

## General Observations:
This is an automated assessment. Your solution has been evaluated based on the provided criteria.
${
  scorePercentage > 80
    ? 'Overall, your solution demonstrates a good understanding of the task requirements.'
    : scorePercentage > 50
      ? 'Your solution meets the basic requirements, but there is room for improvement.'
      : 'Your solution needs significant improvement to meet the requirements.'
}
    `;
  }
}
