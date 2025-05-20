import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Equal } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AutoAssessment } from './entities/auto-assessment.entity';
import { TaskSolution } from '../task-solutions/entities/task-solution.entity';
import { Task } from '../tasks/entities/task.entity';
import {
  AutoAssessRequestDto,
  SourceAutoAssessRequestDto,
  TaskAutoAssessRequestDto,
} from '../task-solutions/entities/solution-import.dto';
import { OpenAIService } from '../shared/services/openai.service';

interface AssessmentResult {
  criteriaScores: Record<string, number>;
  comments: string;
  totalScore: number;
}

@Injectable()
export class AutoAssessmentService {
  private defaultModel: string;

  constructor(
    @InjectRepository(AutoAssessment)
    private readonly assessmentRepository: Repository<AutoAssessment>,
    @InjectRepository(TaskSolution)
    private readonly solutionRepository: Repository<TaskSolution>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly openaiService: OpenAIService,
    private readonly configService: ConfigService,
  ) {
    this.defaultModel = this.configService.get<string>(
      'OPENAI_DEFAULT_MODEL',
      'gpt-4o',
    );
  }

  async assessSolutions(dto: AutoAssessRequestDto): Promise<AutoAssessment[]> {
    const model = dto.llmModel || this.defaultModel;
    const results: AutoAssessment[] = [];

    for (const solutionId of dto.solutionIds) {
      try {
        const assessment = await this.assessSolution(solutionId, model);
        results.push(assessment);
      } catch (error) {
        console.error(`Error assessing solution ${solutionId}:`, error);
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
      where: { task: Equal(dto.taskId) },
      relations: ['task', 'user', 'source'],
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
      where: { source: Equal(dto.sourceId) },
      relations: ['task', 'user', 'source'],
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
    const taskDescription = task.description;
    const taskCriteriaString = task.criteria
      ? task.criteria
          .map(
            (c) => `${c.name} (Max Points: ${c.maxPoints}): ${c.description}`,
          )
          .join('\n')
      : 'No specific criteria provided';
    const idealSolution = task.authorSolution || 'No ideal solution provided';

    return `
You are an experienced educator tasked with evaluating a student's solution to a programming or technical task.

## Task Description:
${taskDescription}

## Evaluation Criteria:
${taskCriteriaString}

## Ideal Solution (Reference Only):
${idealSolution}

## Student Solution to Evaluate:
${solution.content}

Evaluate the student's solution based on the criteria provided. Your evaluation should be objective, fair, and constructive.

Respond in the following JSON format:
{
  "criteriaScores": {
    "criteria1Name": score,
    "criteria2Name": score,
    ... (scores should be between 0-10)
  },
  "comments": "Detailed feedback about the solution, highlighting strengths and areas for improvement",
  "totalScore": overallScore (between 0-10)
}

Please extract criteria names from the evaluation criteria section. If no specific criteria are given, use general categories like "correctness", "efficiency", "style", etc.
`;
  }

  private parseAssessmentResponse(response: any): AssessmentResult {
    // Parse the JSON response from OpenAI
    try {
      // If the response is already an object, use it directly
      if (
        typeof response === 'object' &&
        response.criteriaScores &&
        response.comments &&
        response.totalScore
      ) {
        return response;
      }

      // If the response is a string, extract the JSON part
      let jsonStr = '';
      if (typeof response === 'string') {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        } else {
          throw new Error('No valid JSON found in the response');
        }
      } else if (
        response.choices &&
        response.choices[0] &&
        response.choices[0].message
      ) {
        // OpenAI API response format
        jsonStr = response.choices[0].message.content;
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      const parsedResult = JSON.parse(jsonStr);

      // Ensure the result has the expected properties
      if (
        !parsedResult.criteriaScores ||
        !parsedResult.comments ||
        typeof parsedResult.totalScore !== 'number'
      ) {
        throw new Error('Invalid response format');
      }

      return {
        criteriaScores: parsedResult.criteriaScores,
        comments: parsedResult.comments,
        totalScore: parsedResult.totalScore,
      };
    } catch (error) {
      console.error('Error parsing assessment response:', error);

      // Return a default assessment
      return {
        criteriaScores: { error: 0 },
        comments:
          'Error processing the assessment. The LLM response could not be parsed correctly.',
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
}
