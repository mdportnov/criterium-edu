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
  async runChecker(code: string, language: string, taskId?: number): Promise<CheckerResult> {
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

  async getCheckerLanguages(): Promise<string[]> {
    return apiRequest<string[]>({
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
};
