// ==========================================
// 1. API Response Types (Matches your JSON)
// ==========================================

export interface ApiCategory {
  id: number;
  name: string;
}

export interface ApiLesson {
  id: number;
  course: number;
  title: string;
  content: string;      // Your HTML content "<p>Hello</p>"
  video_url?: string;
  pdf_version?:string;
  resources?: string;
  order?: number;
}

export interface ApiQuiz {
  id: number;
  title: string;
  description: string;
  prerequisite_lesson: number | null; // Can be null based on your JSON
}

export interface ApiCourse {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  price: string;
  is_paid: boolean;
  created_at: string;
  categories: ApiCategory[];
  instructors: number[];
  lessons: ApiLesson[];    // Separate Array
  quizzes: ApiQuiz[];      // Separate Array
}

// ==========================================
// 2. UI Component Types (What the Player uses)
// ==========================================

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

// This is the Type your State should use
export interface UIState {
  courseId: number;
  title: string;
  progress: number;
  curriculum: ContentItem[]; // Merged list
}

// 1. Basic Building Blocks
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

// 2. Helper for the nested Lesson object
export interface LessonSummary {
    id: number;
    title: string;
}

// 3. The Main Quiz Interface (GET /api/quiz/:id/)
export interface Quiz {
    id: number;
    title: string;
    description: string;
    course: number; // Course ID
    lesson: LessonSummary | null; // Can be null if not linked to a specific module
    prerequisite_lesson: number | null; // ID of the prerequisite
    prerequisite_lesson_title?: string;
    time_limit: number; // in minutes
    questions: Question[];
}

// 4. Submission Payload (POST /api/submissions/)
// This is what the Frontend sends to the Backend
export interface SubmissionPayload {
    quiz: number;
    answers: StudentAnswerSubmission[];
}

export interface StudentAnswerSubmission {
    question: number; // Question ID
    selected_option: number | null; // Option ID (null for short answer)
    text_answer: string; // Empty string if MCQ
}

// 5. Submission Result (Response from POST)
// This is what the Backend sends back after grading
export interface SubmissionResult {
    id: number;
    quiz: number;
    student: number;
    score: number;
    submitted_at: string; // ISO Date string
    answers: StudentAnswerResult[]; // Includes correctness info
}

export interface StudentAnswerResult {
    id: number;
    question: number;
    selected_option: number | null;
    text_answer: string;
    is_correct: boolean;
}
export interface AnswerEntry {
    selected_option: number | null; // The ID of the option selected (for MCQ/TF)
    text_answer: string | null;     // The typed text (for Short Answer)
}
export interface QuizAnswerState {
    [questionId: number]: AnswerEntry;
}