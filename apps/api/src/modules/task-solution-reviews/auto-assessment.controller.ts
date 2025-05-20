import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@app/shared';
import { ApiTags } from '@nestjs/swagger';
import {
  AutoAssessRequestDto,
  TaskAutoAssessRequestDto,
  SourceAutoAssessRequestDto,
} from '../task-solutions/entities/solution-import.dto';
import { AutoAssessmentService } from './auto-assessment.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('auto-assessment')
@Controller('auto-assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AutoAssessmentController {
  constructor(private readonly assessmentService: AutoAssessmentService) {}

  @Post('solutions')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async assessSolutions(@Body() dto: AutoAssessRequestDto) {
    return this.assessmentService.assessSolutions(dto);
  }

  @Post('task')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async assessSolutionsByTask(@Body() dto: TaskAutoAssessRequestDto) {
    return this.assessmentService.assessSolutionsByTask(dto);
  }

  @Post('source')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async assessSolutionsBySource(@Body() dto: SourceAutoAssessRequestDto) {
    return this.assessmentService.assessSolutionsBySource(dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT)
  async getAssessment(@Param('id') id: number) {
    return this.assessmentService.getAssessment(id);
  }

  @Get('solution/:solutionId')
  @Roles(UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT)
  async getAssessmentsBySolution(@Param('solutionId') solutionId: number) {
    return this.assessmentService.getAssessmentsBySolution(solutionId);
  }
}
