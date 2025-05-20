import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkImportTaskCriterionDto {
  @ApiProperty({
    description: 'Name of the criterion',
    example: 'Code Clarity',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Detailed description of what this criterion assesses',
    example:
      'The code should be clear, well-commented, and easy to understand.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Maximum points achievable for this criterion',
    example: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  maxPoints: number;
}
