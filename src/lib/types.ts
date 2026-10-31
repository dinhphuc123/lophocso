export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay";

export interface QuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  type: "multiple_choice";
  text: string;
  options: QuestionOption[];
  correctAnswer: "A" | "B" | "C" | "D";
  /** true when the source file gave no underline / answer key, so correctAnswer is only a placeholder */
  answerUnknown?: boolean;
  explanation?: string;
  level?: "NB" | "TH" | "VD" | "VDC" | string;
  imageUrl?: string;
  points?: number;
}

export interface TrueFalseSubQuestion {
  id: "a" | "b" | "c" | "d";
  text: string;
  level?: "NB" | "TH" | "VD" | "VDC" | string;
  isCorrect: boolean; // true = Đúng, false = Sai
}

export interface TrueFalseQuestion {
  id: string;
  type: "true_false";
  text: string;
  subQuestions: TrueFalseSubQuestion[];
  explanation?: string;
  level?: "NB" | "TH" | "VD" | "VDC" | string;
  imageUrl?: string;
  points?: number;
}

export interface ShortAnswerQuestion {
  id: string;
  type: "short_answer";
  text: string;
  correctAnswers: string[];
  explanation?: string;
  level?: "NB" | "TH" | "VD" | "VDC" | string;
  imageUrl?: string;
  points?: number;
}

export interface EssayQuestion {
  id: string;
  type: "essay";
  text: string;
  explanation?: string;
  level?: "NB" | "TH" | "VD" | "VDC" | string;
  imageUrl?: string;
  points?: number;
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion | EssayQuestion;

// What a student / game player may see: never the answer key or the solution.
type Common = "id" | "text" | "level" | "imageUrl" | "points";
export type PublicQuestion =
  | (Pick<MultipleChoiceQuestion, Common | "type" | "options">)
  | (Pick<TrueFalseQuestion, Common | "type"> & { subQuestions: Omit<TrueFalseSubQuestion, "isCorrect">[] })
  | Pick<ShortAnswerQuestion, Common | "type">
  | Pick<EssayQuestion, Common | "type">;

export interface Exam {
  id: string;
  code?: string;
  title: string;
  subject: string;
  targetClass: string;
  durationMinutes: number;
  deadline?: string;
  status: "open" | "grading" | "draft" | "closed";
  createdAt: string;
  questions: Question[];
}

export type PublicExam = Omit<Exam, "questions"> & { questions: PublicQuestion[] };

/** One student's started attempt; the server owns startedAt so the timer cannot be spoofed. */
export interface Attempt {
  examId: string;
  key: string; // normalized name|class
  studentName: string;
  studentClass: string;
  startedAt: string;
  lastActiveAt?: string;
  answeredCount?: number;
  totalQuestions?: number;
  submitted: boolean;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade?: string;
  students: string[];
}

export interface StudentSubmission {
  id: string;
  examId: string;
  studentName: string;
  studentClass: string;
  startedAt: string;
  submittedAt: string;
  score: number; // Thang 10
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: Record<string, unknown>;
  details: {
    questionId: string;
    isCorrect: boolean;
    earnedPoints: number;
    maxPoints: number;
    userAnswer: unknown;
    correctAnswer: unknown;
    explanation?: string;
    /** essay answers wait for the teacher to enter points */
    needsManualGrade?: boolean;
    teacherFeedback?: string;
  }[];
}

export interface DashboardStats {
  weeklySubmissionsCount: number;
  weeklyChangePercent: number;
  averageScore: number;
  highScorePercent: number; // >= 8
  lowScorePercent: number; // < 5
  activeStudentsNow: number;
  pendingGradingCount: number;
  expiringExamsCount: number;
  draftExamsCount: number;
  dailySubmissions: { day: string; count: number; height: string }[];
  difficultQuestions: {
    examTitle: string;
    questionNo: string;
    topic: string;
    wrongRate: string;
    totalAnswers: number;
  }[];
  liveSessions?: {
    name: string;
    class: string;
    exam: string;
    progress: string;
    time: string;
    status: "active" | "submitted" | "warning";
  }[];
}
