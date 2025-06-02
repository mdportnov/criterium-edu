import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskSolutionStatus } from '../interfaces';

export class CreateTaskSolutionDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  solutionText: string;

  @IsString()
  @IsOptional()
  notes?: string;
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
  id: string;
  taskId: string;
  studentId: string;
  solutionText: string;
  status: TaskSolutionStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
