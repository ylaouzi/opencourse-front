import type { CodeTestCase } from './types';

export function buildPhpTestHarnessScript({
  code,
  entryPoint,
  testCases,
}: {
  code: string;
  entryPoint: string;
  testCases: CodeTestCase[];
}): string {
  // Strip leading <?php or <? and trailing ?> if present
  let cleanCode = code.trim();
  cleanCode = cleanCode.replace(/^<\?(?:php)?\s*/i, '');
  cleanCode = cleanCode.replace(/\?>\s*$/i, '');

  const safeEntryPoint = entryPoint.trim() || 'solution';
  const testCasesJson = JSON.stringify(testCases);

  return `<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

$logs = [];

ob_start();

try {
    // --- USER SUBMITTED SOLUTION ---
    ${cleanCode}
    
    $initialOutput = ob_get_clean();
    if (!empty($initialOutput)) {
        $logs[] = $initialOutput;
    }

    if (!function_exists('${safeEntryPoint}')) {
        throw new Exception("Function '${safeEntryPoint}' is not defined. Ensure your function name matches '${safeEntryPoint}'.");
    }

    $rawJson = <<<'EOD_TESTCASES'
${testCasesJson}
EOD_TESTCASES;

    $testCases = json_decode($rawJson, true);
    if (!is_array($testCases)) {
        $testCases = [];
    }

    $results = [];

    foreach ($testCases as $tc) {
        $tcId = $tc['id'] ?? uniqid('tc_');
        $tcDesc = $tc['description'] ?? 'Test Case';
        $tcInput = isset($tc['input']) && is_array($tc['input']) ? $tc['input'] : [];
        $tcExpected = $tc['expected'] ?? null;

        $start = hrtime(true);
        try {
            ob_start();
            $actual = call_user_func_array('${safeEntryPoint}', $tcInput);
            $tcOutput = ob_get_clean();
            if (!empty($tcOutput)) {
                $logs[] = "[{$tcDesc}] " . $tcOutput;
            }

            $durationMs = round((hrtime(true) - $start) / 1e6, 2);
            
            // Strict equality, numeric tolerance, or JSON structural equality fallback
            $passed = ($actual === $tcExpected) 
                || (is_numeric($actual) && is_numeric($tcExpected) && abs((float)$actual - (float)$tcExpected) < 0.0001) 
                || (json_encode($actual) === json_encode($tcExpected));

            $results[] = [
                'id' => $tcId,
                'description' => $tcDesc,
                'input' => $tcInput,
                'expected' => $tcExpected,
                'actual' => $actual,
                'passed' => $passed,
                'durationMs' => $durationMs
            ];
        } catch (Throwable $tcErr) {
            if (ob_get_level()) {
                ob_end_clean();
            }
            $results[] = [
                'id' => $tcId,
                'description' => $tcDesc,
                'input' => $tcInput,
                'expected' => $tcExpected,
                'actual' => null,
                'error' => $tcErr->getMessage(),
                'passed' => false,
                'durationMs' => 0
            ];
        }
    }

    echo "###PHP_RESULTS_START###" . json_encode([
        'status' => 'SUCCESS',
        'results' => $results,
        'logs' => $logs
    ]) . "###PHP_RESULTS_END###";

} catch (Throwable $fatal) {
    if (ob_get_level()) {
        ob_end_clean();
    }
    echo "###PHP_RESULTS_START###" . json_encode([
        'status' => 'ERROR',
        'error' => $fatal->getMessage(),
        'logs' => $logs
    ]) . "###PHP_RESULTS_END###";
}
`;
}
