/**
 * Client-side mirror of the backend's `checkQuestion`
 * (`src/common/validation/question-rules.ts`).
 *
 * Duplicated on purpose: the API stays the authority and will reject a bad
 * question regardless, but an author should not have to submit to find out
 * their answer key is inconsistent. Keep the two in step.
 */
export function checkQuestion(question: {
  type?: string;
  multiple: boolean;
  choices: { text: string; isCorrect: boolean }[];
  content?: any;
  solution?: any;
}): string | null {
  const { type = 'CHOICE', choices, multiple } = question;

  if (type === 'FLOW_ORDER') {
    const items = question.content?.items;
    const correctSeq = question.solution?.correctSequence;
    if (!Array.isArray(items) || items.length < 2) {
      return 'Needs at least 2 sequence steps';
    }
    if (!Array.isArray(correctSeq) || correctSeq.length !== items.length) {
      return 'All sequence steps must be ordered in the solution';
    }
    return null;
  }

  if (type === 'CODE_RUNNER') {
    const testCases = question.content?.testCases;
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return 'Needs at least one test case';
    }
    return null;
  }

  const filled = choices.filter((c) => c.text.trim().length > 0);
  const correct = filled.filter((c) => c.isCorrect).length;

  if (filled.length < 2) return 'Needs at least 2 choices';
  if (correct === 0) return 'Mark at least one choice correct';
  if (correct === filled.length) return 'Not every choice can be correct';
  if (!multiple && correct !== 1)
    return `Single-answer, but ${correct} choices are marked correct`;
  if (multiple && correct < 2)
    return 'Multi-answer needs at least 2 correct choices';

  return null;
}
