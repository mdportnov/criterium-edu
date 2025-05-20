import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BulkImportTaskCriterionDto } from './bulk-import-task-criterion.dto';

export class BulkImportTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    example: 'Implement a REST API',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the task requirements',
    example:
      'Create a REST API with endpoints for managing users and products.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description:
      'Optional author solution or reference implementation for the task',
    example: 'console.log("Hello World");',
    required: false,
  })
  @IsString()
  @IsOptional()
  authorSolution?: string;

  @ApiProperty({
    description: 'Categories the task belongs to',
    example: ['Backend', 'API Development'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({
    description: 'Tags for a task for easier searching and grouping',
    example: ['nestjs', 'typeorm', 'difficult'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Array of criteria for evaluating the task',
    type: () => [BulkImportTaskCriterionDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportTaskCriterionDto)
  @IsOptional()
  criteria?: BulkImportTaskCriterionDto[];
}
