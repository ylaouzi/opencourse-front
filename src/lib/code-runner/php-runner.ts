import type { CodeExecutionResult, CodeTestCase, CodeTestCaseResult } from './types';
import { buildPhpTestHarnessScript } from './php-test-harness';

let phpInstancePromise: Promise<any> | null = null;

async function getPhpInstance(): Promise<any> {
  if (!phpInstancePromise) {
    phpInstancePromise = (async () => {
      const { PHP, loadPHPRuntime } = await import('@php-wasm/universal');
      // Import the browser loader module dynamically at runtime
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const dynamicImport = new Function('url', 'return import(url)');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loaderModule: any = await dynamicImport('/php-wasm/php_8_2.js');
      const runtimeId = await loadPHPRuntime(loaderModule, {
        phpWasmAsyncMode: 'asyncify',
        locateFile: (path: string) =>
          path.endsWith('.wasm') ? '/php-wasm/php_8_2.wasm' : `/php-wasm/${path}`,
      });
      return new PHP(runtimeId);
    })().catch((err) => {
      phpInstancePromise = null;
      throw err;
    });
  }
  return phpInstancePromise;
}

export async function executePhpCode({
  code,
  entryPoint = 'solution',
  testCases = [],
  timeoutMs = 4000,
}: {
  code: string;
  entryPoint?: string;
  testCases: CodeTestCase[];
  timeoutMs?: number;
}): Promise<CodeExecutionResult> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      results: [],
      logs: [],
      error: 'PHP WebAssembly execution is only supported in browser environments.',
      allPassed: false,
    };
  }

  if (!code || !code.trim()) {
    return {
      success: false,
      results: [],
      logs: [],
      error: 'Please provide PHP code to run.',
      allPassed: false,
    };
  }

  const script = buildPhpTestHarnessScript({
    code,
    entryPoint,
    testCases,
  });

  let timeoutTimer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<CodeExecutionResult>((resolve) => {
    timeoutTimer = setTimeout(() => {
      // Invalidate the instance if an infinite loop or hang occurs
      phpInstancePromise = null;
      resolve({
        success: false,
        results: [],
        logs: ['[ERROR] Execution timed out (possible infinite loop in PHP).'],
        error: `Execution timed out after ${timeoutMs}ms. Please check your loops and recursion.`,
        allPassed: false,
      });
    }, timeoutMs);
  });

  const executionPromise = (async (): Promise<CodeExecutionResult> => {
    try {
      const php = await getPhpInstance();
      const response = await php.run({ code: script });
      const rawText: string = response.text || '';

      const match = rawText.match(
        /###PHP_RESULTS_START###([\s\S]*?)###PHP_RESULTS_END###/,
      );

      if (!match) {
        // Fallback: If output didn't contain markers, check if there's an error in stdout/stderr
        const errorText = rawText.trim() || response.errors?.join('\n') || 'PHP execution produced no output.';
        return {
          success: false,
          results: [],
          logs: [errorText],
          error: errorText,
          allPassed: false,
        };
      }

      const jsonPayload = JSON.parse(match[1]);

      if (jsonPayload.status === 'ERROR') {
        return {
          success: false,
          results: [],
          logs: jsonPayload.logs || [],
          error: jsonPayload.error || 'PHP Fatal Error occurred during execution.',
          allPassed: false,
        };
      }

      const results: CodeTestCaseResult[] = jsonPayload.results || [];
      const allPassed =
        results.length > 0 && results.every((r) => r.passed === true);

      return {
        success: true,
        results,
        logs: jsonPayload.logs || [],
        allPassed,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        results: [],
        logs: [],
        error: `PHP execution error: ${msg}`,
        allPassed: false,
      };
    }
  })();

  try {
    const result = await Promise.race([executionPromise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }
}
