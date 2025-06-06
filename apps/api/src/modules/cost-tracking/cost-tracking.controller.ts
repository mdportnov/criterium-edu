import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@app/shared';
import { CostTrackingService } from './cost-tracking.service';

@Controller('admin/costs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CostTrackingController {
  constructor(private readonly costTrackingService: CostTrackingService) {}

  @Get('system')
  async getSystemCosts(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.costTrackingService.getSystemCosts(days);
  }

  @Get('tasks/:taskId')
  async getTaskCosts(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.costTrackingService.getTaskCosts(taskId);
  }

  @Get('users/:userId')
  async getUserCosts(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.costTrackingService.getUserCosts(userId, days);
  }
}
