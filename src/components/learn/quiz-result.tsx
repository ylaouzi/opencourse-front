'use client';

import { ArrowRight, Check, Minus, RotateCcw, X, Code2, Sparkles } from 'lucide-react';
import type { AttemptResult, StudentQuiz } from '@/lib/types/api';
import { plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Grading is exact set match (plan §3b): a multi-answer question scores zero
 * unless the selection matches the key exactly. That is only fair if the
 * learner can see WHY — so missed-correct and wrongly-selected choices are
 * marked differently rather than both just being "wrong".
 */
export function QuizResult({
  result,
  quiz,
  onRetry,
  onContinue,
}: {
  result: AttemptResult;
  quiz: StudentQuiz;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const choiceText = new Map(
    quiz.questions.flatMap((q) => q.choices.map((c) => [c.id, c.text])),
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header
        className={cn(
          'rounded-lg border p-6 text-center',
          result.passed
            ? 'border-success/30 bg-success-subtle'
            : 'border-warning/30 bg-warning-subtle',
        )}
      >
        <p className="text-5xl font-bold tabular-nums">{result.score}%</p>
        <p className="mt-2 text-lg font-medium">
          {result.passed ? 'Passed' : 'Not passed yet'}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {result.correctCount} of {result.totalQuestions} questions correct ·
          pass mark {result.passScore}% · attempt {result.attemptNumber}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {result.passed ? (
            <Button onClick={onContinue}>
              Continue <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <>
              <Button onClick={onRetry}>
                <RotateCcw className="mr-2 size-4" /> Try again
              </Button>
              <Button variant="outline" onClick={onContinue}>
                Review the lessons
              </Button>
            </>
          )}
        </div>
      </header>

      <h2 className="mt-10 text-lg font-semibold tracking-tight">
        Your answers
      </h2>

      <ol className="mt-4 space-y-4">
        {result.questions.map((question, index) => {
          const partiallyRight =
            !question.isCorrect &&
            question.selectedChoiceIds.some((id) =>
              question.correctChoiceIds.includes(id),
            );

          return (
            <li key={question.questionId} className="bg-card rounded-lg border p-5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-background',
                    question.isCorrect ? 'bg-success' : 'bg-destructive',
                  )}
                >
                  {question.isCorrect ? (
                    <Check className="size-3" />
                  ) : (
                    <X className="size-3" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <span className="text-muted-foreground mr-1.5 text-sm tabular-nums">
                      {index + 1}.
                    </span>
                    {question.text}
                  </p>

                  {question.codeRunnerReview ? (
                    <CodeRunnerReviewSection review={question.codeRunnerReview} />
                  ) : question.flowOrderReview ? (
                    <FlowOrderReviewSection review={question.flowOrderReview} />
                  ) : (
                    <>
                      {/* The whole point of the missed/extra split: explain a zero
                          on an answer that was nearly right. */}
                      {partiallyRight && (
                        <p className="mt-1.5 text-xs text-warning">
                          {question.missedCorrectIds.length > 0 &&
                            `You missed ${plural(question.missedCorrectIds.length, 'correct answer')}. `}
                          {question.wronglySelectedIds.length > 0 &&
                            `You picked ${plural(question.wronglySelectedIds.length, 'wrong answer')}. `}
                          This question needs an exact match.
                        </p>
                      )}

                      <ul className="mt-3 space-y-1.5">
                        {[
                          ...new Set([
                            ...question.correctChoiceIds,
                            ...question.selectedChoiceIds,
                          ]),
                        ].map((choiceId) => {
                          const isCorrect =
                            question.correctChoiceIds.includes(choiceId);
                          const wasSelected =
                            question.selectedChoiceIds.includes(choiceId);

                          return (
                            <li
                              key={choiceId}
                              className={cn(
                                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                                isCorrect &&
                                  wasSelected &&
                                  'border-success/40 bg-success-subtle',
                                isCorrect &&
                                  !wasSelected &&
                                  'border-warning/40 bg-warning-subtle',
                                !isCorrect &&
                                  wasSelected &&
                                  'border-destructive/40 bg-destructive-subtle',
                              )}
                            >
                              {isCorrect ? (
                                <Check className="size-3.5 shrink-0 text-success" />
                              ) : (
                                <X className="size-3.5 shrink-0 text-destructive" />
                              )}
                              <span className="flex-1">
                                {choiceText.get(choiceId) ?? 'Choice'}
                              </span>
                              <span className="text-muted-foreground shrink-0 text-xs">
                                {isCorrect &&
                                  wasSelected &&
                                  'you picked · correct'}
                                {isCorrect && !wasSelected && 'you missed this'}
                                {!isCorrect &&
                                  wasSelected &&
                                  'you picked · wrong'}
                              </span>
                            </li>
                          );
                        })}

                        {question.selectedChoiceIds.length === 0 && (
                          <li className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Minus className="size-3.5" /> You skipped this question
                          </li>
                        )}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FlowOrderReviewSection({
  review,
}: {
  review: NonNullable<AttemptResult['questions'][0]['flowOrderReview']>;
}) {
  const itemText = new Map(review.items.map((it) => [it.id, it.text]));

  return (
    <div className="mt-4 space-y-4">
      {/* Student's submitted sequence */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Your Submitted Sequence:
        </p>
        <ol className="space-y-2">
          {review.submittedSequence.map((id, idx) => {
            const isSlotCorrect = id === review.correctSequence[idx];
            return (
              <li
                key={id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                  isSlotCorrect
                    ? 'border-success/40 bg-success-subtle'
                    : 'border-destructive/40 bg-destructive-subtle',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background',
                    isSlotCorrect ? 'bg-success' : 'bg-destructive',
                  )}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium text-foreground">
                  {itemText.get(id) ?? id}
                </span>
                <span className="text-xs font-medium shrink-0">
                  {isSlotCorrect ? (
                    <span className="text-success flex items-center gap-1">
                      <Check className="size-3.5" /> Correct position
                    </span>
                  ) : (
                    <span className="text-destructive flex items-center gap-1">
                      <X className="size-3.5" /> Misplaced
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* If wrong, reveal correct sequence */}
      {!review.isCorrect && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
            <Check className="size-3.5" /> Official Solution Sequence:
          </p>
          <ol className="space-y-1.5">
            {review.correctSequence.map((id, idx) => (
              <li
                key={id}
                className="flex items-center gap-2.5 text-xs text-foreground/90 py-1"
              >
                <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span>{itemText.get(id) ?? id}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function CodeRunnerReviewSection({
  review,
}: {
  review: NonNullable<AttemptResult['questions'][0]['codeRunnerReview']>;
}) {
  return (
    <div className="mt-4 space-y-4">
      {/* Submitted Code */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Code2 className="size-3.5" /> Your Submitted Code:
        </p>
        <pre className="rounded-lg bg-neutral-950 p-3.5 text-neutral-200 font-mono text-xs overflow-x-auto border border-neutral-800">
          <code>{review.code || '// No code was submitted'}</code>
        </pre>
      </div>

      {/* Test Cases Summary */}
      <div className="rounded-lg border p-3.5 bg-card/60">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Test Cases Evaluation:
          </span>
          <span
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              review.isCorrect
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-amber-500/10 text-amber-500',
            )}
          >
            {review.passedTestsCount} / {review.totalTestsCount} Passed
          </span>
        </div>

        <div className="space-y-1.5">
          {review.testResults.map((tr, i) => (
            <div
              key={tr.id || i}
              className={cn(
                'p-2.5 rounded text-xs flex items-center justify-between font-mono border',
                tr.passed
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/5 text-rose-300',
              )}
            >
              <div className="flex items-center gap-2">
                {tr.passed ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <X className="size-3.5 text-rose-400" />
                )}
                <span className="text-foreground/90 font-sans">
                  {tr.description || `Test Case #${i + 1}`}
                </span>
              </div>
              <span className="text-[11px] opacity-80">
                {tr.passed
                  ? 'Passed'
                  : tr.error
                    ? 'Runtime Error'
                    : 'Failed assertion'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reference Solution */}
      {review.referenceCode && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
            <Sparkles className="size-3.5" /> Instructor Reference Solution:
          </p>
          <pre className="rounded-lg bg-neutral-950/80 p-3 text-neutral-200 font-mono text-xs overflow-x-auto border border-primary/20">
            <code>{review.referenceCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
