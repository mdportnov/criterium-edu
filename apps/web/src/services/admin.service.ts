import { api } from './api';
import type {
  AdminUser,
  AuditLog,
  PaginatedResponse,
  SystemStats,
  UserStats,
  ActivityStats,
  GetUsersParams,
  GetAuditLogsParams,
  GetUserActivityParams,
} from '@/types/admin';
import { UserRole } from '@app/shared';

class AdminService {
  async getUsers(
    params: GetUsersParams = {},
  ): Promise<PaginatedResponse<AdminUser>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.status) searchParams.append('status', params.status);

    const response = await api.get(`/admin/users?${searchParams.toString()}`);
    return response.data;
  }

  async getUserActivity(
    userId: string,
    params: GetUserActivityParams = {},
  ): Promise<PaginatedResponse<AuditLog>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.action) searchParams.append('action', params.action);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const response = await api.get(
      `/admin/users/${userId}/activity?${searchParams.toString()}`,
    );
    return response.data;
  }

  async getAuditLogs(
    params: GetAuditLogsParams = {},
  ): Promise<PaginatedResponse<AuditLog>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.action) searchParams.append('action', params.action);
    if (params.resourceType)
      searchParams.append('resourceType', params.resourceType);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const response = await api.get(
      `/admin/audit-logs?${searchParams.toString()}`,
    );
    return response.data;
  }

  async getSystemStats(days = 7): Promise<SystemStats> {
    const response = await api.get(`/admin/stats/system?days=${days}`);
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/admin/stats/users');
    return response.data;
  }

  async getActivityStats(days = 30): Promise<ActivityStats> {
    const response = await api.get(`/admin/stats/activity?days=${days}`);
    return response.data;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<AdminUser> {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  }
}

export const adminService = new AdminService();
