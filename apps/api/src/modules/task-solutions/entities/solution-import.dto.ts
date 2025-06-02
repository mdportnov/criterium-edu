import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportSolutionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  userId?: string;
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
  solutionIds: string[];

  @IsString()
  @IsOptional()
  llmModel?: string;
}

export class TaskAutoAssessRequestDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsOptional()
  llmModel?: string;
}

export class SourceAutoAssessRequestDto {
  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @IsString()
  @IsOptional()
  llmModel?: string;
}
