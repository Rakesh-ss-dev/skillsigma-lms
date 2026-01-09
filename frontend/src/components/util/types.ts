export interface ApiCategory {
  id: number;
  name: string;
}

export interface ApiLesson {
  id: number;
  course: number;
  title: string;
  content: string;
  video_url?: string;
  pdf_version?:string;
  resources?: string;
  is_completed:boolean;
  order?: number;
}

export interface ApiQuiz {
  id: number;
  title: string;
  description: string;
  is_completed:boolean;
  prerequisite_lesson: number | null;
}

export interface ApiCourse {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  progress:number;
  price: string;
  is_paid: boolean;
  created_at: string;
  categories: ApiCategory[];
  instructors: number[];
  lessons: ApiLesson[];    
  quizzes: ApiQuiz[]; 
}

export interface ContentItem {
  id: number;
  type: 'lesson' | 'quiz';
  title: string;
  completed: boolean;
  locked: boolean;
  pdf_version?:string;
  // Lesson specific
  video_url?: string;
  content?: string; // HTML content
  resources?: string;
  // Quiz specific
  quizId?: number; 
  description?: string;

  // Internal sorting helpers
  _order?: number;
  _prereq?: number | null;
}

export interface UIState {
  courseId: number;
  title: string;
  progress: number;
  curriculum: ContentItem[];
}


export interface Option {
    id: number;
    text: string;
    is_correct?: boolean; // Optional because typically hidden from students during the quiz
}

export type QuestionType = 'mcq' | 'tf' | 'short';

export interface Question {
    id: number;
    text: string;
    question_type: QuestionType;
    points: number;
    short_answer?: string | null; // Nullable in JSON
    options: Option[];
}

export interface LessonSummary {
    id: number;
    title: string;
}

export interface Quiz {
    id: number;
    title: string;
    description: string;
    course: number; 
    lesson: LessonSummary | null;
    prerequisite_lesson: number | null;
    prerequisite_lesson_title?: string;
    time_limit: number;
    is_completed:boolean;
    questions: Question[];
}

export interface SubmissionPayload {
    quiz: number;
    answers: StudentAnswerSubmission[];
}

export interface StudentAnswerSubmission {
    question: number;
    selected_option: number | null;
    text_answer: string;
}

export interface SubmissionResult {
    id: number;
    quiz: number;
    student: number;
    score: number;
    submitted_at: string;
    answers: StudentAnswerResult[];
}

export interface StudentAnswerResult {
    id: number;
    question: number;
    selected_option: number | null;
    text_answer: string;
    is_correct: boolean;
}
export interface AnswerEntry {
    selected_option: number | null;
    text_answer: string | null;
}
export interface QuizAnswerState {
    [questionId: number]: AnswerEntry;
}