import { api } from './api';

/** Providers the backend can talk to; all speak the OpenAI chat protocol. */
export const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
] as const;

export type LlmProvider = (typeof LLM_PROVIDERS)[number]['value'];

export interface AppSettings {
  registration_enabled: string;
  llm_provider: string;
  llm_api_key: string;
  llm_base_url: string;
  llm_model: string;
  llm_pricing: string;
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
