import { apiRequest } from './api';
import type { User } from '@app/shared/interfaces';
import type { LoginRequest, RegisterRequest } from '@/types';

/**
 * Sessions are httpOnly cookies set by the server. Nothing here stores a
 * token: the browser attaches the cookie, and the only way to know whether a
 * session is live is to ask the server.
 */
export const AuthService = {
  async login(data: LoginRequest): Promise<User> {
    return apiRequest<User>({ method: 'POST', url: '/auth/login', data });
  },

  async register(data: RegisterRequest): Promise<User> {
    return apiRequest<User>({ method: 'POST', url: '/auth/register', data });
  },

  async getCurrentUser(): Promise<User> {
    return apiRequest<User>({ method: 'GET', url: '/auth/profile' });
  },

  async logout(): Promise<void> {
    await apiRequest<void>({ method: 'POST', url: '/auth/logout' });
  },

  async setPassword(token: string, password: string): Promise<void> {
    await apiRequest<void>({
      method: 'POST',
      url: '/auth/set-password',
      data: { token, password },
    });
  },
};
