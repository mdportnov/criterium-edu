import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@app/shared';
import { AdminService } from './admin.service';
import {
  AdminListQueryDto,
  AuditLogQueryDto,
  MonthWindowQueryDto,
  UserActivityQueryDto,
  WeekWindowQueryDto,
} from '../../common/dto';

export class UpdateUserRoleDto extends createZodDto(
  z.object({ role: z.nativeEnum(UserRole) }),
) {}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query() query: AdminListQueryDto) {
    return this.adminService.getUsers({
      ...query,
      role: query.role as UserRole | undefined,
    });
  }

  @Get('users/:id/activity')
  async getUserActivity(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query() query: UserActivityQueryDto,
  ) {
    return this.adminService.getUserActivity(userId, query);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('stats/system')
  async getSystemStats(@Query() query: WeekWindowQueryDto) {
    return this.adminService.getSystemStats(query.days);
  }

  @Get('stats/users')
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('stats/activity')
  async getActivityStats(@Query() query: MonthWindowQueryDto) {
    return this.adminService.getActivityStats(query.days);
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, body.role);
  }
}
