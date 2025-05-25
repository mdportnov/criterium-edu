import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuditService, GetAuditLogsOptions } from '../audit/audit.service';
import { UserRole } from '@app/shared';

export interface GetUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: string;
}

export interface GetUserActivityOptions {
  page?: number;
  limit?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async getUsers(options: GetUsersOptions = {}) {
    const { page = 1, limit = 20, search, role } = options;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Note: isActive field not available in current User entity
    // if (status === 'active') {
    //   queryBuilder.andWhere('user.isActive = true');
    // } else if (status === 'inactive') {
    //   queryBuilder.andWhere('user.isActive = false');
    // }

    const total = await queryBuilder.getCount();

    const users = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserActivity(userId: string, options: GetUserActivityOptions = {}) {
    const auditOptions: GetAuditLogsOptions = {
      ...options,
      userId,
    };

    return this.auditService.getAuditLogs(auditOptions);
  }

  async getAuditLogs(options: GetAuditLogsOptions = {}) {
    return this.auditService.getAuditLogs(options);
  }

  async getSystemStats(days = 7) {
    return this.auditService.getSystemStats(days);
  }

  async getUserStats() {
    const totalUsers = await this.userRepository.count();

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.role', 'COUNT(*) as count'])
      .groupBy('user.role')
      .getRawMany();

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    return {
      totalUsers,
      activeUsers: totalUsers, // All users are considered active since no isActive field
      inactiveUsers: 0,
      newUsersLast30Days,
      usersByRole: usersByRole.map((item) => ({
        role: item.user_role,
        count: parseInt(item.count),
      })),
    };
  }

  async getActivityStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily activity stats
    const dailyStats = await this.auditService.getAuditLogs({
      startDate,
      limit: 1000000, // Get all records for stats
    });

    // Group by date
    const activityByDate: Record<string, number> = {};
    dailyStats.data.forEach((log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    // Get most active users
    const userActivity: Record<string, { count: number; email: string }> = {};
    dailyStats.data.forEach((log) => {
      if (log.user) {
        const userId = log.user.id;
        if (!userActivity[userId]) {
          userActivity[userId] = { count: 0, email: log.user.email };
        }
        userActivity[userId].count++;
      }
    });

    const mostActiveUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([userId, data]) => ({
        userId,
        email: data.email,
        activityCount: data.count,
      }));

    return {
      dailyActivity: activityByDate,
      mostActiveUsers,
      totalActivities: dailyStats.total,
    };
  }
}