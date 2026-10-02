import type { CodeExecutionResult, CodeTestCase, CodeTestCaseResult } from './types';

export const JAVASCRIPT_WORKER_SCRIPT = `
function deepEqual(a, b) {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let k of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

self.onmessage = function(e) {
  const { code, entryPoint, testCases } = e.data;
  const logs = [];
  const fakeConsole = {
    log: function(...args) {
      logs.push(args.map(a => {
        try {
          return typeof a === 'object' ? JSON.stringify(a) : String(a);
        } catch {
          return String(a);
        }
      }).join(' '));
    },
    warn: function(...args) {
      logs.push('[WARN] ' + args.join(' '));
    },
    error: function(...args) {
      logs.push('[ERROR] ' + args.join(' '));
    }
  };

  try {
    const factory = new Function('console', code + '; return (typeof ' + entryPoint + ' !== "undefined" ? ' + entryPoint + ' : null);');
    const userFn = factory(fakeConsole);

    if (typeof userFn !== 'function') {
      self.postMessage({
        type: 'ERROR',
        error: 'Function "' + entryPoint + '" is not defined. Please ensure your function name matches "' + entryPoint + '".',
        logs: logs
      });
      return;
    }

    const results = testCases.map(function(tc) {
      const start = performance.now();
      try {
        const inputArgs = Array.isArray(tc.input) ? tc.input : [tc.input];
        const actual = userFn.apply(null, inputArgs);
        const durationMs = Math.max(0, Math.round(performance.now() - start));
        const passed = deepEqual(actual, tc.expected);
        return {
          id: tc.id,
          description: tc.description,
          input: inputArgs,
          expected: tc.expected,
          actual: actual,
          passed: passed,
          durationMs: durationMs
        };
      } catch (err) {
        return {
          id: tc.id,
          description: tc.description,
          input: tc.input,
          expected: tc.expected,
          actual: undefined,
          error: err && err.message ? err.message : String(err),
          passed: false,
          durationMs: 0
        };
      }
    });

    self.postMessage({ type: 'SUCCESS', results: results, logs: logs });
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      error: 'Syntax/Parsing Error: ' + (err && err.message ? err.message : String(err)),
      logs: logs
    });
  }
};
`;

export function executeJavascriptCode({
  code,
  entryPoint = 'solution',
  testCases = [],
  timeoutMs = 3000,
}: {
  code: string;
  entryPoint?: string;
  testCases: CodeTestCase[];
  timeoutMs?: number;
}): Promise<CodeExecutionResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return resolve({
        success: false,
        results: [],
        logs: [],
        error: 'Web Workers are not supported in this environment.',
        allPassed: false,
      });
    }

    if (!code || !code.trim()) {
      return resolve({
        success: false,
        results: [],
        logs: [],
        error: 'Please provide code to run.',
        allPassed: false,
      });
    }

    let worker: Worker | null = null;
    let workerUrl: string | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
        workerUrl = null;
      }
    };

    try {
      const blob = new Blob([JAVASCRIPT_WORKER_SCRIPT], {
        type: 'application/javascript',
      });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);

      timeoutId = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          results: [],
          logs: ['[ERROR] Execution timed out (possible infinite loop).'],
          error: `Execution timed out after ${timeoutMs}ms. Please check for infinite loops or deep recursion.`,
          allPassed: false,
        });
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent) => {
        cleanup();
        const data = e.data;
        if (data.type === 'ERROR') {
          resolve({
            success: false,
            results: [],
            logs: data.logs || [],
            error: data.error,
            allPassed: false,
          });
        } else if (data.type === 'SUCCESS') {
          const results: CodeTestCaseResult[] = data.results || [];
          const allPassed =
            results.length > 0 && results.every((r) => r.passed === true);
          resolve({
            success: true,
            results,
            logs: data.logs || [],
            allPassed,
          });
        }
      };

      worker.onerror = (err: ErrorEvent) => {
        cleanup();
        resolve({
          success: false,
          results: [],
          logs: [],
          error: err.message || 'Worker execution failed.',
          allPassed: false,
        });
      };

      worker.postMessage({
        code,
        entryPoint,
        testCases,
      });
    } catch (err: unknown) {
      cleanup();
      const msg = err instanceof Error ? err.message : String(err);
      resolve({
        success: false,
        results: [],
        logs: [],
        error: `Failed to initialize test runner: ${msg}`,
        allPassed: false,
      });
    }
  });
}
