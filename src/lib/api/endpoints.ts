import { api } from './client';
import type {
  AdminCourseListItem,
  AdminCourseTree,
  AdminQuiz,
  AdminStats,
  AdminStudentRow,
  AdminUserRow,
  AttemptResult,
  AttemptSummary,
  AuthProviders,
  AuthResponse,
  Category,
  Certificate,
  CourseCard,
  CourseDetail,
  EnrollmentListItem,
  Lesson,
  Paginated,
  PlayerPayload,
  ProgressUpdate,
  PublishReadiness,
  QuestionType,
  StudentQuiz,
  User,
  UserGamificationProfile,
  XpTransaction,
} from '@/lib/types/api';

// ---------- auth ----------

export const authApi = {
  /** Which social buttons this server can actually honour. */
  providers: () =>
    api.get<AuthProviders>('/auth/providers').then((r) => r.data),

  /**
   * Trade the single-use code from the OAuth redirect for a real session.
   * The code is burned server-side on first use.
   */
  exchangeOAuthCode: (code: string) =>
    api
      .post<AuthResponse>('/auth/oauth/exchange', { code })
      .then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
};

// ---------- catalog ----------

export interface CatalogQuery {
  q?: string;
  difficulty?: string;
  category?: string;
  sort?: 'newest' | 'title' | 'popular';
  page?: number;
  limit?: number;
}

export const catalogApi = {
  list: (params: CatalogQuery) =>
    api.get<Paginated<CourseCard>>('/courses', { params }).then((r) => r.data),

  detail: (idOrSlug: string) =>
    api.get<CourseDetail>(`/courses/${idOrSlug}`).then((r) => r.data),

  categories: () => api.get<Category[]>('/categories').then((r) => r.data),
};

// ---------- learning ----------

export const enrollmentsApi = {
  enroll: (courseId: string) =>
    api.post(`/courses/${courseId}/enroll`).then((r) => r.data),

  unenroll: (courseId: string) =>
    api.delete(`/courses/${courseId}/enroll`).then((r) => r.data),

  mine: (params: { status?: string; page?: number; limit?: number } = {}) =>
    api
      .get<Paginated<EnrollmentListItem>>('/me/enrollments', { params })
      .then((r) => r.data),

  player: (courseId: string) =>
    api.get<PlayerPayload>(`/me/enrollments/${courseId}`).then((r) => r.data),
};

export const lessonsApi = {
  read: (lessonId: string) =>
    api.get<Lesson>(`/lessons/${lessonId}`).then((r) => r.data),

  complete: (lessonId: string) =>
    api
      .post<ProgressUpdate>(`/lessons/${lessonId}/complete`)
      .then((r) => r.data),

  uncomplete: (lessonId: string) =>
    api
      .delete<ProgressUpdate>(`/lessons/${lessonId}/complete`)
      .then((r) => r.data),
};

export const quizzesApi = {
  get: (quizId: string) =>
    api.get<StudentQuiz>(`/quizzes/${quizId}`).then((r) => r.data),

  submit: (
    quizId: string,
    answers: { questionId: string; choiceIds?: string[]; response?: unknown }[],
  ) =>
    api
      .post<AttemptResult>(`/quizzes/${quizId}/attempts`, { answers })
      .then((r) => r.data),

  attempts: (quizId: string) =>
    api
      .get<AttemptSummary[]>(`/quizzes/${quizId}/attempts`)
      .then((r) => r.data),
};

// ---------- admin ----------

export interface AdminCourseQuery {
  q?: string;
  status?: string;
  difficulty?: string;
  categoryId?: string;
  mine?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CoursePayload {
  title?: string;
  description?: string;
  difficulty?: string;
  slug?: string;
  categoryId?: string;
  coverUrl?: string;
}

export const adminCoursesApi = {
  list: (params: AdminCourseQuery) =>
    api
      .get<Paginated<AdminCourseListItem>>('/admin/courses', { params })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<AdminCourseTree>(`/admin/courses/${id}`).then((r) => r.data),

  create: (data: CoursePayload) =>
    api.post<AdminCourseTree>('/admin/courses', data).then((r) => r.data),

  update: (id: string, data: CoursePayload) =>
    api
      .patch<AdminCourseTree>(`/admin/courses/${id}`, data)
      .then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/admin/courses/${id}`).then((r) => r.data),

  readiness: (id: string) =>
    api
      .get<PublishReadiness>(`/admin/courses/${id}/publish-readiness`)
      .then((r) => r.data),

  setStatus: (id: string, status: string) =>
    api
      .patch<AdminCourseListItem>(`/admin/courses/${id}/status`, { status })
      .then((r) => r.data),

  students: (id: string, params: { page?: number; limit?: number } = {}) =>
    api
      .get<Paginated<AdminStudentRow>>(`/admin/courses/${id}/students`, {
        params,
      })
      .then((r) => r.data),
};

export const adminCurriculumApi = {
  createModule: (courseId: string, title: string) =>
    api
      .post(`/admin/courses/${courseId}/modules`, { title })
      .then((r) => r.data),

  updateModule: (id: string, title: string) =>
    api.patch(`/admin/modules/${id}`, { title }).then((r) => r.data),

  deleteModule: (id: string) =>
    api.delete(`/admin/modules/${id}`).then((r) => r.data),

  reorderModules: (courseId: string, orderedIds: string[]) =>
    api
      .patch(`/admin/courses/${courseId}/modules/reorder`, { orderedIds })
      .then((r) => r.data),

  createLesson: (
    moduleId: string,
    data: {
      title: string;
      contentType: string;
      content: string;
      durationMin?: number;
    },
  ) => api.post(`/admin/modules/${moduleId}/lessons`, data).then((r) => r.data),

  updateLesson: (
    id: string,
    data: Partial<{
      title: string;
      contentType: string;
      content: string;
      durationMin: number | null;
    }>,
  ) => api.patch(`/admin/lessons/${id}`, data).then((r) => r.data),

  deleteLesson: (id: string) =>
    api.delete(`/admin/lessons/${id}`).then((r) => r.data),

  reorderLessons: (moduleId: string, orderedIds: string[]) =>
    api
      .patch(`/admin/modules/${moduleId}/lessons/reorder`, { orderedIds })
      .then((r) => r.data),
};

export interface QuestionPayload {
  type?: QuestionType;
  text: string;
  multiple?: boolean;
  content?: unknown;
  solution?: unknown;
  choices?: { text: string; isCorrect: boolean }[];
}

export const adminQuizzesApi = {
  createForModule: (
    moduleId: string,
    data: { passScore?: number; questions?: QuestionPayload[] } = {},
  ) =>
    api
      .post<AdminQuiz>(`/admin/modules/${moduleId}/quiz`, data)
      .then((r) => r.data),

  createFinal: (
    courseId: string,
    data: { passScore?: number; questions?: QuestionPayload[] } = {},
  ) =>
    api
      .post<AdminQuiz>(`/admin/courses/${courseId}/final-quiz`, data)
      .then((r) => r.data),

  get: (id: string) =>
    api.get<AdminQuiz>(`/admin/quizzes/${id}`).then((r) => r.data),

  update: (id: string, data: { passScore: number }) =>
    api.patch<AdminQuiz>(`/admin/quizzes/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/admin/quizzes/${id}`).then((r) => r.data),

  addQuestion: (quizId: string, data: QuestionPayload) =>
    api
      .post<AdminQuiz>(`/admin/quizzes/${quizId}/questions`, data)
      .then((r) => r.data),

  updateQuestion: (id: string, data: Partial<QuestionPayload>) =>
    api.patch<AdminQuiz>(`/admin/questions/${id}`, data).then((r) => r.data),

  deleteQuestion: (id: string) =>
    api.delete<AdminQuiz>(`/admin/questions/${id}`).then((r) => r.data),

  reorderQuestions: (quizId: string, orderedIds: string[]) =>
    api
      .patch<AdminQuiz>(`/admin/quizzes/${quizId}/questions/reorder`, {
        orderedIds,
      })
      .then((r) => r.data),
};

export const categoriesApi = {
  create: (data: { name: string; slug?: string }) =>
    api.post<Category>('/categories', data).then((r) => r.data),
};

export const profileApi = {
  update: (data: { name?: string; bio?: string; avatarUrl?: string }) =>
    api.patch<User>('/auth/me', data).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api
      .patch<{ changed: boolean }>('/auth/me/password', data)
      .then((r) => r.data),

  certificate: (courseId: string) =>
    api
      .get<Certificate>(`/me/enrollments/${courseId}/certificate`)
      .then((r) => r.data),
};

export const adminStatsApi = {
  overview: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
};

export const adminUsersApi = {
  list: (params: {
    q?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<Paginated<AdminUserRow>>('/admin/users', { params })
      .then((r) => r.data),

  setRole: (id: string, role: string) =>
    api
      .patch<AdminUserRow>(`/admin/users/${id}/role`, { role })
      .then((r) => r.data),

  remove: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};

export interface UploadResult {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export const uploadsApi = {
  image: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    // Content-Type is left unset on purpose: the browser must add the
    // multipart boundary itself.
    return api.post<UploadResult>('/uploads/image', body).then((r) => r.data);
  },
};

// ---------- gamification ----------

export const gamificationApi = {
  me: () =>
    api.get<UserGamificationProfile>('/gamification/me').then((r) => r.data),
  history: (limit = 20) =>
    api
      .get<XpTransaction[]>('/gamification/me/history', { params: { limit } })
      .then((r) => r.data),
};
