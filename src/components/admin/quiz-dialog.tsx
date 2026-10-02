'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
  Plus,
  Terminal,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminQuizzesApi, type QuestionPayload } from '@/lib/api/endpoints';
import { errorMessage } from '@/lib/api/client';
import { useCourseRefresh } from '@/lib/hooks/use-course-refresh';
import type {
  AdminQuestion,
  AdminQuiz,
  CodeTestCase,
  CodeTestCaseResult,
  QuestionType,
} from '@/lib/types/api';
import { executeSandboxedCode, type CodeLanguage } from '@/lib/code-runner';
import { checkQuestion } from '@/lib/quiz-rules';
import { plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DraftChoice {
  text: string;
  isCorrect: boolean;
}

export function QuizDialog({
  open,
  onOpenChange,
  quiz,
  courseId,
  moduleId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: AdminQuiz | null;
  courseId: string;
  moduleId?: string;
  title: string;
}) {
  const refresh = useCourseRefresh(courseId);
  const [editing, setEditing] = useState<AdminQuestion | 'new' | null>(null);


  const createQuiz = useMutation({
    mutationFn: () =>
      moduleId
        ? adminQuizzesApi.createForModule(moduleId, { passScore: 70 })
        : adminQuizzesApi.createFinal(courseId, { passScore: 80 }),
    onSuccess: async () => {
      await refresh();
      toast.success('Quiz created');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const setPassScore = useMutation({
    mutationFn: (passScore: number) =>
      adminQuizzesApi.update(quiz!.id, { passScore }),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteQuiz = useMutation({
    mutationFn: () => adminQuizzesApi.remove(quiz!.id),
    onSuccess: async (result: { deletedAttempts?: number }) => {
      await refresh();
      onOpenChange(false);
      toast.success(
        result?.deletedAttempts
          ? `Quiz deleted — ${plural(result.deletedAttempts, 'past attempt')} removed`
          : 'Quiz deleted',
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => adminQuizzesApi.deleteQuestion(id),
    onSuccess: async () => {
      await refresh();
      toast.success('Question removed');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) =>
      adminQuizzesApi.reorderQuestions(quiz!.id, orderedIds),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const move = (index: number, direction: -1 | 1) => {
    if (!quiz) return;
    const ids = quiz.questions.map((q) => q.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  const attempts = quiz?._count?.attempts ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Learners must reach the pass mark to unlock what comes next.
          </DialogDescription>
        </DialogHeader>

        {!quiz ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No quiz here yet.
            </p>
            <Button
              className="mt-4"
              disabled={createQuiz.isPending}
              onClick={() => createQuiz.mutate()}
            >
              {createQuiz.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Create quiz
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="pass-score">Pass mark (%)</Label>
                <Input
                  id="pass-score"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={quiz.passScore}
                  className="w-24"
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value !== quiz.passScore && value >= 1 && value <= 100) {
                      setPassScore.mutate(value);
                    }
                  }}
                />
              </div>

              {attempts > 0 && (
                <p className="text-muted-foreground flex-1 text-xs">
                  {plural(attempts, 'attempt')} recorded. Replacing a question&apos;s
                  choices discards the answer detail of past attempts — scores
                  are kept.
                </p>
              )}
            </div>

            <div className="space-y-2">
              {quiz.questions.length === 0 && (
                <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                  No questions yet. A quiz with no questions blocks publishing.
                </p>
              )}

              {quiz.questions.map((question, index) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  index={index}
                  total={quiz.questions.length}
                  busy={reorder.isPending}
                  onMove={(direction) => move(index, direction)}
                  onEdit={() => setEditing(question)}
                  onDelete={() => {
                    if (confirm('Delete this question?'))
                      deleteQuestion.mutate(question.id);
                  }}
                />
              ))}
            </div>

            {editing ? (
              <QuestionEditor
                quizId={quiz.id}
                courseId={courseId}
                question={editing === 'new' ? undefined : editing}
                onClose={() => setEditing(null)}
              />
            ) : (
              <Button variant="outline" onClick={() => setEditing('new')}>
                <Plus className="mr-1.5 size-4" /> Add question
              </Button>
            )}

            <div className="flex justify-between border-t pt-4">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteQuiz.isPending}
                onClick={() => {
                  if (confirm('Delete this quiz and all its questions?'))
                    deleteQuiz.mutate();
                }}
              >
                <Trash2 className="mr-1.5 size-3.5" /> Delete quiz
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuestionRow({
  question,
  index,
  total,
  busy,
  onMove,
  onEdit,
  onDelete,
}: {
  question: AdminQuestion;
  index: number;
  total: number;
  busy: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isFlow = question.type === 'FLOW_ORDER';
  const isCode = question.type === 'CODE_RUNNER';
  const problem = isFlow || isCode ? null : checkQuestion(question);

  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <span className="text-muted-foreground mt-0.5 text-xs tabular-nums">
          {index + 1}.
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{question.text}</p>
            {isFlow && (
              <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Sequence Puzzle
              </span>
            )}
            {isCode && (
              <span className="rounded bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {question.content?.language === 'php' ? '🐘 PHP 8.2 WASM' : '⚡ JS Sandbox'}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {isCode
              ? `entry: ${question.content?.entryPoint || 'solution'}() · ${question.content?.testCases?.length ?? 0} test cases`
              : isFlow
                ? `${question.content?.items?.length ?? 0} steps in chronological sequence`
                : `${question.multiple ? 'Multi-answer' : 'Single answer'} · ${question.choices.filter((c) => c.isCorrect).length}/${question.choices.length} correct`}
          </p>
          {problem && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="size-3.5 shrink-0" />
              {problem}
            </p>
          )}
        </div>
        <div className="flex shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === 0 || busy}
            onClick={() => onMove(-1)}
            aria-label="Move question up"
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === total - 1 || busy}
            onClick={() => onMove(1)}
            aria-label="Move question down"
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete question"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionEditor({
  quizId,
  courseId,
  question,
  onClose,
}: {
  quizId: string;
  courseId: string;
  question?: AdminQuestion;
  onClose: () => void;
}) {
  const refresh = useCourseRefresh(courseId);
  const [qType, setQType] = useState<QuestionType>(question?.type ?? 'CHOICE');
  const [text, setText] = useState(question?.text ?? '');
  const [multiple, setMultiple] = useState(question?.multiple ?? false);
  const [choices, setChoices] = useState<DraftChoice[]>(
    question?.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })) ?? [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ],
  );

  const [steps, setSteps] = useState<{ id: string; text: string }[]>(() => {
    if (question?.type === 'FLOW_ORDER' && question.content?.items) {
      const items: { id: string; text: string }[] = question.content.items;
      const solution: string[] = question.solution?.correctSequence ?? [];
      if (solution.length > 0) {
        const byId = new Map(items.map((it) => [it.id, it]));
        const sorted = solution
          .map((id) => byId.get(id))
          .filter((it): it is { id: string; text: string } => !!it);
        if (sorted.length > 0) return sorted;
      }
      return items;
    }
    return [
      { id: 'step_1', text: '' },
      { id: 'step_2', text: '' },
      { id: 'step_3', text: '' },
    ];
  });

  const [language, setLanguage] = useState<CodeLanguage>(() => {
    if (question?.content?.language === 'php' || question?.content?.language === 'javascript') {
      return question.content.language;
    }
    return 'php';
  });
  const [entryPoint, setEntryPoint] = useState<string>(
    question?.content?.entryPoint || 'solution',
  );
  const [starterCode, setStarterCode] = useState<string>(() => {
    if (question?.content?.starterCode) return question.content.starterCode;
    const ep = question?.content?.entryPoint || 'solution';
    const lang = (question?.content?.language as CodeLanguage) || 'php';
    return lang === 'php'
      ? `function ${ep}() {\n    // Write PHP solution here\n    \n}`
      : `function ${ep}() {\n  // Write JS solution here\n  \n}`;
  });
  const [referenceCode, setReferenceCode] = useState<string>(
    question?.solution?.referenceCode || '',
  );
  const [testCases, setTestCases] = useState<
    { id: string; description: string; input: string; expected: string }[]
  >(() => {
    if (question?.type === 'CODE_RUNNER' && question.content?.testCases) {
      return question.content.testCases.map((tc) => ({
        id: tc.id,
        description: tc.description,
        input: JSON.stringify(tc.input),
        expected: JSON.stringify(tc.expected),
      }));
    }
    return [
      { id: 'tc_1', description: 'Test Case 1', input: '[]', expected: '0' },
    ];
  });

  const [isTestingCode, setIsTestingCode] = useState(false);
  const [testRunResults, setTestRunResults] = useState<CodeTestCaseResult[] | null>(null);
  const [testRunError, setTestRunError] = useState<string | null>(null);
  const [testRunLogs, setTestRunLogs] = useState<string[]>([]);

  const handleTestReferenceSolution = async () => {
    if (!referenceCode.trim()) {
      setTestRunError('Please enter an Official Reference Solution first to run tests.');
      setTestRunResults(null);
      return;
    }

    setIsTestingCode(true);
    setTestRunError(null);
    setTestRunResults(null);
    setTestRunLogs([]);

    const parsedTestCases: CodeTestCase[] = testCases.map((tc, idx) => {
      let parsedInput: unknown[] = [];
      let parsedExpected: unknown = null;
      try {
        parsedInput = JSON.parse(tc.input);
        if (!Array.isArray(parsedInput)) parsedInput = [parsedInput];
      } catch {
        parsedInput = [tc.input];
      }
      try {
        parsedExpected = JSON.parse(tc.expected);
      } catch {
        parsedExpected = tc.expected;
      }

      return {
        id: tc.id || `tc_${idx + 1}`,
        description: tc.description.trim() || `Case #${idx + 1}`,
        input: parsedInput,
        expected: parsedExpected,
      };
    });

    const res = await executeSandboxedCode({
      language,
      code: referenceCode,
      entryPoint: entryPoint.trim() || 'solution',
      testCases: parsedTestCases,
    });

    setIsTestingCode(false);
    if (!res.success && res.error) {
      setTestRunError(res.error);
      setTestRunLogs(res.logs || []);
      toast.error('Test execution failed');
    } else {
      setTestRunResults(res.results);
      setTestRunLogs(res.logs || []);
      if (res.allPassed) {
        toast.success(`All ${res.results.length} test cases passed! Solution verified.`);
      } else {
        const failedCount = res.results.filter((r) => !r.passed).length;
        toast.error(`${failedCount} of ${res.results.length} test cases failed.`);
      }
    }
  };

  const changeMultiple = (next: boolean) => {
    setMultiple(next);
    if (next) return;

    setChoices((prev) => {
      const firstCorrect = prev.findIndex((c) => c.isCorrect);
      if (firstCorrect === -1) return prev;
      return prev.map((c, i) => ({ ...c, isCorrect: i === firstCorrect }));
    });
  };

  const choiceProblem =
    qType === 'CHOICE' ? checkQuestion({ multiple, choices }) : null;
  const flowProblem =
    qType === 'FLOW_ORDER'
      ? steps.filter((s) => s.text.trim().length > 0).length < 2
        ? 'Sequence puzzles require at least 2 steps'
        : null
      : null;
  const codeProblem =
    qType === 'CODE_RUNNER'
      ? testCases.filter((tc) => tc.description.trim().length > 0).length === 0
        ? 'Code challenges require at least 1 test case'
        : null
      : null;
  const problem = choiceProblem ?? flowProblem ?? codeProblem;
  const textProblem =
    text.trim().length < 3 ? 'Question text is too short' : null;

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;
    setSteps((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const save = useMutation({
    mutationFn: () => {
      let payload: QuestionPayload;

      if (qType === 'CODE_RUNNER') {
        const validTestCases = testCases
          .filter((tc) => tc.description.trim().length > 0)
          .map((tc, idx) => {
            let parsedInput: unknown[] = [];
            let parsedExpected: unknown = null;
            try {
              parsedInput = JSON.parse(tc.input);
              if (!Array.isArray(parsedInput)) parsedInput = [parsedInput];
            } catch {
              parsedInput = [tc.input];
            }
            try {
              parsedExpected = JSON.parse(tc.expected);
            } catch {
              parsedExpected = tc.expected;
            }

            return {
              id: tc.id || `tc_${idx + 1}`,
              description: tc.description.trim(),
              input: parsedInput,
              expected: parsedExpected,
            };
          });

        payload = {
          type: 'CODE_RUNNER',
          text: text.trim(),
          multiple: false,
          content: {
            language,
            entryPoint: entryPoint.trim() || 'solution',
            starterCode,
            testCases: validTestCases,
          },
          solution: {
            referenceCode: referenceCode.trim() || undefined,
          },
          choices: [],
        };
      } else if (qType === 'FLOW_ORDER') {
        const validSteps = steps
          .filter((s) => s.text.trim().length > 0)
          .map((s, idx) => ({
            id: s.id || `step_${idx + 1}_${Date.now()}`,
            text: s.text.trim(),
          }));

        payload = {
          type: 'FLOW_ORDER',
          text: text.trim(),
          multiple: false,
          content: { items: validSteps },
          solution: { correctSequence: validSteps.map((s) => s.id) },
          choices: [],
        };
      } else {
        payload = {
          type: 'CHOICE',
          text: text.trim(),
          multiple,
          choices: choices
            .filter((c) => c.text.trim().length > 0)
            .map((c) => ({ text: c.text.trim(), isCorrect: c.isCorrect })),
        };
      }

      return question
        ? adminQuizzesApi.updateQuestion(question.id, payload)
        : adminQuizzesApi.addQuestion(quizId, payload);
    },
    onSuccess: async () => {
      await refresh();
      toast.success(question ? 'Question updated' : 'Question added');
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const toggleCorrect = (index: number) =>
    setChoices((prev) =>
      prev.map((c, i) =>
        multiple
          ? i === index
            ? { ...c, isCorrect: !c.isCorrect }
            : c
          : { ...c, isCorrect: i === index },
      ),
    );

  return (
    <div className="bg-muted/30 space-y-4 rounded-lg border p-4">
      {/* Question Type Selector */}
      <div className="space-y-1.5">
        <Label>Question Format</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={qType === 'CHOICE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQType('CHOICE')}
          >
            Multiple Choice
          </Button>
          <Button
            type="button"
            variant={qType === 'FLOW_ORDER' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQType('FLOW_ORDER')}
          >
            Sequence Puzzle (FLOW_ORDER)
          </Button>
          <Button
            type="button"
            variant={qType === 'CODE_RUNNER' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQType('CODE_RUNNER')}
          >
            Code Challenge (CODE_RUNNER)
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="q-text">Question Prompt / Instructions</Label>
        <Textarea
          id="q-text"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            qType === 'CODE_RUNNER'
              ? 'Write a function sumEven(numbers) that returns the sum of all even numbers in an array:'
              : qType === 'FLOW_ORDER'
                ? 'Arrange the execution stages of the NestJS HTTP request lifecycle in order:'
                : 'Which of these are valid HTML block-level elements?'
          }
        />
      </div>

      {qType === 'CODE_RUNNER' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-muted/40">
            <div>
              <Label className="text-xs font-semibold block">Execution Sandbox Runtime</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Zero server-side execution. Runs isolated in the browser ({language === 'php' ? 'WebAssembly PHP 8.2 Zend Engine' : 'Sandboxed Web Worker'}).
              </p>
            </div>
            <div className="inline-flex rounded-lg border bg-background p-1 gap-1 shrink-0">
              <Button
                type="button"
                size="sm"
                variant={language === 'php' ? 'default' : 'ghost'}
                className="h-7 text-xs px-3 font-medium gap-1.5"
                onClick={() => {
                  setLanguage('php');
                  if (
                    !referenceCode &&
                    (starterCode.includes('// Write PHP solution') ||
                      starterCode.includes('// Write JS solution') ||
                      starterCode.includes('// Write solution here'))
                  ) {
                    setStarterCode(
                      `function ${entryPoint.trim() || 'solution'}() {\n    // Write PHP solution here\n    \n}`,
                    );
                  }
                }}
              >
                🐘 PHP 8.2 (WASM)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === 'javascript' ? 'default' : 'ghost'}
                className="h-7 text-xs px-3 font-medium gap-1.5"
                onClick={() => {
                  setLanguage('javascript');
                  if (
                    !referenceCode &&
                    (starterCode.includes('// Write PHP solution') ||
                      starterCode.includes('// Write JS solution') ||
                      starterCode.includes('// Write solution here'))
                  ) {
                    setStarterCode(
                      `function ${entryPoint.trim() || 'solution'}() {\n  // Write JS solution here\n  \n}`,
                    );
                  }
                }}
              >
                ⚡ JavaScript (Worker)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="entry-point">Function Name (Entry Point)</Label>
              <Input
                id="entry-point"
                value={entryPoint}
                onChange={(e) => setEntryPoint(e.target.value)}
                placeholder="e.g. sumEven"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="starter-code">Starter Boilerplate Code</Label>
            <Textarea
              id="starter-code"
              rows={4}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              className="font-mono text-xs bg-neutral-950 text-neutral-100"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="reference-code">
                Official Reference Solution (Saved securely)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isTestingCode || !referenceCode.trim()}
                onClick={handleTestReferenceSolution}
                className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                {isTestingCode ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Play className="size-3 fill-current" />
                )}
                {isTestingCode
                  ? `Testing in ${language === 'php' ? 'WASM' : 'Worker'}...`
                  : 'Run Test Cases'}
              </Button>
            </div>
            <Textarea
              id="reference-code"
              rows={4}
              value={referenceCode}
              onChange={(e) => {
                setReferenceCode(e.target.value);
                setTestRunResults(null);
                setTestRunError(null);
              }}
              className="font-mono text-xs bg-neutral-950 text-neutral-100"
              placeholder={
                language === 'php'
                  ? `function ${entryPoint || 'solution'}() {\n    return ...;\n}`
                  : `function ${entryPoint || 'solution'}() {\n  return ...;\n}`
              }
            />
          </div>

          {/* Test Suite Verification Status */}
          {testRunError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="size-4 shrink-0" />
                <span>Test Execution Error</span>
              </div>
              <p className="font-mono text-[11px] whitespace-pre-wrap">{testRunError}</p>
            </div>
          )}

          {testRunResults && (
            <div
              className={cn(
                'rounded-lg border p-3 text-xs flex flex-col gap-2',
                testRunResults.every((r) => r.passed)
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              <div className="flex items-center justify-between font-medium">
                <div className="flex items-center gap-2">
                  {testRunResults.every((r) => r.passed) ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="size-4 shrink-0 text-destructive" />
                  )}
                  <span>
                    {testRunResults.every((r) => r.passed)
                      ? `✓ All ${testRunResults.length} test cases passed! Solution verified in client-side ${language === 'php' ? 'PHP 8.2 WebAssembly' : 'JavaScript Web Worker'} sandbox.`
                      : `✗ ${testRunResults.filter((r) => !r.passed).length} of ${testRunResults.length} test cases failed.`}
                  </span>
                </div>
                <span className="text-[11px] font-semibold tabular-nums opacity-80">
                  {testRunResults.filter((r) => r.passed).length}/{testRunResults.length} passed
                </span>
              </div>
            </div>
          )}

          {testRunLogs.length > 0 && (
            <div className="rounded-lg border bg-neutral-950 p-2.5 text-neutral-300 font-mono text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] uppercase font-semibold">
                <Terminal className="size-3" /> Console Output ({testRunLogs.length} logs)
              </div>
              <div className="max-h-24 overflow-y-auto space-y-0.5 text-[10px]">
                {testRunLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Test Cases ({testCases.length})</Label>
                <p className="text-muted-foreground text-xs">
                  Arguments must be a JSON array of parameters (e.g. [[1, 2, 3]] or [4]).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestCases((prev) => [
                    ...prev,
                    {
                      id: `tc_${prev.length + 1}_${Date.now()}`,
                      description: `Case #${prev.length + 1}`,
                      input: '[]',
                      expected: '0',
                    },
                  ]);
                  setTestRunResults(null);
                }}
              >
                <Plus className="mr-1.5 size-3.5" /> Add test case
              </Button>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => {
                const tcResult =
                  testRunResults?.find((r) => r.id === tc.id) ||
                  testRunResults?.[idx];

                return (
                  <div
                    key={tc.id || idx}
                    className={cn(
                      'rounded-lg border p-3 bg-card space-y-2 text-xs transition-colors',
                      tcResult
                        ? tcResult.passed
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-destructive/40 bg-destructive/5'
                        : '',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">
                          Case #{idx + 1}
                        </span>
                        {tcResult && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                              tcResult.passed
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-destructive/20 text-destructive',
                            )}
                          >
                            {tcResult.passed ? (
                              <>
                                <CheckCircle2 className="size-3" />
                                Passed ({tcResult.durationMs ?? 0}ms)
                              </>
                            ) : (
                              <>
                                <XCircle className="size-3" />
                                Failed
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <Input
                        value={tc.description}
                        onChange={(e) => {
                          setTestCases((prev) =>
                            prev.map((c, i) =>
                              i === idx
                                ? { ...c, description: e.target.value }
                                : c,
                            ),
                          );
                          setTestRunResults(null);
                        }}
                        placeholder="Description (e.g. handles empty array)"
                        className="text-xs h-8 flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={testCases.length <= 1}
                        onClick={() => {
                          setTestCases((prev) => prev.filter((_, i) => i !== idx));
                          setTestRunResults(null);
                        }}
                        aria-label="Remove test case"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-muted-foreground block mb-1">
                          Arguments (JSON array):
                        </span>
                        <Input
                          value={tc.input}
                          onChange={(e) => {
                            setTestCases((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, input: e.target.value } : c,
                              ),
                            );
                            setTestRunResults(null);
                          }}
                          placeholder="e.g. [[1, 2, 3]] or [4]"
                          className="font-mono text-xs h-8"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground block mb-1">
                          Expected Output (JSON):
                        </span>
                        <Input
                          value={tc.expected}
                          onChange={(e) => {
                            setTestCases((prev) =>
                              prev.map((c, i) =>
                                i === idx
                                  ? { ...c, expected: e.target.value }
                                  : c,
                              ),
                            );
                            setTestRunResults(null);
                          }}
                          placeholder="e.g. 6 or true"
                          className="font-mono text-xs h-8"
                        />
                      </div>
                    </div>

                    {tcResult && !tcResult.passed && (
                      <div className="rounded bg-destructive/10 border border-destructive/20 p-2 font-mono text-[11px] text-destructive space-y-0.5">
                        {tcResult.error ? (
                          <p>Error: {tcResult.error}</p>
                        ) : (
                          <>
                            <p>Expected: {JSON.stringify(tcResult.expected)}</p>
                            <p>Actual returned: {JSON.stringify(tcResult.actual)}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : qType === 'CHOICE' ? (
        <>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={multiple}
              onChange={(e) => changeMultiple(e.target.checked)}
              className="size-4"
            />
            Multi-answer (learners see checkboxes and must select every correct
            choice)
          </label>

          <div className="space-y-2">
            <Label>Choices</Label>
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleCorrect(index)}
                  aria-pressed={choice.isCorrect}
                  aria-label={`Mark choice ${index + 1} correct`}
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center border text-xs transition-colors',
                    multiple ? 'rounded' : 'rounded-full',
                    choice.isCorrect
                      ? 'bg-success border-success text-background'
                      : 'hover:bg-muted',
                  )}
                >
                  {choice.isCorrect ? '✓' : ''}
                </button>
                <Input
                  value={choice.text}
                  onChange={(e) =>
                    setChoices((prev) =>
                      prev.map((c, i) =>
                        i === index ? { ...c, text: e.target.value } : c,
                      ),
                    )
                  }
                  placeholder={`Choice ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={choices.length <= 2}
                  onClick={() =>
                    setChoices((prev) => prev.filter((_, i) => i !== index))
                  }
                  aria-label={`Remove choice ${index + 1}`}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={choices.length >= 10}
              onClick={() =>
                setChoices((prev) => [...prev, { text: '', isCorrect: false }])
              }
            >
              <Plus className="mr-1.5 size-3.5" /> Add choice
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>Sequence Steps (Enter in the 100% correct solution order)</Label>
            <p className="text-muted-foreground text-xs mt-0.5">
              The platform will automatically scramble these steps for learners and grade exact sequence matches.
            </p>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {index + 1}
                </span>
                <Input
                  value={step.text}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((s, i) =>
                        i === index ? { ...s, text: e.target.value } : s,
                      ),
                    )
                  }
                  placeholder={`Step ${index + 1} description`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => moveStep(index, index - 1)}
                  aria-label="Move step up"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, index + 1)}
                  aria-label="Move step down"
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={steps.length <= 2}
                  onClick={() =>
                    setSteps((prev) => prev.filter((_, i) => i !== index))
                  }
                  aria-label="Remove step"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={steps.length >= 10}
              onClick={() =>
                setSteps((prev) => [
                  ...prev,
                  { id: `step_${prev.length + 1}_${Date.now()}`, text: '' },
                ])
              }
            >
              <Plus className="mr-1.5 size-3.5" /> Add step
            </Button>
          </div>
        </div>
      )}

      {(problem || textProblem) && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle className="size-3.5 shrink-0" />
          {textProblem ?? problem}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={Boolean(problem || textProblem) || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {question ? 'Save question' : 'Add question'}
        </Button>
      </div>
    </div>
  );
}
