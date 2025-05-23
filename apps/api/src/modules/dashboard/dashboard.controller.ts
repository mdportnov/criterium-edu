import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@app/shared';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.REVIEWER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('task-statistics')
  async getTaskStatistics(@Query('period') period: string = '7d') {
    return this.dashboardService.getTaskStatistics(period);
  }

  @Get('solution-statistics')
  async getSolutionStatistics(@Query('period') period: string = '7d') {
    return this.dashboardService.getSolutionStatistics(period);
  }

  @Get('review-statistics')
  async getReviewStatistics(@Query('period') period: string = '7d') {
    return this.dashboardService.getReviewStatistics(period);
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('performance-metrics')
  async getPerformanceMetrics(@Query('period') period: string = '30d') {
    return this.dashboardService.getPerformanceMetrics(period);
  }
}