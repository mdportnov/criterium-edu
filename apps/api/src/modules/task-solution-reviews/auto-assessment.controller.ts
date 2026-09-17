import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, PaginatedResponse, UserRole } from '@app/shared';
import {
  AutoAssessRequestDto,
  CreateSessionDto,
  PaginationDto,
  SourceAutoAssessRequestDto,
  TaskAutoAssessRequestDto,
} from '../../common/dto';
import { ApiTags } from '@nestjs/swagger';
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

  @Get('solution/:solutionId')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.STUDENT)
  async getAssessmentsBySolution(
    @Param('solutionId', ParseUUIDPipe) solutionId: string,
  ) {
    return this.assessmentService.getAssessmentsBySolution(solutionId);
  }

  @Post('sessions')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async createSession(
    @Body()
    dto: CreateSessionDto,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.assessmentService.createAssessmentSession(dto, user.id);
  }

  @Post('sessions/:id/process')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async processSession(@Param('id', ParseUUIDPipe) sessionId: string) {
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
  async getSession(@Param('id', ParseUUIDPipe) sessionId: string) {
    return this.assessmentService.getAssessmentSession(sessionId);
  }

  @Put('sessions/:id/stop')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async stopSession(@Param('id', ParseUUIDPipe) sessionId: string) {
    return this.assessmentService.stopSession(sessionId);
  }

  @Put('sessions/:id/restart')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async restartSession(@Param('id', ParseUUIDPipe) sessionId: string) {
    return this.assessmentService.restartSession(sessionId);
  }

  @Put('sessions/:id/cancel')
  @Roles(UserRole.REVIEWER, UserRole.ADMIN)
  async cancelSession(@Param('id', ParseUUIDPipe) sessionId: string) {
    return this.assessmentService.cancelSession(sessionId);
  }

  /**
   * Declared last on purpose: Nest matches routes in declaration order, and
   * this one used to sit above /solution/:solutionId and every /sessions
   * route, swallowing all of them. GET /auto-assessment/sessions was parsed
   * as an assessment id and failed with "invalid input syntax for type uuid".
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER, UserRole.STUDENT)
  async getAssessment(@Param('id', ParseUUIDPipe) id: string) {
    return this.assessmentService.getAssessment(id);
  }
}
