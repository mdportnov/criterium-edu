import { api } from './api';
import type {
  Prompt,
  CreatePromptDto,
  UpdatePromptDto,
  PromptContentRequest,
  PromptContentResponse,
} from '../types/prompts';

export const promptsService = {
  async getAllPrompts(): Promise<Prompt[]> {
    const response = await api.get('/prompts');
    return response.data;
  },

  async getPromptById(id: string): Promise<Prompt> {
    const response = await api.get(`/prompts/${id}`);
    return response.data;
  },

  async createPrompt(data: CreatePromptDto): Promise<Prompt> {
    const response = await api.post('/prompts', data);
    return response.data;
  },

  async updatePrompt(id: string, data: UpdatePromptDto): Promise<Prompt> {
    const response = await api.put(`/prompts/${id}`, data);
    return response.data;
  },

  async deletePrompt(id: string): Promise<void> {
    await api.delete(`/prompts/${id}`);
  },

  async getPromptsByCategory(category: string): Promise<Prompt[]> {
    const response = await api.get(`/prompts/by-category/${category}`);
    return response.data;
  },

  async getPromptContent(
    key: string,
    params?: PromptContentRequest,
  ): Promise<PromptContentResponse> {
    const searchParams = new URLSearchParams();
    if (params?.language) {
      searchParams.append('language', params.language);
    }
    if (params?.variables) {
      searchParams.append('variables', JSON.stringify(params.variables));
    }

    const response = await api.get(
      `/prompts/content/${key}?${searchParams.toString()}`,
    );
    return response.data;
  },

  async getAvailableCategories(): Promise<string[]> {
    const response = await api.get('/prompts/categories');
    return response.data;
  },

  async getAvailableLanguages(): Promise<string[]> {
    const response = await api.get('/prompts/languages');
    return response.data;
  },
};