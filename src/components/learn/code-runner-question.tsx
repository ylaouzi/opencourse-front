'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Code2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CodeTestCase, CodeTestCaseResult } from '@/lib/types/api';
import { executeSandboxedCode } from '@/lib/code-runner';

interface CodeRunnerQuestionProps {
  questionId: string;
  language?: 'php' | 'javascript';
  prompt?: string;
  entryPoint?: string;
  starterCode?: string;
  testCases?: CodeTestCase[];
  currentResponse?: {
    code?: string;
    allPassed?: boolean;
    testResults?: CodeTestCaseResult[];
  };
  onChange: (res: {
    code: string;
    allPassed: boolean;
    testResults: CodeTestCaseResult[];
  }) => void;
  disabled?: boolean;
}

export function CodeRunnerQuestion({
  prompt,
  language = 'javascript',
  entryPoint = 'solution',
  starterCode = `function ${entryPoint}() {\n  // Write your solution here\n  \n}`,
  testCases = [],
  currentResponse,
  onChange,
  disabled = false,
}: CodeRunnerQuestionProps) {
  const [code, setCode] = useState<string>(
    () => currentResponse?.code ?? starterCode,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<CodeTestCaseResult[]>(
    () => currentResponse?.testResults ?? [],
  );
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => code.split('\n'), [code]);

  const passedCount = useMemo(
    () => testResults.filter((r) => r.passed).length,
    [testResults],
  );
  const totalCount = testCases.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  const runCode = useCallback(async () => {
    if (disabled || isRunning) return;
    setIsRunning(true);
    setRuntimeError(null);

    try {
      const res = await executeSandboxedCode({
        language,
        code,
        entryPoint,
        testCases,
      });

      setIsRunning(false);
      setConsoleLogs(res.logs || []);

      if (!res.success && res.error) {
        setRuntimeError(res.error);
        setActiveTab('console');
      } else {
        setTestResults(res.results);
        setActiveTab('tests');
        onChange({
          code,
          allPassed: res.allPassed,
          testResults: res.results,
        });
      }
    } catch (err: unknown) {
      setIsRunning(false);
      const msg = err instanceof Error ? err.message : String(err);
      setRuntimeError(`Execution failed: ${msg}`);
      setActiveTab('console');
    }
  }, [code, entryPoint, testCases, disabled, isRunning, language, onChange]);

  // Tab key & shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to Run Tests
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
      return;
    }

    // Tab key handling (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      if (e.shiftKey) {
        // Shift+Tab: Outdent
        const linesBefore = code.substring(0, start).split('\n');
        const currentLine = linesBefore[linesBefore.length - 1];
        if (currentLine.startsWith('  ')) {
          const newCode =
            code.substring(0, start - 2) + code.substring(start);
          setCode(newCode);
          setTimeout(() => {
            ta.selectionStart = ta.selectionEnd = Math.max(0, start - 2);
          }, 0);
        }
      } else {
        // Tab: Insert 2 spaces
        const newCode =
          code.substring(0, start) + '  ' + code.substring(end);
        setCode(newCode);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const handleReset = () => {
    if (confirm('Reset code to starter template? Your edits will be lost.')) {
      setCode(starterCode);
      setTestResults([]);
      setConsoleLogs([]);
      setRuntimeError(null);
    }
  };

  return (
    <div className="space-y-4">
      {prompt && (
        <div className="rounded-lg bg-card/60 p-3.5 text-sm leading-relaxed border border-border/70 text-card-foreground">
          {prompt}
        </div>
      )}

      {/* Editor Container */}
      <div className="rounded-xl border border-border/80 bg-neutral-950 shadow-sm overflow-hidden text-neutral-100 font-mono text-[13px]">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-2 rounded-full animate-pulse',
                language === 'php' ? 'bg-indigo-500' : 'bg-emerald-500',
              )}
            />
            <span className="text-xs font-semibold text-neutral-300">
              {language === 'php' ? '🐘 PHP 8.2 (WASM Sandbox)' : '⚡ JavaScript (Sandbox)'}
            </span>
            <span className="text-[11px] text-neutral-500 font-sans">
              entry: <code className="text-primary">{entryPoint}()</code>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={disabled || isRunning}
              title="Reset to starter code"
              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>

            <Button
              type="button"
              size="sm"
              onClick={runCode}
              disabled={disabled || isRunning}
              className="h-7 px-3 text-xs gap-1.5 font-sans font-medium"
            >
              <Play className="size-3.5 fill-current" />
              {isRunning
                ? language === 'php'
                  ? 'Running in PHP WASM...'
                  : 'Running...'
                : 'Run Tests'}
              <kbd className="hidden sm:inline-block ml-1 rounded bg-primary-foreground/20 px-1 py-0.2 text-[10px] uppercase font-mono">
                Ctrl+↵
              </kbd>
            </Button>
          </div>
        </div>

        {/* Code Input Area with Gutter */}
        <div className="relative flex min-h-[220px] max-h-[420px] overflow-auto bg-neutral-950">
          {/* Line Numbers Gutter */}
          <div
            aria-hidden="true"
            className="select-none py-3 px-2 text-right text-neutral-600 bg-neutral-900/40 border-r border-neutral-800/80 min-w-[2.5rem]"
          >
            {lines.map((_, i) => (
              <div key={i} className="leading-6 text-[12px]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isRunning}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="w-full flex-1 resize-none bg-transparent py-3 px-3.5 text-neutral-100 focus:outline-none font-mono leading-6 text-[13px] whitespace-pre tab-[2]"
            placeholder="// Write your solution function here..."
          />
        </div>

        {/* Drawer Header (Tabs) */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                activeTab === 'tests'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Code2 className="size-3.5" />
              <span>Test Cases</span>
              {testResults.length > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    allPassed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {passedCount}/{totalCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                activeTab === 'console'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Terminal className="size-3.5" />
              <span>Console</span>
              {consoleLogs.length > 0 && (
                <span className="ml-0.5 size-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="text-xs flex items-center gap-1.5">
              {allPassed ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="size-3.5" /> All Tests Passed
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> {passedCount}/{totalCount} Passed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Drawer Content */}
        <div className="p-3 bg-neutral-950/80 min-h-[120px] max-h-[240px] overflow-y-auto text-xs">
          {runtimeError && (
            <div className="mb-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
              <XCircle className="size-4 shrink-0 mt-0.5" />
              <div className="font-mono text-xs whitespace-pre-wrap">
                {runtimeError}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-2">
              {testResults.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <Play className="size-5 mx-auto mb-1.5 opacity-50" />
                  <p>Click &quot;Run Tests&quot; to test your solution against assertions.</p>
                </div>
              ) : (
                testResults.map((tr, idx) => (
                  <div
                    key={tr.id || idx}
                    className={`p-2.5 rounded border transition-colors ${
                      tr.passed
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-rose-500/30 bg-rose-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        {tr.passed ? (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        ) : (
                          <XCircle className="size-4 text-rose-400" />
                        )}
                        <span className="text-neutral-200">
                          Test {idx + 1}: {tr.description || `Case #${idx + 1}`}
                        </span>
                      </div>

                      {tr.durationMs !== undefined && (
                        <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
                          <Clock className="size-3" />
                          {tr.durationMs}ms
                        </span>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="rounded bg-neutral-900/60 p-1.5 border border-neutral-800">
                        <span className="text-neutral-500">Input: </span>
                        <span className="text-neutral-300">
                          {JSON.stringify(tr.input)}
                        </span>
                      </div>
                      <div className="rounded bg-neutral-900/60 p-1.5 border border-neutral-800">
                        <span className="text-neutral-500">Expected: </span>
                        <span className="text-emerald-400">
                          {JSON.stringify(tr.expected)}
                        </span>
                      </div>
                    </div>

                    {!tr.passed && (
                      <div className="mt-1.5 rounded bg-rose-950/30 p-1.5 border border-rose-900/40 text-[11px] font-mono text-rose-300">
                        {tr.error ? (
                          <span>Error: {tr.error}</span>
                        ) : (
                          <span>Actual: {JSON.stringify(tr.actual)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'console' && (
            <div className="font-mono text-xs">
              {consoleLogs.length === 0 ? (
                <p className="text-neutral-500 py-3 italic">
                  No console.log statements printed. Use console.log(...) in your code to debug.
                </p>
              ) : (
                <div className="space-y-1">
                  {consoleLogs.map((log, i) => (
                    <div
                      key={i}
                      className="text-neutral-300 border-b border-neutral-900 py-0.5 last:border-0"
                    >
                      <span className="text-neutral-600 select-none mr-2">&gt;</span>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {allPassed && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400 flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-emerald-400" />
          <span>Awesome! All test cases passed. You are ready to submit!</span>
        </div>
      )}
    </div>
  );
}
