export enum PromptType {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface PromptTranslation {
  id: string;
  languageCode: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  promptType: PromptType;
  defaultLanguage: string;
  variables: string[];
  isActive: boolean;
  translations: PromptTranslation[];
  creator: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptDto {
  key: string;
  name: string;
  description?: string;
  category: string;
  promptType?: PromptType;
  defaultLanguage?: string;
  variables?: string[];
  translations: {
    languageCode: string;
    content: string;
  }[];
}

export interface UpdatePromptDto {
  name?: string;
  description?: string;
  category?: string;
  promptType?: PromptType;
  defaultLanguage?: string;
  variables?: string[];
  isActive?: boolean;
  translations?: {
    languageCode: string;
    content: string;
  }[];
}

export interface PromptContentRequest {
  language?: string;
  variables?: Record<string, string>;
}

export interface PromptContentResponse {
  content: string;
}