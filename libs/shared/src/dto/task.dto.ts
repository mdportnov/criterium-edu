import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TaskCriterionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  maxPoints: number;

  @IsString()
  @IsOptional()
  checkerComments?: string;
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  authorSolution?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskCriterionDto)
  criteria: TaskCriterionDto[];
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  authorSolution?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TaskCriterionDto)
  criteria?: TaskCriterionDto[];
}

export class TaskDto {
  id: number;
  title: string;
  description: string;
  authorSolution?: string;
  criteria: TaskCriterionDto[];
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}
