/**
 * Mirrors the NestJS API contract. Kept hand-written for now; once the backend
 * Swagger doc is stable, `openapi-typescript` can generate this file instead
 * (plan §7.1 item 6).
 */

export type Role = 'ADMIN' | 'STUDENT';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ContentType = 'TEXT' | 'VIDEO' | 'FILE';
export type QuizType = 'MODULE' | 'FINAL';
export type QuestionType = 'CHOICE' | 'FLOW_ORDER' | 'CODE_RUNNER';
export type EnrollmentStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** Every list endpoint returns this envelope (plan §7.1). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  children?: { id: string; name: string; slug: string; icon?: string | null }[];
  publishedCourses?: number;
}

export interface CoursePrerequisite {
  id: string;
  minGlobalLevel: number | null;
  minCategoryLevel: number | null;
  categoryId: string | null;
  category: { id: string; name: string; slug?: string } | null;
  prerequisiteCourseId: string | null;
  prerequisiteCourse?: { id: string; title: string; slug: string } | null;
}

export interface CourseCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  coverUrl: string | null;
  publishedAt: string | null;
  admin: { id: string; name: string; avatarUrl?: string | null };
  category: Category | null;
  prerequisites?: CoursePrerequisite[];
  lessonCount: number;
  moduleCount: number;
  totalDurationMin: number;
  enrollmentCount: number;
  /** undefined for anonymous visitors — "not signed in" is not "not enrolled". */
  enrolled?: boolean;
}

export interface OutlineLesson {
  id: string;
  title: string;
  position: number;
  contentType: ContentType;
  durationMin: number | null;
}

export interface OutlineModule {
  id: string;
  title: string;
  position: number;
  lessons: OutlineLesson[];
  lessonCount: number;
  durationMin: number;
  quiz: { id: string; passScore: number; questionCount: number } | null;
}

export interface MyEnrollmentSummary {
  id: string;
  status: EnrollmentStatus;
  progressPct: number;
  enrolledAt: string;
  completedAt: string | null;
  lastLessonId: string | null;
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  status: CourseStatus;
  coverUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };
  category: Category | null;
  prerequisites?: CoursePrerequisite[];
  modules: OutlineModule[];
  finalQuiz: { id: string; passScore: number; questionCount: number } | null;
  moduleCount: number;
  lessonCount: number;
  totalDurationMin: number;
  enrollmentCount: number;
  myEnrollment: MyEnrollmentSummary | null;
}

// ---------- gamification ----------

export interface LevelProgress {
  level: number;
  currentXp: number;
  currentLevelBaseXp: number;
  nextLevelXp: number;
  progressPct: number;
  xpToNextLevel: number;
}

export interface CategorySkillState {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  parentId: string | null;
  parentName: string | null;
  icon: string | null;
  sp: number;
  level: number;
  currentLevelBaseSp: number;
  nextLevelSp: number;
  progressPct: number;
}

export interface UserGamificationProfile {
  userId: string;
  totalXp: number;
  level: LevelProgress;
  skills: CategorySkillState[];
}

export interface XpTransaction {
  id: string;
  amount: number;
  reason: 'LESSON_COMPLETED' | 'QUIZ_PASSED' | 'PERFECT_SCORE' | 'STREAK_BONUS';
  sourceId: string | null;
  categoryId: string | null;
  createdAt: string;
}

export interface XpAwardResult {
  awardedXp: number;
  totalXp: number;
  levelUp: boolean;
  newLevel: number;
  categorySkillsUpdated: {
    categoryId: string;
    categoryName: string;
    spEarned: number;
    totalSp: number;
    newLevel: number;
    levelUp: boolean;
  }[];
}

// ---------- learning ----------

export interface LessonProgressState {
  id: string;
  title: string;
  position: number;
  completed: boolean;
  completedAt: string | null;
  contentType?: ContentType;
  durationMin?: number | null;
}

export interface QuizProgressState {
  id: string;
  passScore: number;
  unlocked: boolean;
  passed: boolean;
  bestScore: number | null;
  attemptCount: number;
}

export interface ModuleProgressState {
  id: string;
  title: string;
  position: number;
  lessons: LessonProgressState[];
  quiz: QuizProgressState | null;
  completed: boolean;
  unlocked: boolean;
  completedLessons: number;
  totalLessons: number;
}

export type NextUp = {
  kind: 'lesson' | 'quiz' | 'finalQuiz';
  id: string;
} | null;

export interface ProgressSummary {
  units: number;
  done: number;
  progressPct: number;
  isComplete: boolean;
  allModulesCompleted?: boolean;
  nextUp: NextUp;
}

export interface PlayerPayload {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: Difficulty;
    status: CourseStatus;
    coverUrl: string | null;
    category: Category | null;
    admin: { id: string; name: string };
  };
  enrollment: MyEnrollmentSummary;
  progress: ProgressSummary;
  modules: ModuleProgressState[];
  finalQuiz: QuizProgressState | null;
}

export interface EnrollmentListItem extends MyEnrollmentSummary {
  course: PlayerPayload['course'];
}

export interface Lesson {
  id: string;
  title: string;
  position: number;
  contentType: ContentType;
  content: string;
  durationMin: number | null;
  moduleId: string;
  courseId: string;
  module: { id: string; title: string; position: number; courseId: string };
  completed: boolean;
  completedAt: string | null;
}

/** Returned by completing a lesson — a fresh snapshot for the sidebar. */
export interface ProgressUpdate {
  progress: ProgressSummary;
  modules: ModuleProgressState[];
  finalQuiz: QuizProgressState | null;
}

// ---------- quizzes ----------

export interface StudentChoice {
  id: string;
  text: string;
  position: number;
}

export interface FlowOrderItem {
  id: string;
  text: string;
}

export interface FlowOrderReview {
  submittedSequence: string[];
  correctSequence: string[];
  items: FlowOrderItem[];
  isCorrect: boolean;
}

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

export interface CodeRunnerReview {
  code: string;
  testResults: CodeTestCaseResult[];
  passedTestsCount: number;
  totalTestsCount: number;
  isCorrect: boolean;
  referenceCode?: string;
}

export interface StudentQuestion {
  id: string;
  type?: QuestionType;
  text: string;
  multiple: boolean;
  position: number;
  content?: {
    items?: FlowOrderItem[];
    language?: string;
    entryPoint?: string;
    starterCode?: string;
    testCases?: CodeTestCase[];
    [key: string]: unknown;
  } | null;
  choices: StudentChoice[];
}

export interface StudentQuiz {
  id: string;
  type: QuizType;
  passScore: number;
  courseId: string;
  questions: StudentQuestion[];
  passed: boolean;
  bestScore: number | null;
  attemptCount: number;
}

export interface QuestionResult {
  questionId: string;
  type?: QuestionType;
  text: string;
  multiple: boolean;
  position: number;
  selectedChoiceIds: string[];
  correctChoiceIds: string[];
  missedCorrectIds: string[];
  wronglySelectedIds: string[];
  isCorrect: boolean;
  flowOrderReview?: FlowOrderReview;
  codeRunnerReview?: CodeRunnerReview;
}

export interface AttemptResult extends ProgressUpdate {
  attemptId: string;
  attemptNumber: number;
  takenAt: string;
  score: number;
  passScore: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  questions: QuestionResult[];
}

export interface AttemptSummary {
  id: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  takenAt: string;
  answerRows: number;
}

// ---------- admin ----------

export interface AdminCourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  status: CourseStatus;
  coverUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  admin: { id: string; name: string };
  category: Category | null;
  _count: { modules: number; enrollments: number };
}

export interface AdminChoice {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

export interface AdminQuestion {
  id: string;
  type?: QuestionType;
  text: string;
  multiple: boolean;
  position: number;
  content?: {
    items?: FlowOrderItem[];
    language?: string;
    entryPoint?: string;
    starterCode?: string;
    testCases?: CodeTestCase[];
    [key: string]: unknown;
  } | null;
  solution?: {
    correctSequence?: string[];
    referenceCode?: string;
    [key: string]: unknown;
  } | null;
  choices: AdminChoice[];
}

export interface AdminQuiz {
  id: string;
  type: QuizType;
  passScore: number;
  moduleId?: string | null;
  courseId?: string | null;
  questions: AdminQuestion[];
  _count?: { attempts: number };
}

export interface AdminLesson {
  id: string;
  title: string;
  position: number;
  contentType: ContentType;
  content: string;
  durationMin: number | null;
}

export interface AdminModule {
  id: string;
  title: string;
  position: number;
  lessons: AdminLesson[];
  quiz: AdminQuiz | null;
}

export interface AdminCourseTree extends AdminCourseListItem {
  modules: AdminModule[];
  finalQuiz: AdminQuiz | null;
}

export interface PublishReadiness {
  ready: boolean;
  problems: string[];
}

export interface AdminStudentRow {
  id: string;
  status: EnrollmentStatus;
  progressPct: number;
  enrolledAt: string;
  completedAt: string | null;
  lastActivityAt: string | null;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

export interface Certificate {
  learnerName: string;
  courseTitle: string;
  courseSlug: string;
  difficulty: Difficulty;
  instructorName: string;
  completedAt: string;
  finalScore: number | null;
  verificationCode: string;
}

export interface AdminStats {
  users: { total: number; admins: number; students: number };
  courses: {
    total: number;
    draft: number;
    published: number;
    archived: number;
  };
  enrollments: {
    total: number;
    inProgress: number;
    completed: number;
    completionRate: number;
  };
  quizzes: {
    attempts: number;
    passed: number;
    passRate: number;
    averageScore: number;
  };
  signups: { day: string; count: number }[];
  topCourses: {
    id: string;
    title: string;
    slug: string;
    status: CourseStatus;
    enrollments: number;
    completions: number;
  }[];
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
  _count: { enrollments: number; coursesCreated: number };
}

/** Reported by GET /auth/providers — a provider is only live if configured. */
export interface AuthProviders {
  google: boolean;
  facebook: boolean;
}
