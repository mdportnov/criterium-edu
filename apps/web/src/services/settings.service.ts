import { api } from './api';

export interface AppSettings {
  registration_enabled: string;
  openai_api_key: string;
}

export interface PublicSettings {
  registration_enabled: boolean;
}

export const settingsService = {
  getSettings: () => api.get<AppSettings>('/settings'),
  updateSettings: (settings: Partial<AppSettings>) =>
    api.put('/settings', settings),
  getPublicSettings: () => api.get<PublicSettings>('/settings/public'),
};
