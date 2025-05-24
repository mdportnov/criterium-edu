import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TaskCriterionDto {
  @IsNumber()
  @IsOptional()
  id?: number;

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

  @ApiProperty({ type: [String], required: false, nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({ type: [String], required: false, nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

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

  @ApiProperty({ type: [String], required: false, nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({ type: [String], required: false, nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

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

  @ApiProperty({ type: [String], required: false, nullable: true })
  categories?: string[];

  @ApiProperty({ type: [String], required: false, nullable: true })
  tags?: string[];

  criteria: TaskCriterionDto[];
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}
