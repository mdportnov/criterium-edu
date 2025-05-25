import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  method: string;
  url: string;
  statusCode?: number;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  durationMs?: number;
}

export interface GetAuditLogsOptions {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(data: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(options: GetAuditLogsOptions = {}) {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
    } = options;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('audit.action ILIKE :action', {
        action: `%${action}%`,
      });
    }

    if (resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', {
        resourceType,
      });
    }

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();

    const auditLogs = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: auditLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserActivityStats(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select([
        'audit.action',
        'COUNT(*) as count',
        'DATE(audit.createdAt) as date',
      ])
      .where('audit.userId = :userId', { userId })
      .andWhere('audit.createdAt >= :startDate', { startDate })
      .groupBy('audit.action, DATE(audit.createdAt)')
      .orderBy('date', 'DESC')
      .getRawMany();

    return stats;
  }

  async getSystemStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalActions = await this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :startDate', { startDate })
      .getCount();

    const uniqueUsers = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('COUNT(DISTINCT audit.userId)', 'count')
      .where('audit.createdAt >= :startDate', { startDate })
      .andWhere('audit.userId IS NOT NULL')
      .getRawOne();

    const topActions = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select(['audit.action', 'COUNT(*) as count'])
      .where('audit.createdAt >= :startDate', { startDate })
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const errorRate = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select([
        'COUNT(CASE WHEN audit.statusCode >= 400 THEN 1 END) as errors',
        'COUNT(*) as total',
      ])
      .where('audit.createdAt >= :startDate', { startDate })
      .getRawOne();

    return {
      totalActions,
      uniqueUsers: parseInt(uniqueUsers.count),
      topActions,
      errorRate: {
        errors: parseInt(errorRate.errors),
        total: parseInt(errorRate.total),
        percentage:
          errorRate.total > 0
            ? (parseInt(errorRate.errors) / parseInt(errorRate.total)) * 100
            : 0,
      },
    };
  }
}