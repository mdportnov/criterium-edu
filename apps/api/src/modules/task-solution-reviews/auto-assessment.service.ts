import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AutoAssessment } from './entities/auto-assessment.entity';
import {
  AssessmentSession,
  AssessmentSessionStatus,
} from './entities/assessment-session.entity';
import { TaskSolutionReview } from './entities/task-solution-review.entity';
import { CriterionScore } from './entities/criterion-score.entity';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import {
  AutoAssessRequestDto,
  SourceAutoAssessRequestDto,
  TaskAutoAssessRequestDto,
} from '../task-solutions/entities/solution-import.dto';
import { ReviewSource } from '@app/shared';
import { OpenAIService } from '../shared/services/openai.service';
import { Logger } from 'nestjs-pino';

interface AssessmentResult {
  criteriaScores: Record<string, number>;
  comments: string;
  totalScore: number;
}

interface CreateSessionDto {
  name: string;
  description?: string;
  solutionIds: number[];
  llmModel?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  userId: number;
}

@Injectable()
export class AutoAssessmentService {
  private defaultModel: string;

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
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly openaiService: OpenAIService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.defaultModel = this.configService.get<string>(
      'OPENAI_DEFAULT_MODEL',
      'gpt-4o',
    );
  }

  async createAssessmentSession(
    dto: CreateSessionDto,
  ): Promise<AssessmentSession> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const solutions = await this.solutionRepository.find({
      where: { id: In(dto.solutionIds) },
      relations: ['task', 'user'],
    });

    if (!solutions.length) {
      throw new NotFoundException('No solutions found for the provided IDs');
    }

    const taskInfo = solutions.reduce((acc, solution) => {
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
    }, {});

    const firstTask = Object.values(taskInfo)[0] as any;

    const session = this.sessionRepository.create({
      name: dto.name,
      description: dto.description,
      status: AssessmentSessionStatus.PENDING,
      initiatedBy: user,
      llmModel: dto.llmModel || this.defaultModel,
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
    sessionId: number,
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
    const model = dto.llmModel || this.defaultModel;
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
    const model = dto.llmModel || this.defaultModel;
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
    const model = dto.llmModel || this.defaultModel;
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
    solutionId: number,
    model: string,
    customSystemPrompt?: string,
    sessionId?: number,
  ): Promise<AutoAssessment> {
    const solution = await this.solutionRepository.findOne({
      where: { id: solutionId },
      relations: ['task'],
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

    // Call OpenAI API with metrics tracking
    const response = await this.openaiService.createCompletionWithMetrics(
      assessmentPrompt,
      model,
      0.2,
      2000,
      customSystemPrompt ||
        'You are an expert educator and assessor. Return assessments in valid JSON format only. Do not include any explanatory text before or after the JSON.',
    );
    const processingTime = Date.now() - startTime;

    // Parse the response
    const assessment = this.parseAssessmentResponse(response);

    // Save the assessment with metrics
    const newAssessment = this.assessmentRepository.create({
      solution,
      criteriaScores: assessment.criteriaScores,
      comments: assessment.comments,
      totalScore: assessment.totalScore,
      llmModel: model,
      promptUsed: assessmentPrompt,
      rawResponse: response.content,
      tokenUsage: response.usage?.total_tokens || 0,
      cost: this.calculateCost(response.usage, model),
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
    solutionId: number,
    model: string,
  ): Promise<AutoAssessment> {
    const solution = await this.solutionRepository.findOne({
      where: { id: solutionId },
      relations: ['task'],
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

    // Call OpenAI API
    const response = await this.openaiService.createCompletion(prompt, model);

    // Parse the response
    const assessment = this.parseAssessmentResponse(response);

    // Save the assessment
    const newAssessment = this.assessmentRepository.create({
      solution,
      criteriaScores: assessment.criteriaScores,
      comments: assessment.comments,
      totalScore: assessment.totalScore,
      llmModel: model,
      promptUsed: prompt,
      rawResponse: response,
    });

    return this.assessmentRepository.save(newAssessment);
  }

  private createAssessmentPrompt(task: Task, solution: TaskSolution): string {
    // Get task details
    const taskDescription = task.description || 'No task description provided';
    const taskCriteriaString = task.criteria
      ? task.criteria
          .map(
            (c) => `${c.name} (Max Points: ${c.maxPoints}): ${c.description}`,
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

  private parseAssessmentResponse(response: any): AssessmentResult {
    // Parse the JSON response from OpenAI
    try {
      let contentStr = '';

      // Handle different response formats
      if (typeof response === 'string') {
        contentStr = response;
      } else if (response.choices && response.choices[0]?.message?.content) {
        // OpenAI API response format
        contentStr = response.choices[0].message.content;
      } else if (response.content && typeof response.content === 'string') {
        // If content is already extracted
        contentStr = response.content;
      } else if (
        response.content &&
        response.content.choices &&
        response.content.choices[0]?.message?.content
      ) {
        // Nested content structure from createCompletionWithMetrics
        contentStr = response.content.choices[0].message.content;
      } else {
        this.logger.error(
          {
            message: 'Unexpected response format',
            response: JSON.stringify(response, null, 2),
          },
          AutoAssessmentService.name,
        );
        throw new Error('Unexpected response format');
      }

      this.logger.log(
        {
          message: 'Content to parse',
          content: contentStr,
        },
        AutoAssessmentService.name,
      );

      // Try to extract JSON from the content string
      let jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, try to extract from response without curly braces
        const lines = contentStr.split('\n').filter((line) => line.trim());
        const jsonLine = lines.find(
          (line) => line.includes('{') && line.includes('}'),
        );
        if (jsonLine) {
          jsonMatch = jsonLine.match(/\{[\s\S]*\}/);
        }
      }

      if (!jsonMatch) {
        this.logger.error(
          {
            message: 'No valid JSON found in response content',
            content: contentStr,
          },
          AutoAssessmentService.name,
        );
        throw new Error('No valid JSON found in the response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);

      // Validate and provide defaults if needed
      const criteriaScores = parsedResult.criteriaScores || { general: 5 };
      const comments =
        parsedResult.comments ||
        'Assessment completed with default values due to parsing issues.';
      const totalScore =
        typeof parsedResult.totalScore === 'number'
          ? parsedResult.totalScore
          : 5;

      return {
        criteriaScores,
        comments,
        totalScore,
      };
    } catch (error) {
      this.logger.error(
        {
          message: 'Error parsing assessment response',
          error: error instanceof Error ? error.message : String(error),
          response: JSON.stringify(response, null, 2),
        },
        AutoAssessmentService.name,
      );

      // Return a default assessment with more helpful error information
      return {
        criteriaScores: { general: 0 },
        comments: `Error processing the assessment: ${error.message}. The LLM response could not be parsed correctly.`,
        totalScore: 0,
      };
    }
  }

  async getAssessment(id: number): Promise<AutoAssessment> {
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
    solutionId: number,
  ): Promise<AutoAssessment[]> {
    return this.assessmentRepository.find({
      where: { solution: { id: solutionId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getAssessmentSession(sessionId: number): Promise<AssessmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['initiatedBy'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  async getAllSessions(): Promise<AssessmentSession[]> {
    return this.sessionRepository.find({
      relations: ['initiatedBy'],
      order: { startedAt: 'DESC' },
    });
  }

  async getSessionsByUser(userId: number): Promise<AssessmentSession[]> {
    return this.sessionRepository.find({
      where: { initiatedBy: { id: userId } },
      relations: ['initiatedBy'],
      order: { startedAt: 'DESC' },
    });
  }

  async stopSession(sessionId: number): Promise<AssessmentSession> {
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

  async restartSession(sessionId: number): Promise<AssessmentSession> {
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

  async cancelSession(sessionId: number): Promise<AssessmentSession> {
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

  private calculateCost(usage: any, model: string): number {
    if (!usage) return 0;

    // OpenAI pricing (per 1K tokens) - these would typically come from config
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4o'];
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;

    return inputCost + outputCost;
  }
}
