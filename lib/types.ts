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
  score: number;
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

export interface DashboardStats {
  totalUsers: number;
  activeExams: number;
  completedThisMonth: number;
  recentSessions: RecentExamSession[];
}

export interface Department {
  id: number;
  name: string;
  createdAt: string;
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

export interface Category {
  id: number;
  name: string;
  description: string | null;
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
  isActive: boolean;
  options: QuestionOption[] | null;
}

export interface ExamTopicConfig {
  topicId: number;
  topicName: string;
  questionCount: number;
}

export interface Exam {
  id: number;
  title: string;
  type: string;
  passMark: number | null;
  durationMinutes: number | null;
  topicConfigs: ExamTopicConfig[] | null;
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
}

export interface TokenAssignment {
  examTitle: string;
  examDescription: string | null;
  candidateName: string;
  durationMinutes: number | null;
  startDate: string | null;
  endDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  sessionId: number | null;
}
