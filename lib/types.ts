export interface MyAssignment {
  assignmentId: number;
  examId: number;
  examTitle: string;
  examType: string;
  durationMinutes: number | null;
  startDate: string | null;
  endDate: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  sessionId: number | null;
  score: number | null;
  passed: boolean | null;
}

export interface SessionQuestionOption {
  id: number;
  text: string;
  sortOrder: number;
}

export interface SessionQuestion {
  id: number;
  type: string;
  text: string;
  score: number;
  options: SessionQuestionOption[] | null;
}

export interface SessionStart {
  sessionId: number;
  assignmentId: number;
  examTitle: string;
  durationMinutes: number | null;
  startTime: string;
  questions: SessionQuestion[];
}

export interface SessionAnswerResult {
  questionId: number;
  questionText: string;
  type: string;
  selectedOptionId: number | null;
  selectedOptionText: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  score: number;                  // max points for the question
  awardedScore: number | null;    // points earned (null while pending grading)
  needsGrading: boolean;          // open-ended answer awaiting manual grading
}

export interface SessionResult {
  sessionId: number;
  examTitle: string;
  status: string;
  score: number;
  passed: boolean | null;
  passMark: number | null;
  startTime: string;
  endTime: string;
  answers: SessionAnswerResult[];
  pendingGrading: number;
  earnedScore: number | null;
  maxScore: number | null;
  resultHidden?: boolean;
  terminationReason?: string | null; // "PROCTORING" → auto-terminated by anti-cheat; null = normal submit
}

export interface JwtResponse {
  token: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface RecentExamSession {
  sessionId: number;
  userName: string;
  examTitle: string;
  score: number | null;
  passed: boolean | null;
  completedAt: string;
}

export interface DashboardAttentionSession {
  sessionId: number;
  userName: string;
  examId: number;
  examTitle: string;
  count: number;
}

export interface DashboardDayActivity {
  label: string;
  count: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalExams: number;
  activeExams: number;
  completedThisMonth: number;
  completedTotal: number;
  avgScore: number | null;
  passRate: number | null;
  pendingGradingCount: number;
  flaggedCount: number;
  recentSessions: RecentExamSession[];
  pendingGrading: DashboardAttentionSession[];
  flaggedSessions: DashboardAttentionSession[];
  weeklyActivity: DashboardDayActivity[];
}

export interface Department {
  id: number;
  name: string;
  createdAt: string;
  memberCount: number;
}

export interface DepartmentMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roles: string[];
  completedExams: number;
  avgScore: number | null;
  lastActivity: string | null;
}

export interface DepartmentDetail {
  id: number;
  name: string;
  createdAt: string;
  memberCount: number;
  examsCompleted: number;
  avgScore: number | null;
  passRate: number | null;
  members: DepartmentMember[];
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  departmentName: string | null;
  departmentId?: number | null;
  status: string;
  roles: { id: number; name: string }[];
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface Category {
  id: number;
  departmentId: number;
  departmentName: string | null;
  name: string;
  description: string | null;
  topicCount?: number;
  questionCount?: number;
}

export interface Topic {
  id: number;
  categoryId: number;
  name: string;
}

export interface QuestionOption {
  id: number;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface Question {
  id: number;
  topicId: number;
  type: string;
  text: string;
  score: number;
  difficulty: Difficulty;
  isActive: boolean;
  options: QuestionOption[] | null;
}

export interface ExamTopicConfig {
  topicId: number;
  topicName: string;
  questionCount: number;
}

export interface ExamQuestionItem {
  questionId: number;
  type: string;
  text: string;
  score: number;
  difficulty: Difficulty | null;
  fromBank: boolean;
  options: QuestionOption[] | null;
}

export interface ExamStats {
  assigned: number;
  completed: number;
  inProgress: number;
  avgScore: number | null;
  passRate: number | null;
}

export interface Exam {
  id: number;
  title: string;
  description: string | null;
  type: string;
  passMark: number | null;
  durationMinutes: number | null;
  questionCount: number | null;
  stats: ExamStats | null;
  topicConfigs: ExamTopicConfig[] | null;
  questions: ExamQuestionItem[] | null;
}

export interface ExamResultSession {
  sessionId: number;
  userName: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  startTime: string | null;
  endTime: string | null;
  pendingGrading: number;
  violationCount: number;
}

export interface Violation {
  type: string;
  label: string | null;
  severity: "WARNING" | "CRITICAL" | "LOGGED" | string;
  occurredAt: string;
}

export interface ExamResultPendingLink {
  assignmentId: number;
  candidateName: string | null;
  accessToken: string;
  endDate: string | null;
  recipientEmail: string | null;
}

export interface ExamResults {
  examTitle: string;
  sessions: ExamResultSession[];
  pendingLinks: ExamResultPendingLink[];
}

export interface AnalyticsScoreBucket {
  label: string;
  count: number;
}

export interface AnalyticsQuestionStat {
  questionId: number;
  text: string;
  type: string;
  difficulty: string | null;
  correct: number;
  wrong: number;
  pending: number;
  total: number;
  successRate: number | null;
}

export interface AnalyticsDifficultyStat {
  difficulty: string;
  questionCount: number;
  correct: number;
  wrong: number;
  successRate: number | null;
}

export interface AnalyticsDepartmentStat {
  departmentName: string;
  participants: number;
  avgScore: number | null;
}

export interface ExamAnalytics {
  examTitle: string;
  completedCount: number;
  avgScore: number | null;
  passRate: number | null;
  passMark: number | null;
  scoreDistribution: AnalyticsScoreBucket[];
  questionStats: AnalyticsQuestionStat[];
  difficultyStats: AnalyticsDifficultyStat[];
  departmentStats: AnalyticsDepartmentStat[];
}

export interface AnalyticsQuestionInsight {
  questionId: number;
  text: string;
  type: string;
  difficulty: string | null;
  correct: number;
  wrong: number;
  total: number;
  successRate: number | null;
}

export interface AnalyticsViolationStat {
  type: string;
  label: string | null;
  count: number;
}

export interface AnalyticsInsights {
  hardestQuestions: AnalyticsQuestionInsight[];
  mostMissed: AnalyticsQuestionInsight[];
  violationStats: AnalyticsViolationStat[];
  totalViolations: number;
  flaggedSessions: number;
}

export interface ExamReport {
  sessionId: number;
  userId: number;
  userName: string;
  userEmail: string;
  departmentName: string | null;
  examId: number;
  examTitle: string;
  examType: string;
  score: number | null;
  passed: boolean | null;
  startTime: string;
  endTime: string;
}

export interface ExamAssignmentResult {
  assignmentId: number;
  accessToken: string | null;
  candidateName: string | null;
  examTitle: string;
  recipientEmail: string | null;
  emailSent: boolean | null;
}

export interface BulkAssignment {
  created: number;
  skipped: number;
}

export interface BulkImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

export interface AppSettings {
  orgName: string;
  supportEmail: string;
  defaultPassMark: number;
  defaultDurationMinutes: number;
  defaultLinkValidityDays: number;
  proctoringEnabled: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultToCandidate: boolean;
  tabSwitchLimit: number;
}

export interface PublicSettings {
  orgName: string;
  supportEmail: string;
  proctoringEnabled: boolean;
  tabSwitchLimit: number;
}

export interface ProgressTrendPoint {
  examTitle: string;
  score: number | null;
  passed: boolean | null;
  date: string | null;
}

export interface ProgressCategory {
  name: string;
  correct: number;
  graded: number;
  successRate: number | null;
}

export interface ProgressData {
  completed: number;
  avgScore: number | null;
  bestScore: number | null;
  passed: number;
  departmentAvg: number | null;
  departmentName: string | null;
  trend: ProgressTrendPoint[];
  categories: ProgressCategory[];
}

export interface EmployeeNotificationItem {
  examId: number;
  sessionId: number | null;
  assignmentId: number;
  examTitle: string;
  type: "ASSIGNED" | "DEADLINE" | "RESULT";
  score: number | null;
  passed: boolean | null;
  deadline: string | null;
  time: string | null;
  unread: boolean;
}

export interface EmployeeNotificationFeed {
  unreadCount: number;
  items: EmployeeNotificationItem[];
}

export interface NotificationItem {
  sessionId: number;
  examId: number;
  examTitle: string;
  userName: string;
  score: number | null;
  passed: boolean | null;
  pendingGrading: number;
  violations: number;
  type: "GRADING" | "VIOLATION" | "RESULT";
  time: string | null;
  unread: boolean;
}

export interface NotificationFeed {
  unreadCount: number;
  items: NotificationItem[];
}

export interface AccountStats {
  assigned: number;
  completed: number;
  pending: number;
  avgScore: number | null;
  passed: number;
  bestScore: number | null;
}

export interface AccountProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  departmentName: string | null;
  roles: string[];
  memberSince: string;
  stats: AccountStats;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditLog {
  id: number;
  userName: string | null;
  userRole: string | null;
  module: string | null;
  action: string | null;
  httpMethod: string | null;
  path: string | null;
  statusCode: number | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface TokenAssignment {
  examTitle: string;
  examDescription: string | null;
  candidateName: string | null;
  durationMinutes: number | null;
  startDate: string | null;
  endDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  sessionId: number | null;
}
