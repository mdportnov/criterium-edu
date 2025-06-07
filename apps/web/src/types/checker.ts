export interface CodeLanguage {
  id: string;
  name: string;
}

export interface CodeTemplate {
  id: string;
  name: string;
  languageId: string;
  code: string;
}

export interface TestResultItem {
  passed: boolean;
  description: string;
  errorMessage?: string;
}

export interface CheckResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  testResults: TestResultItem[];
  output?: string;
}

export interface RunCodeCheckRequest {
  code: string;
  languageId: string;
  templateId?: string;
}
