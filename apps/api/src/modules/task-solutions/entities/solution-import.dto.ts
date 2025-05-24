import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ImportSolutionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsNotEmpty()
  taskId: number;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsNumber()
  @IsOptional()
  userId?: number;
}

export class BatchImportSolutionsDto {
  @IsArray()
  @IsNotEmpty()
  solutions: ImportSolutionDto[];

  @IsString()
  @IsNotEmpty()
  sourceName: string;
}

export class AutoAssessRequestDto {
  @IsArray()
  @IsNotEmpty()
  solutionIds: number[];

  @IsString()
  @IsOptional()
  llmModel?: string;
}

export class TaskAutoAssessRequestDto {
  @IsNumber()
  @IsNotEmpty()
  taskId: number;

  @IsString()
  @IsOptional()
  llmModel?: string;
}

export class SourceAutoAssessRequestDto {
  @IsNumber()
  @IsNotEmpty()
  sourceId: number;

  @IsString()
  @IsOptional()
  llmModel?: string;
}
