import { apiRequest } from './api';
import type { User } from '@app/shared';
import type {
  PaginatedResponse,
  PaginationParams,
  UpdateUserRequest,
} from '@/types';

export const UserService = {
  async getProfile(): Promise<User> {
    return apiRequest<User>({
      method: 'GET',
      url: '/auth/profile',
    });
  },

  async updateProfile(data: UpdateUserRequest): Promise<User> {
    return apiRequest<User>({
      method: 'PATCH',
      url: '/users/profile',
      data,
    });
  },

  async getUsers(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<User>> {
    const params = pagination
      ? { page: pagination.page, size: pagination.size }
      : {};
    return apiRequest<PaginatedResponse<User>>({
      method: 'GET',
      url: '/users',
      params,
    });
  },

  async getUserById(id: string): Promise<User> {
    return apiRequest<User>({
      method: 'GET',
      url: `/users/${id}`,
    });
  },
};
