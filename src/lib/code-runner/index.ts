import type { CodeExecutionResult, RunnerOptions } from './types';
import { executePhpCode } from './php-runner';
import { executeJavascriptCode } from './javascript-runner';

export * from './types';
export { executePhpCode } from './php-runner';
export { executeJavascriptCode } from './javascript-runner';

export async function executeSandboxedCode(
  options: RunnerOptions,
): Promise<CodeExecutionResult> {
  const language = options.language || 'javascript';

  if (language === 'php') {
    return executePhpCode({
      code: options.code,
      entryPoint: options.entryPoint,
      testCases: options.testCases,
      timeoutMs: options.timeoutMs ?? 4000,
    });
  }

  return executeJavascriptCode({
    code: options.code,
    entryPoint: options.entryPoint,
    testCases: options.testCases,
    timeoutMs: options.timeoutMs ?? 3000,
  });
}
