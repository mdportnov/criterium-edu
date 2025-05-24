import { apiRequest } from './api';
import type { UpdateUserRequest, User } from '@/types';

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

  async getUsers(): Promise<User[]> {
    return apiRequest<User[]>({
      method: 'GET',
      url: '/users',
    });
  },

  async getUserById(id: number): Promise<User> {
    return apiRequest<User>({
      method: 'GET',
      url: `/users/${id}`,
    });
  },
};
