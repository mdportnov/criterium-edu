import { apiRequest } from './api';

export interface CheckerResult {
  success: boolean;
  results: {
    passed: boolean;
    testName: string;
    message: string;
    expected?: string;
    actual?: string;
  }[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  output: string;
}

export const CheckerService = {
  async runChecker(
    code: string,
    language: string,
    taskId?: number,
  ): Promise<CheckerResult> {
    return apiRequest<CheckerResult>({
      method: 'POST',
      url: '/checker/run',
      data: {
        code,
        language,
        taskId,
      },
    });
  },

  async runCodeCheck(params: {
    code: string;
    languageId: string;
    templateId: string;
  }): Promise<CheckerResult> {
    return apiRequest<CheckerResult>({
      method: 'POST',
      url: '/checker/run',
      data: {
        code: params.code,
        language: params.languageId,
        template: params.templateId,
      },
    });
  },

  async getCheckerLanguages(): Promise<string[]> {
    return apiRequest<string[]>({
      method: 'GET',
      url: '/checker/languages',
    });
  },

  async getSupportedLanguages(): Promise<{ id: string; name: string }[]> {
    return apiRequest<{ id: string; name: string }[]>({
      method: 'GET',
      url: '/checker/languages',
    });
  },

  async getCheckerTemplates(language: string): Promise<Record<string, string>> {
    return apiRequest<Record<string, string>>({
      method: 'GET',
      url: `/checker/templates/${language}`,
    });
  },

  async getCodeTemplates(): Promise<{ id: string; name: string; languageId: string; code: string }[]> {
    return apiRequest<{ id: string; name: string; languageId: string; code: string }[]>({
      method: 'GET',
      url: '/checker/templates',
    });
  },
};
