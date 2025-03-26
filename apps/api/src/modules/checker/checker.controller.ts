import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { CheckerService } from './checker.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@app/shared';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('checker')
@ApiBearerAuth()
@Controller('checker')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckerController {
  constructor(private readonly checkerService: CheckerService) {}

  @Post('process/:taskSolutionId')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async processTaskSolution(
    @Param('taskSolutionId') taskSolutionId: number,
  ): Promise<any> {
    return this.checkerService.processTaskSolution(taskSolutionId);
  }
}
