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
  @IsString()
  @IsNotEmpty()
  criterionId: string;

  @IsNumber()
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateTaskSolutionReviewDto {
  @IsString()
  @IsNotEmpty()
  taskSolutionId: string;

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

  @IsString()
  @IsOptional()
  reviewerId?: string;
}

export class TaskSolutionReviewDto {
  id: string;
  taskSolutionId: string;
  reviewerId?: string;
  criteriaScores: CriterionScoreDto[];
  totalScore: number;
  feedbackToStudent: string;
  reviewerComment?: string;
  source: ReviewSource;
  createdAt: Date;
  updatedAt: Date;
}
