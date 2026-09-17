import { z } from 'zod';
import { createZodDto } from '../../common/zod';

/**
 * Bounded query parameters.
 *
 * The admin endpoints took `limit` and `days` straight off the query string
 * through ParseIntPipe, which enforces nothing: `?limit=1000000` was a
 * full-table read, and a negative or zero value produced nonsense offsets.
 */
export const AdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(200).optional(),
  role: z.string().trim().min(1).max(50).optional(),
  status: z.string().trim().min(1).max(50).optional(),
});
export class AdminListQueryDto extends createZodDto(AdminListQuerySchema) {}

export const UserActivityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().trim().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export class UserActivityQueryDto extends createZodDto(
  UserActivityQuerySchema,
) {}

export const AuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  userId: z.string().uuid().optional(),
  action: z.string().trim().min(1).max(100).optional(),
  resourceType: z.string().trim().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export class AuditLogQueryDto extends createZodDto(AuditLogQuerySchema) {}

/** A reporting window, in days. A year is as far back as anything reports. */
export const DaysQuerySchema = (fallback: number) =>
  z.object({
    days: z.coerce.number().int().min(1).max(365).default(fallback),
  });

export class WeekWindowQueryDto extends createZodDto(DaysQuerySchema(7)) {}
export class MonthWindowQueryDto extends createZodDto(DaysQuerySchema(30)) {}

export const RecentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export class RecentActivityQueryDto extends createZodDto(
  RecentActivityQuerySchema,
) {}
