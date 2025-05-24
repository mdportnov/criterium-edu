import { apiRequest } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

export const AuthService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data,
    });
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/register',
      data,
    });
  },

  async getCurrentUser() {
    return apiRequest({
      method: 'GET',
      url: '/auth/profile',
    });
  },

  logout() {
    localStorage.removeItem('token');
    // You might want to redirect to login page or refresh the app state
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
