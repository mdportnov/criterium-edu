import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkImportSolutionDto {
  @ApiProperty({
    description: 'Student name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @ApiProperty({
    description: 'Student ID',
    example: 'STU001',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Solution code content',
    example: 'console.log("Hello World");',
  })
  @IsString()
  @IsNotEmpty()
  solutionContent: string;

  @ApiProperty({
    description: 'Task ID to associate solution with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({
    description: 'Optional submission notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
