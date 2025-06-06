import { api } from './api';
import type { SystemCostsDto, TaskCostsDto, UserCostsDto } from '@app/shared';

class CostTrackingService {
  async getSystemCosts(days = 30): Promise<SystemCostsDto> {
    const response = await api.get(`/admin/costs/system?days=${days}`);
    return response.data;
  }

  async getTaskCosts(taskId: string): Promise<TaskCostsDto> {
    const response = await api.get(`/admin/costs/tasks/${taskId}`);
    return response.data;
  }

  async getUserCosts(userId: string, days = 30): Promise<UserCostsDto> {
    const response = await api.get(`/admin/costs/users/${userId}?days=${days}`);
    return response.data;
  }
}

export const costTrackingService = new CostTrackingService();
