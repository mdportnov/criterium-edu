import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  PaginatedResponse,
  PaginationDto,
  UserRole,
} from '@app/shared';
import { ApiTags } from '@nestjs/swagger';
import {
  AutoAssessRequestDto,
  SourceAutoAssessRequestDto,
  TaskAutoAssessRequestDto,
} from '../task-solutions/entities/solution-import.dto';
import { AutoAssessmentService } from './auto-assessment.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { AssessmentSession } from './entities/assessment-session.entity';

@ApiTags('auto-assessment')
@Controller('auto-assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AutoAssessmentController {
  constructor(private readonly assessmentService: AutoAssessmentService) {}

  @Post('solutions')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async assessSolutions(@Body() dto: AutoAssessRequestDto) {
    return this.assessmentService.assessSolutions(dto);
  }

  @Post('task')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async assessSolutionsByTask(@Body() dto: TaskAutoAssessRequestDto) {
    return this.assessmentService.assessSolutionsByTask(dto);
  }

  @Post('source')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async assessSolutionsBySource(@Body() dto: SourceAutoAssessRequestDto) {
    return this.assessmentService.assessSolutionsBySource(dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.STUDENT)
  async getAssessment(@Param('id') id: number) {
    return this.assessmentService.getAssessment(id);
  }

  @Get('solution/:solutionId')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.STUDENT)
  async getAssessmentsBySolution(@Param('solutionId') solutionId: number) {
    return this.assessmentService.getAssessmentsBySolution(solutionId);
  }

  @Post('sessions')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async createSession(
    @Body()
    dto: {
      name: string;
      description?: string;
      solutionIds: number[];
      llmModel?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    },
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.assessmentService.createAssessmentSession({
      ...dto,
      userId: user.id,
    });
  }

  @Post('sessions/:id/process')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async processSession(@Param('id') sessionId: number) {
    // Process the session asynchronously
    this.assessmentService
      .processAssessmentSession(sessionId)
      .catch((error) => {
        console.error('Error processing assessment session:', error);
      });

    // Return immediately with session info
    return this.assessmentService.getAssessmentSession(sessionId);
  }

  @Get('sessions')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async getAllSessions(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<AssessmentSession>> {
    const result = await this.assessmentService.getAllSessions(paginationDto);

    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page: 1,
        size: result.length,
        totalPages: 1,
      };
    }

    return result;
  }

  @Get('sessions/:id')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async getSession(@Param('id') sessionId: number) {
    return this.assessmentService.getAssessmentSession(sessionId);
  }

  @Put('sessions/:id/stop')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async stopSession(@Param('id') sessionId: number) {
    return this.assessmentService.stopSession(sessionId);
  }

  @Put('sessions/:id/restart')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async restartSession(@Param('id') sessionId: number) {
    return this.assessmentService.restartSession(sessionId);
  }

  @Put('sessions/:id/cancel')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async cancelSession(@Param('id') sessionId: number) {
    return this.assessmentService.cancelSession(sessionId);
  }
}
