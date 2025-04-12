import api from './axios.ts';
import { User, CreateUserPayload, UpdateUserPayload } from '../types';

export const usersService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const response = await api.post<User>('/users', payload);
    return response.data;
  },

  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
