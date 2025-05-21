import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CriterionScoreDto,
  ReviewSource,
  TaskDto,
  TaskSolutionDto,
} from '@app/shared';
import { TasksService } from '../tasks/tasks.service';
import { TaskSolutionsService } from '../task-solutions/task-solutions.service';
import { TaskSolutionReviewsService } from '../task-solution-reviews/task-solution-reviews.service';
import { OpenaiApiService } from '../openai/services/openai.service';

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tasksService: TasksService,
    private readonly taskSolutionsService: TaskSolutionsService,
    private readonly reviewsService: TaskSolutionReviewsService,
    private readonly openaiApiService: OpenaiApiService,
  ) {}

  /**
   * Process a task solution to generate an automated review
   */
  async processTaskSolution(taskSolutionId: number): Promise<any> {
    this.logger.log(`Processing task solution with ID: ${taskSolutionId}`);

    try {
      // Get task solution with task details
      const taskSolution =
        await this.taskSolutionsService.findOneAsDto(taskSolutionId);
      const task = await this.tasksService.findOne(taskSolution.taskId);

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

  private async evaluateSolution(
    task: TaskDto,
    taskSolution: TaskSolutionDto,
  ): Promise<CriterionScoreDto[]> {
    this.logger.log(
      `Evaluating solution for task: "${task.title}" (ID: ${task.id}), solution ID: ${taskSolution.id}`,
    );
    const criteriaScores: CriterionScoreDto[] = [];

    for (const criterion of task.criteria) {
      this.logger.debug(
        `Evaluating criterion: "${criterion.name}" (ID: ${criterion.id})`,
      );

      const prompt = `
You are an expert academic assessor. Your task is to evaluate a student's solution based on a specific criterion for a given task.
Please provide your assessment in a JSON string format with two keys: "score" (a number) and "comment" (a string explaining your score).

Task Title: "${task.title}"
Task Description: "${task.description}"

Criterion to Evaluate:
- Name: "${criterion.name}"
- Description: "${criterion.description}"
- Maximum Points: ${criterion.maxPoints}

Student's Solution:
\`\`\`
${taskSolution.solutionText}
\`\`\`

Based on the criterion's description and the maximum points, evaluate the student's solution specifically for this criterion.
The score should be an integer between 0 and ${criterion.maxPoints}.
The comment should justify the score and provide constructive feedback related to this criterion.

Return ONLY the JSON string. For example: {"score": ${Math.floor(criterion.maxPoints / 2)}, "comment": "The solution partially meets the criterion..."}
`;

      try {
        const aiResponse =
          await this.openaiApiService.getChatCompletion(prompt);

        if (!aiResponse) {
          this.logger.warn(
            `AI did not return a response for criterion "${criterion.name}" (ID: ${criterion.id}). Assigning default score 0.`,
          );
          criteriaScores.push({
            criterionId: criterion.id,
            score: 0,
            comment:
              'AI evaluation failed or returned no response for this criterion.',
          });
          continue;
        }

        this.logger.debug(
          `Raw AI response for criterion "${criterion.name}" (ID: ${criterion.id}): ${aiResponse}`,
        );

        let parsedResponse;
        try {
          const cleanedAiResponse = aiResponse.replace(
            /^```json\s*|```\s*$/g,
            '',
          );
          parsedResponse = JSON.parse(cleanedAiResponse);
        } catch (parseError) {
          this.logger.error(
            `Failed to parse AI JSON response for criterion "${criterion.name}" (ID: ${criterion.id}): ${parseError.message}. Response: ${aiResponse}. Assigning default score 0.`,
          );
          criteriaScores.push({
            criterionId: criterion.id,
            score: 0,
            comment: `AI evaluation returned an invalid format: ${aiResponse.substring(0, 100)}...`,
          });
          continue;
        }

        if (
          typeof parsedResponse.score !== 'number' ||
          typeof parsedResponse.comment !== 'string'
        ) {
          this.logger.error(
            `AI response for criterion "${criterion.name}" (ID: ${criterion.id}) has incorrect structure: ${JSON.stringify(parsedResponse)}. Assigning default score 0.`,
          );
          criteriaScores.push({
            criterionId: criterion.id,
            score: 0,
            comment: `AI evaluation returned unexpected structure: ${aiResponse.substring(0, 100)}...`,
          });
          continue;
        }

        let score = parsedResponse.score;
        if (score < 0) score = 0;
        if (score > criterion.maxPoints) score = criterion.maxPoints;
        score = Math.round(score);

        criteriaScores.push({
          criterionId: criterion.id,
          score: score,
          comment: parsedResponse.comment,
        });
        this.logger.debug(
          `Successfully evaluated criterion "${criterion.name}" (ID: ${criterion.id}). Score: ${score}, Comment: ${parsedResponse.comment.substring(0, 50)}...`,
        );
      } catch (error) {
        this.logger.error(
          `Error evaluating criterion "${criterion.name}" (ID: ${criterion.id}) with AI: ${error.message}`,
          error.stack,
        );
        criteriaScores.push({
          criterionId: criterion.id,
          score: 0,
          comment: `Error during AI evaluation for this criterion: ${error.message}`,
        });
      }
    }

    this.logger.log(
      `Finished evaluating all criteria for task solution ID: ${taskSolution.id}`,
    );
    return criteriaScores;
  }

  private async generateFeedback(
    task: TaskDto,
    taskSolution: TaskSolutionDto,
    criteriaScores: CriterionScoreDto[],
  ): Promise<string> {
    this.logger.log(
      `Generating overall feedback for task: "${task.title}" (ID: ${task.id}), solution ID: ${taskSolution.id}`,
    );

    const criteriaDetails = task.criteria
      .map((criterion) => {
        const scoreInfo = criteriaScores.find(
          (cs) => cs.criterionId === criterion.id,
        );
        return `- Criterion: "${criterion.name}" (Max Points: ${criterion.maxPoints})\n  - Score: ${scoreInfo?.score ?? 'N/A'}\n  - AI Comment: ${scoreInfo?.comment ?? 'No comment available'}`;
      })
      .join('\n\n');

    const prompt = `
You are an expert academic assessor. Your task is to provide overall feedback and a summary for a student's solution to a programming task, based on the scores and comments provided for individual criteria.

Task Title: "${task.title}"
Task Description: "${task.description}"

Student's Solution:
\`\`\`
${taskSolution.solutionText}
\`\`\`

Assessment per Criterion:
${criteriaDetails}

Based on the task, the student's solution, and the detailed assessment for each criterion, please:
1. Provide a concise overall feedback statement for the student.
2. Summarize the key strengths and areas for improvement.
3. Maintain a constructive and encouraging tone.

Return ONLY the feedback text. Do not include any preamble like "Here is the feedback:".
`;

    try {
      const aiFeedback = await this.openaiApiService.getChatCompletion(prompt);
      if (!aiFeedback) {
        this.logger.warn(
          `AI did not return feedback for task solution ID: ${taskSolution.id}. Using default message.`,
        );
        return 'Overall feedback could not be generated by the AI at this time.';
      }
      this.logger.log(
        `Successfully generated AI feedback for task solution ID: ${taskSolution.id}. Length: ${aiFeedback.length}`,
      );
      return aiFeedback;
    } catch (error) {
      this.logger.error(
        `Error generating AI feedback for task solution ID: ${taskSolution.id}: ${error.message}`,
        error.stack,
      );
      return `An error occurred while generating AI feedback: ${error.message}`;
    }
  }
}
