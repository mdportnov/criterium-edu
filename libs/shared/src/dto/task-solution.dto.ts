import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskSolutionStatus } from '../interfaces';

export class CreateTaskSolutionDto {
  @IsNumber()
  @IsNotEmpty()
  taskId: number;

  @IsString()
  @IsNotEmpty()
  solutionText: string;
}

export class UpdateTaskSolutionDto {
  @IsString()
  @IsOptional()
  solutionText?: string;

  @IsEnum(TaskSolutionStatus)
  @IsOptional()
  status?: TaskSolutionStatus;
}

export class TaskSolutionDto {
  id: number;
  taskId: number;
  studentId: number;
  solutionText: string;
  status: TaskSolutionStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
