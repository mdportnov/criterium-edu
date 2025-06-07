import { UserRole } from '@app/shared';

export interface AuditLog {
  id: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
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
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  totalActions: number;
  uniqueUsers: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  errorRate: {
    errors: number;
    total: number;
    percentage: number;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersLast30Days: number;
  usersByRole: Array<{
    role: UserRole;
    count: number;
  }>;
}

export interface ActivityStats {
  dailyActivity: Record<string, number>;
  mostActiveUsers: Array<{
    userId: string;
    email: string;
    activityCount: number;
  }>;
  totalActivities: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetUserActivityParams {
  page?: number;
  limit?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
}
