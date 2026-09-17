import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AutoAssessment } from './entities/auto-assessment.entity';
import {
  AssessmentSession,
  AssessmentSessionStatus,
} from './entities/assessment-session.entity';
import {
  CreateSessionDto,
  PaginatedResponse,
  PaginationDto,
  ReviewSource,
} from '@app/shared';
import { TaskSolutionReview } from './entities/task-solution-review.entity';
import { CriterionScore } from './entities/criterion-score.entity';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';
import { User } from '../users/entities/user.entity';
import {
  AutoAssessRequestDto,
  SourceAutoAssessRequestDto,
  TaskAutoAssessRequestDto,
} from '../task-solutions/entities/solution-import.dto';
import { OpenaiApiService } from '../openai/services/openai.service';
import { SettingsService } from '../settings/settings.service';
import { Logger } from 'nestjs-pino';

interface AssessmentResult {
  criteriaScores: Record<string, number>;
  comments: string;
  totalScore: number;
}

@Injectable()
export class AutoAssessmentService {
  constructor(
    @InjectRepository(AutoAssessment)
    private readonly assessmentRepository: Repository<AutoAssessment>,
    @InjectRepository(AssessmentSession)
    private readonly sessionRepository: Repository<AssessmentSession>,
    @InjectRepository(TaskSolutionReview)
    private readonly reviewRepository: Repository<TaskSolutionReview>,
    @InjectRepository(CriterionScore)
    private readonly criterionScoreRepository: Repository<CriterionScore>,
    @InjectRepository(TaskSolution)
    private readonly solutionRepository: Repository<TaskSolution>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly openaiService: OpenaiApiService,
    private readonly settingsService: SettingsService,
    private readonly logger: Logger,
  ) {}

  private async getDefaultModel(): Promise<string> {
    return this.settingsService.getOpenAIDefaultModel();
  }

  async createAssessmentSession(
    dto: CreateSessionDto,
    userId: string,
  ): Promise<AssessmentSession> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const solutions = await this.solutionRepository.find({
      where: { id: In(dto.solutionIds) },
      relations: ['task', 'user'],
    });

    if (!solutions.length) {
      throw new NotFoundException('No solutions found for the provided IDs');
    }

    interface TaskSummary {
      id: string;
      title: string;
      description: string;
      criteria: unknown[];
    }

    const taskInfo = solutions.reduce<Record<string, TaskSummary>>(
      (acc, solution) => {
        const taskId = solution.task.id;
        if (!acc[taskId]) {
          acc[taskId] = {
            id: taskId,
            title: solution.task.title,
            description: solution.task.description,
            criteria: solution.task.criteria || [],
          };
        }
        return acc;
      },
      {},
    );

    const firstTask = Object.values(taskInfo)[0] as any;

    const session = this.sessionRepository.create({
      name: dto.name,
      description: dto.description,
      status: AssessmentSessionStatus.PENDING,
      initiatedBy: user,
      llmModel: dto.llmModel || (await this.getDefaultModel()),
      systemPrompt: dto.systemPrompt,
      configuration: {
        temperature: dto.temperature || 0.7,
        maxTokens: dto.maxTokens || 2000,
      },
      totalSolutions: dto.solutionIds.length,
      processedSolutions: 0,
      successfulAssessments: 0,
      failedAssessments: 0,
      solutionIds: dto.solutionIds,
      metadata: {
        taskTitle: firstTask?.title,
        taskDescription: firstTask?.description,
        taskCriteria: firstTask?.criteria,
      },
    });

    return this.sessionRepository.save(session);
  }

  async processAssessmentSession(
    sessionId: string,
  ): Promise<AssessmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['initiatedBy'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status !== AssessmentSessionStatus.PENDING) {
      throw new Error(`Session is already ${session.status}`);
    }

    await this.sessionRepository.update(sessionId, {
      status: AssessmentSessionStatus.IN_PROGRESS,
    });

    const results: AutoAssessment[] = [];
    const errors: any[] = [];
    const processingTimes: number[] = [];
    let totalTokens = 0;
    let totalCost = 0;
    const scoreDistribution: Record<number, number> = {};

    try {
      for (const solutionId of session.solutionIds) {
        try {
          const startTime = Date.now();
          const assessment = await this.assessSolutionWithMetrics(
            solutionId,
            session.llmModel,
            session.systemPrompt,
            sessionId,
          );

          const processingTime = Date.now() - startTime;
          processingTimes.push(processingTime);
          results.push(assessment);

          if (assessment.tokenUsage) {
            totalTokens += assessment.tokenUsage;
          }
          if (assessment.cost) {
            totalCost += assessment.cost;
          }

          const scoreRange = Math.floor(assessment.totalScore);
          scoreDistribution[scoreRange] =
            (scoreDistribution[scoreRange] || 0) + 1;

          await this.sessionRepository.update(sessionId, {
            processedSolutions: session.processedSolutions + 1,
            successfulAssessments: session.successfulAssessments + 1,
            progress:
              ((session.processedSolutions + 1) / session.totalSolutions) * 100,
          });

          session.processedSolutions++;
          session.successfulAssessments++;
        } catch (error) {
          this.logger.error(
            {
              message: `Error assessing solution ${solutionId}`,
              error: error instanceof Error ? error.message : String(error),
              solutionId,
              sessionId,
            },
            AutoAssessmentService.name,
          );

          errors.push({
            solutionId,
            error: (error as Error).message,
            timestamp: new Date(),
          });

          await this.sessionRepository.update(sessionId, {
            processedSolutions: session.processedSolutions + 1,
            failedAssessments: session.failedAssessments + 1,
            progress:
              ((session.processedSolutions + 1) / session.totalSolutions) * 100,
          });

          session.processedSolutions++;
          session.failedAssessments++;
        }
      }

      const completionTime = new Date();
      const totalTime = completionTime.getTime() - session.startedAt.getTime();
      const averageProcessingTime =
        processingTimes.length > 0
          ? processingTimes.reduce((sum, time) => sum + time, 0) /
            processingTimes.length
          : 0;

      await this.sessionRepository.update(sessionId, {
        status: AssessmentSessionStatus.COMPLETED,
        completedAt: completionTime,
        progress: 100,
        statistics: {
          totalTime,
          averageProcessingTime,
          averageScore:
            results.reduce((sum, r) => sum + r.totalScore, 0) /
            (results.length || 1),
          modelUsage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens,
            estimatedCost: totalCost,
          },
          criteriaDistribution: scoreDistribution,
          processingTimes,
          totalAssessments: session.totalSolutions,
          successfulAssessments: session.successfulAssessments,
          failedAssessments: session.failedAssessments,
        },
        errors,
      });

      const updatedSession = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['initiatedBy'],
      });

      if (!updatedSession) {
        throw new NotFoundException(
          `Session with ID ${sessionId} not found after update`,
        );
      }

      return updatedSession;
    } catch (error) {
      await this.sessionRepository.update(sessionId, {
        status: AssessmentSessionStatus.FAILED,
        completedAt: new Date(),
        errorMessage: (error as Error).message,
        errors: [
          ...errors,
          { error: (error as Error).message, timestamp: new Date() },
        ],
      });
      throw error;
    }
  }

  async assessSolutions(dto: AutoAssessRequestDto): Promise<AutoAssessment[]> {
    const model = dto.llmModel || (await this.getDefaultModel());
    const results: AutoAssessment[] = [];

    for (const solutionId of dto.solutionIds) {
      try {
        const assessment = await this.assessSolution(solutionId, model);
        results.push(assessment);
      } catch (error) {
        this.logger.error(
          {
            message: `Error assessing solution ${solutionId}`,
            error: error instanceof Error ? error.message : String(error),
            solutionId,
          },
          AutoAssessmentService.name,
        );
        // Continue with next solution
      }
    }

    return results;
  }

  async assessSolutionsByTask(
    dto: TaskAutoAssessRequestDto,
  ): Promise<AutoAssessment[]> {
    const model = dto.llmModel || (await this.getDefaultModel());
    const solutions = await this.solutionRepository.find({
      where: { task: { id: dto.taskId } },
      relations: ['task', 'user'],
    });

    if (!solutions.length) {
      return [];
    }

    const solutionIds = solutions.map((s) => s.id);
    return this.assessSolutions({
      solutionIds,
      llmModel: model,
    });
  }

  async assessSolutionsBySource(
    dto: SourceAutoAssessRequestDto,
  ): Promise<AutoAssessment[]> {
    const model = dto.llmModel || (await this.getDefaultModel());
    const solutions = await this.solutionRepository.find({
      where: { source: { id: dto.sourceId } },
      relations: ['task', 'user'],
    });

    if (!solutions.length) {
      return [];
    }

    const solutionIds = solutions.map((s) => s.id);
    return this.assessSolutions({
      solutionIds,
      llmModel: model,
    });
  }

  private async assessSolutionWithMetrics(
    solutionId: string,
    model: string,
    customSystemPrompt?: string,
    sessionId?: string,
  ): Promise<AutoAssessment> {
    const solution = await this.solutionRepository.findOne({
      where: { id: solutionId },
      relations: ['task', 'user'],
    });

    if (!solution) {
      throw new NotFoundException(`Solution with ID ${solutionId} not found`);
    }

    const task = solution.task;

    // Check if assessment already exists
    const existingAssessment = await this.assessmentRepository.findOne({
      where: { solution: { id: solutionId }, llmModel: model },
    });

    if (existingAssessment) {
      return existingAssessment;
    }

    // Create the prompt for assessment
    const assessmentPrompt = this.createAssessmentPrompt(task, solution);
    const startTime = Date.now();

    this.logger.log(
      {
        message: 'Assessment prompt being sent to OpenAI',
        prompt: assessmentPrompt,
        solutionId,
        sessionId,
      },
      AutoAssessmentService.name,
    );

    const response = await this.openaiService.complete({
      prompt: assessmentPrompt,
      model,
      temperature: 0.2,
      maxTokens: 2000,
      systemPrompt:
        customSystemPrompt ||
        'You are an expert educator and assessor. Return assessments in valid JSON format only. Do not include any explanatory text before or after the JSON.',
      taskId: task?.id,
      userId: solution.user?.id,
      operationType: 'auto_assessment',
    });
    const processingTime = Date.now() - startTime;

    const assessment = this.parseAssessmentResponse(response.content);

    // Save the assessment with metrics
    const newAssessment = this.assessmentRepository.create({
      solution,
      criteriaScores: assessment.criteriaScores,
      comments: assessment.comments,
      totalScore: assessment.totalScore,
      llmModel: model,
      promptUsed: assessmentPrompt,
      rawResponse: response.content,
      tokenUsage: response.usage?.totalTokens || 0,
      cost: response.costUsd,
      processingTime,
      sessionId,
    });

    const savedAssessment = await this.assessmentRepository.save(newAssessment);

    // Create corresponding TaskSolutionReview for the UI
    await this.createTaskSolutionReviewFromAssessment(
      savedAssessment,
      solution,
    );

    return savedAssessment;
  }

  private async assessSolution(
    solutionId: string,
    model: string,
  ): Promise<AutoAssessment> {
    const solution = await this.solutionRepository.findOne({
      where: { id: solutionId },
      relations: ['task', 'user'],
    });

    if (!solution) {
      throw new NotFoundException(`Solution with ID ${solutionId} not found`);
    }

    const task = solution.task;

    // Check if assessment already exists
    const existingAssessment = await this.assessmentRepository.findOne({
      where: { solution: { id: solutionId }, llmModel: model },
    });

    if (existingAssessment) {
      return existingAssessment;
    }

    // Create the prompt for assessment
    const prompt = this.createAssessmentPrompt(task, solution);

    const response = await this.openaiService.complete({
      prompt,
      model,
      temperature: 0.2,
      taskId: task?.id,
      userId: solution.user?.id,
      operationType: 'auto_assessment',
    });

    const assessment = this.parseAssessmentResponse(response.content);

    // Save the assessment
    const newAssessment = this.assessmentRepository.create({
      solution,
      criteriaScores: assessment.criteriaScores,
      comments: assessment.comments,
      totalScore: assessment.totalScore,
      llmModel: model,
      promptUsed: prompt,
      rawResponse: response.content,
      tokenUsage: response.usage?.totalTokens || 0,
      cost: response.costUsd,
    });

    return this.assessmentRepository.save(newAssessment);
  }

  private createAssessmentPrompt(task: any, solution: TaskSolution): string {
    // Get task details
    const taskDescription = task.description || 'No task description provided';
    const taskCriteriaString = task.criteria
      ? task.criteria
          .map(
            (c: any) =>
              `${c.name} (Max Points: ${c.maxPoints}): ${c.description}`,
          )
          .join('\n')
      : 'No specific criteria provided';
    const idealSolution = task.authorSolution || 'No ideal solution provided';
    const studentSolution = solution.content || 'No solution content provided';

    return `You are an experienced educator tasked with evaluating a student's solution to a programming or technical task.

## Task Description:
${taskDescription}

## Evaluation Criteria:
${taskCriteriaString}

## Ideal Solution (Reference Only):
${idealSolution}

## Student Solution to Evaluate:
${studentSolution}

Evaluate the student's solution based on the criteria provided. Your evaluation should be objective, fair, and constructive.

You MUST respond with ONLY valid JSON in the following format (no other text):
{
  "criteriaScores": {
    "criteria1Name": score,
    "criteria2Name": score
  },
  "comments": "Detailed feedback about the solution, highlighting strengths and areas for improvement",
  "totalScore": overallScore
}

Important:
- Scores should be numbers between 0-10
- Extract criteria names from the evaluation criteria section
- If no specific criteria are given, use general categories like "correctness", "efficiency", "style"
- Return ONLY the JSON object, no other text or explanations`;
  }

  /**
   * Pulls the assessment JSON out of a completion.
   *
   * The client returns the message content directly, so the four-way shape
   * sniffing this used to do - raw string, OpenAI envelope, extracted
   * content, and a nested envelope inside content - is gone. Models still
   * wrap JSON in prose or fences, so the extraction stays.
   */
  private parseAssessmentResponse(content: string | null): AssessmentResult {
    if (!content) {
      this.logger.error(
        { message: 'Assessment completion returned no content' },
        AutoAssessmentService.name,
      );
      return {
        criteriaScores: {},
        comments:
          'The model returned no content. Nothing has been scored; re-run the assessment.',
        totalScore: 0,
      };
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in the response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<AssessmentResult>;

      // No invented defaults: a malformed payload is reported, not scored as
      // a middling 5 out of nowhere.
      if (
        typeof parsed.totalScore !== 'number' ||
        typeof parsed.criteriaScores !== 'object' ||
        parsed.criteriaScores === null
      ) {
        throw new Error(
          'Response JSON is missing criteriaScores or a numeric totalScore',
        );
      }

      return {
        criteriaScores: parsed.criteriaScores,
        comments: parsed.comments ?? '',
        totalScore: parsed.totalScore,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(
        {
          message: 'Error parsing assessment response',
          error: reason,
          contentPreview: content.slice(0, 500),
        },
        AutoAssessmentService.name,
      );

      return {
        criteriaScores: {},
        comments: `The model response could not be parsed (${reason}). Nothing has been scored; re-run the assessment.`,
        totalScore: 0,
      };
    }
  }

  async getAssessment(id: string): Promise<AutoAssessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id },
      relations: ['solution', 'solution.task'],
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async getAssessmentsBySolution(
    solutionId: string,
  ): Promise<AutoAssessment[]> {
    return this.assessmentRepository.find({
      where: { solution: { id: solutionId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getAssessmentSession(sessionId: string): Promise<AssessmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['initiatedBy'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  async getAllSessions(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<AssessmentSession> | AssessmentSession[]> {
    if (!paginationDto) {
      return this.sessionRepository.find({
        relations: ['initiatedBy'],
        order: { startedAt: 'DESC' },
      });
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [sessions, total] = await this.sessionRepository.findAndCount({
      relations: ['initiatedBy'],
      skip,
      take: size,
      order: { startedAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / size);

    return {
      data: sessions,
      total,
      page,
      size,
      totalPages,
    };
  }

  async getSessionsByUser(
    userId: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<AssessmentSession> | AssessmentSession[]> {
    if (!paginationDto) {
      return this.sessionRepository.find({
        where: { initiatedBy: { id: userId } },
        relations: ['initiatedBy'],
        order: { startedAt: 'DESC' },
      });
    }

    const { page = 1, size = 10 } = paginationDto;
    const skip = (page - 1) * size;

    const [sessions, total] = await this.sessionRepository.findAndCount({
      where: { initiatedBy: { id: userId } },
      relations: ['initiatedBy'],
      skip,
      take: size,
      order: { startedAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / size);

    return {
      data: sessions,
      total,
      page,
      size,
      totalPages,
    };
  }

  async stopSession(sessionId: string): Promise<AssessmentSession> {
    const session = await this.getAssessmentSession(sessionId);

    if (
      session.status === AssessmentSessionStatus.COMPLETED ||
      session.status === AssessmentSessionStatus.FAILED ||
      session.status === AssessmentSessionStatus.CANCELLED
    ) {
      throw new Error(`Cannot stop ${session.status} session`);
    }

    await this.sessionRepository.update(sessionId, {
      status: AssessmentSessionStatus.CANCELLED,
      completedAt: new Date(),
      errorMessage: 'Session stopped by user',
      progress: (session.processedSolutions / session.totalSolutions) * 100,
    });

    return this.getAssessmentSession(sessionId);
  }

  async restartSession(sessionId: string): Promise<AssessmentSession> {
    const session = await this.getAssessmentSession(sessionId);

    if (
      session.status !== AssessmentSessionStatus.FAILED &&
      session.status !== AssessmentSessionStatus.CANCELLED
    ) {
      throw new Error(
        `Cannot restart ${session.status} session. Only failed or cancelled sessions can be restarted.`,
      );
    }

    // Reset session to initial state
    await this.sessionRepository.update(sessionId, {
      status: AssessmentSessionStatus.PENDING,
      processedSolutions: 0,
      successfulAssessments: 0,
      failedAssessments: 0,
      progress: 0,
      completedAt: null,
      errorMessage: null,
      errors: null,
      statistics: null,
    });

    return this.getAssessmentSession(sessionId);
  }

  async cancelSession(sessionId: string): Promise<AssessmentSession> {
    return this.stopSession(sessionId);
  }

  private async createTaskSolutionReviewFromAssessment(
    assessment: AutoAssessment,
    solution: TaskSolution,
  ): Promise<TaskSolutionReview> {
    // Check if review already exists for this solution
    const existingReview = await this.reviewRepository.findOne({
      where: {
        taskSolutionId: solution.id,
        source: ReviewSource.AUTO,
      },
    });

    if (existingReview) {
      return existingReview;
    }

    // Create TaskSolutionReview
    const review = this.reviewRepository.create({
      taskSolutionId: solution.id,
      reviewerId: null, // Auto review has no human reviewer
      totalScore: Number(assessment.totalScore),
      feedbackToStudent: assessment.comments,
      reviewerComment: `Automated assessment using ${assessment.llmModel}`,
      source: ReviewSource.AUTO,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Load task with criteria to get proper criterion IDs
    const taskWithCriteria = await this.solutionRepository.findOne({
      where: { id: solution.id },
      relations: ['task', 'task.criteria'],
    });

    if (taskWithCriteria?.task?.criteria) {
      // Create CriterionScores mapped to actual task criteria
      const criterionScores = [];
      for (const [criterionName, score] of Object.entries(
        assessment.criteriaScores,
      )) {
        // Try to find matching criterion by name
        const matchingCriterion = taskWithCriteria.task.criteria.find(
          (c) => c.name.toLowerCase() === criterionName.toLowerCase(),
        );

        if (matchingCriterion) {
          const criterionScore = this.criterionScoreRepository.create({
            reviewId: savedReview.id,
            criterionId: matchingCriterion.id,
            score: Number(score),
            comment: `${criterionName}: ${score} points`,
          });
          criterionScores.push(criterionScore);
        }
      }

      if (criterionScores.length > 0) {
        await this.criterionScoreRepository.save(criterionScores);
      }
    }

    return savedReview;
  }
}
