import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewSource } from '../interfaces';

export class CriterionScoreDto {
  @IsNumber()
  @IsNotEmpty()
  criterionId: number;

  @IsNumber()
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateTaskSolutionReviewDto {
  @IsNumber()
  @IsNotEmpty()
  taskSolutionId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionScoreDto)
  criteriaScores: CriterionScoreDto[];

  @IsString()
  @IsNotEmpty()
  feedbackToStudent: string;

  @IsString()
  @IsOptional()
  reviewerComment?: string;

  @IsEnum(ReviewSource)
  @IsNotEmpty()
  source: ReviewSource;
}

export class UpdateTaskSolutionReviewDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CriterionScoreDto)
  criteriaScores?: CriterionScoreDto[];

  @IsString()
  @IsOptional()
  feedbackToStudent?: string;

  @IsString()
  @IsOptional()
  reviewerComment?: string;

  @IsEnum(ReviewSource)
  @IsOptional()
  source?: ReviewSource;
}

export class TaskSolutionReviewDto {
  id: number;
  taskSolutionId: number;
  reviewerId?: number;
  criteriaScores: CriterionScoreDto[];
  totalScore: number;
  feedbackToStudent: string;
  reviewerComment?: string;
  source: ReviewSource;
  createdAt: Date;
  updatedAt: Date;
}
