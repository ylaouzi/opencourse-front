'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { quizzesApi } from '@/lib/api/endpoints';
import { errorMessage, errorMessages, errorStatus } from '@/lib/api/client';
import type { AttemptResult } from '@/lib/types/api';
import { plural } from '@/lib/format';
import { useApplyProgress, usePlayer } from '@/lib/hooks/use-player';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { QuizResult } from '@/components/learn/quiz-result';

import { FlowOrderQuestion } from '@/components/learn/flow-order-question';
import { CodeRunnerQuestion } from '@/components/learn/code-runner-question';
import type { CodeTestCaseResult } from '@/lib/types/api';

export default function QuizPage() {
  const { courseId, quizId } = useParams<{
    courseId: string;
    quizId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const applyProgress = useApplyProgress(courseId);
  const { data: player } = usePlayer(courseId);

  // Question id -> selected choice ids (for CHOICE)
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  // Question id -> response payload (e.g. { sequence: [...] } for FLOW_ORDER, { code, allPassed, testResults } for CODE_RUNNER)
  const [responses, setResponses] = useState<
    Record<
      string,
      {
        sequence?: string[];
        code?: string;
        allPassed?: boolean;
        testResults?: CodeTestCaseResult[];
      }
    >
  >({});
  const [result, setResult] = useState<AttemptResult | null>(null);

  const {
    data: quiz,
    isPending,
    error,
  } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizzesApi.get(quizId),
  });

  const submit = useMutation({
    mutationFn: () => {
      if (!quiz) return Promise.reject(new Error('Quiz not loaded'));

      const submissionPayload = quiz.questions.map((q) => {
        if (q.type === 'FLOW_ORDER') {
          return {
            questionId: q.id,
            response: responses[q.id] ?? {
              sequence: q.content?.items?.map((it) => it.id) ?? [],
            },
          };
        }
        if (q.type === 'CODE_RUNNER') {
          return {
            questionId: q.id,
            response: responses[q.id] ?? {
              code: q.content?.starterCode ?? '',
              allPassed: false,
              testResults: [],
            },
          };
        }
        return {
          questionId: q.id,
          choiceIds: answers[q.id] ?? [],
        };
      });

      return quizzesApi.submit(quizId, submissionPayload);
    },
    onSuccess: (attempt) => {
      setResult(attempt);
      applyProgress(attempt);
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error) => {
      // The API validates the submission structurally and can return several
      // problems at once.
      const problems = errorMessages(error);
      toast.error(problems[0], {
        description: problems.length > 1 ? problems.slice(1).join('\n') : undefined,
      });
    },
  });

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    const locked = errorStatus(error) === 403;
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">
          {locked ? 'This quiz is locked' : 'Could not load this quiz'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {errorMessage(error)}
        </p>
        <ButtonLink className="mt-6" href={`/learn/${courseId}`}>
          Go to what is next
        </ButtonLink>
      </div>
    );
  }

  if (result) {
    return (
      <QuizResult
        result={result}
        quiz={quiz}
        onRetry={() => {
          setResult(null);
          setAnswers({});
          setResponses({});
        }}
        onContinue={() => {
          const next = result.progress.nextUp;
          router.push(
            next
              ? next.kind === 'lesson'
                ? `/learn/${courseId}/lessons/${next.id}`
                : `/learn/${courseId}/quizzes/${next.id}`
              : `/learn/${courseId}`,
          );
        }}
      />
    );
  }

  const answered = quiz.questions.filter((q) => {
    if (q.type === 'FLOW_ORDER') {
      return (
        (responses[q.id]?.sequence?.length ?? 0) > 0 ||
        (q.content?.items && q.content.items.length > 0)
      );
    }
    if (q.type === 'CODE_RUNNER') {
      return (responses[q.id]?.code?.trim().length ?? 0) > 0;
    }
    return (answers[q.id]?.length ?? 0) > 0;
  }).length;
  const isFinal = quiz.type === 'FINAL';

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header>
        <p className="text-muted-foreground text-sm">
          {isFinal ? 'Final exam' : 'Module quiz'}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {isFinal ? player?.course.title : 'Check your understanding'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {plural(quiz.questions.length, 'question')} · pass mark{' '}
          {quiz.passScore}%
          {quiz.attemptCount > 0 &&
            ` · ${plural(quiz.attemptCount, 'previous attempt')}`}
          {quiz.bestScore !== null && ` · best ${quiz.bestScore}%`}
        </p>
      </header>

      <ol className="mt-8 space-y-6">
        {quiz.questions.map((question, index) => {
          const isFlow = question.type === 'FLOW_ORDER';
          const isCode = question.type === 'CODE_RUNNER';

          return (
            <li key={question.id} className="bg-card rounded-lg border p-5">
              <div className="flex gap-3">
                <span className="text-muted-foreground text-sm tabular-nums">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{question.text}</p>
                    {isFlow && (
                      <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                        Sequence Puzzle
                      </span>
                    )}
                    {isCode && (
                      <span className="rounded bg-indigo-500/10 text-indigo-500 px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                        Code Challenge
                      </span>
                    )}
                  </div>

                  {isCode ? (
                    <div className="mt-4">
                      <CodeRunnerQuestion
                        questionId={question.id}
                        language={question.content?.language as any}
                        entryPoint={question.content?.entryPoint}
                        starterCode={question.content?.starterCode}
                        testCases={question.content?.testCases ?? []}
                        currentResponse={responses[question.id]}
                        onChange={(codeRes) =>
                          setResponses((prev) => ({
                            ...prev,
                            [question.id]: codeRes,
                          }))
                        }
                        disabled={submit.isPending}
                      />
                    </div>
                  ) : isFlow ? (
                    <div className="mt-4">
                      <FlowOrderQuestion
                        questionId={question.id}
                        items={question.content?.items ?? []}
                        currentSequence={responses[question.id]?.sequence}
                        onChange={(sequence) =>
                          setResponses((prev) => ({
                            ...prev,
                            [question.id]: { sequence },
                          }))
                        }
                        disabled={submit.isPending}
                      />
                    </div>
                  ) : (
                    <>
                      {question.multiple && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Select all that apply
                        </p>
                      )}

                      <div className="mt-4 space-y-2">
                        {question.choices.map((choice) => {
                          const selected =
                            answers[question.id]?.includes(choice.id) ?? false;

                          return (
                            <label
                              key={choice.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors',
                                selected
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50',
                              )}
                            >
                              <input
                                type={question.multiple ? 'checkbox' : 'radio'}
                                name={question.id}
                                checked={selected}
                                onChange={() =>
                                  setAnswers((prev) => {
                                    const current = prev[question.id] ?? [];
                                    if (!question.multiple) {
                                      return {
                                        ...prev,
                                        [question.id]: [choice.id],
                                      };
                                    }
                                    return {
                                      ...prev,
                                      [question.id]: current.includes(choice.id)
                                        ? current.filter(
                                            (id) => id !== choice.id,
                                          )
                                        : [...current, choice.id],
                                    };
                                  })
                                }
                                className="size-4 shrink-0"
                              />
                              <span>{choice.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6">
        <Button
          disabled={submit.isPending}
          onClick={() => submit.mutate()}
          size="lg"
        >
          {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Submit answers
        </Button>

        <p className="text-muted-foreground text-sm">
          {answered} of {quiz.questions.length} answered
        </p>

        {answered < quiz.questions.length && (
          <p className="flex items-center gap-1.5 text-xs text-warning">
            <AlertTriangle className="size-3.5" />
            Unanswered questions score zero
          </p>
        )}
      </footer>
    </div>
  );
}
