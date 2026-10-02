export type CodeLanguage = 'javascript' | 'php';

export interface CodeTestCase {
  id: string;
  description: string;
  input: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface CodeTestCaseResult {
  id: string;
  description: string;
  input: unknown[];
  expected: unknown;
  actual?: unknown;
  passed: boolean;
  error?: string;
  durationMs?: number;
}

export interface CodeExecutionResult {
  success: boolean;
  results: CodeTestCaseResult[];
  logs: string[];
  error?: string;
  allPassed: boolean;
}

export interface RunnerOptions {
  language?: CodeLanguage;
  code: string;
  entryPoint?: string;
  testCases: CodeTestCase[];
  timeoutMs?: number;
}
