import api from './axios.ts';
import { LoginPayload, RegisterPayload, TokenResponse } from '../types';

export const authService = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/register', payload);
    return response.data;
  },
};
