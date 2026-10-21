export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  avatar: string;
  daily_goal_minutes: number;
  pomodoro_focus_min: number;
  pomodoro_break_min: number;
  theme_preference: 'dark' | 'light';
  created_at: string;
}

export interface Subject {
  id: number;
  user_id: number;
  name: string;
  code: string;
  description: string;
  color: string;
  icon: string;
  target_hours: number;
  topics_count: number;
  mastery_average: number;
  created_at: string;
}

export interface Topic {
  id: number;
  user_id: number;
  subject_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence_level: number;
  mastery_score: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  created_at: string;
  updated_at: string;
}

export interface StudyTask {
  id: number;
  user_id: number;
  subject_id?: number | null;
  topic_id?: number | null;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_minutes: number;
  actual_minutes: number;
  due_date?: string | null;
  scheduled_date?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  recommendation_reason: string;
  created_at: string;
  completed_at?: string | null;
  subject_name?: string | null;
  subject_color?: string | null;
}

export interface FocusSession {
  id: number;
  duration_seconds: number;
  duration_minutes: number;
  focus_mode: string;
  subject_name: string;
  subject_color: string;
  notes: string;
  ended_at: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer';
  options: string[];
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: number;
  user_id: number;
  subject_id?: number | null;
  topic_id?: number | null;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  created_at: string;
  question_count: number;
  subject_name?: string | null;
  latest_score?: number | null;
  questions?: QuizQuestion[];
}

export interface QuizQuestionResult {
  question_id: number;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  results: QuizQuestionResult[];
  weak_topics: string[];
}

export interface FlashcardDeck {
  id: number;
  user_id: number;
  subject_id?: number | null;
  topic_id?: number | null;
  title: string;
  description: string;
  color: string;
  created_at: string;
  total_cards: number;
  due_cards: number;
  new_cards: number;
}

export interface Flashcard {
  id: number;
  deck_id: number;
  user_id: number;
  front: string;
  back: string;
  hint?: string;
  repetition: number;
  interval_days: number;
  ease_factor: number;
  due_date: string;
  last_reviewed_at?: string | null;
}

export interface Note {
  id: number;
  user_id: number;
  subject_id?: number | null;
  topic_id?: number | null;
  title: string;
  content: string;
  summary?: string;
  tags?: string;
  is_pinned: boolean;
  source_filename?: string;
  created_at: string;
  updated_at: string;
  subject_name?: string;
}

export interface Exam {
  id: number;
  user_id: number;
  subject_id?: number | null;
  title: string;
  exam_date: string;
  target_score: number;
  location?: string;
  notes?: string;
  weight_percentage: number;
  is_completed: boolean;
  days_remaining: number;
  subject_name?: string;
  subject_color?: string;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string | null;
  is_completed: boolean;
  progress_percentage: number;
}

export interface WeeklyFocusDay {
  day: string;
  date: string;
  minutes: number;
}

export interface SubjectMasteryStat {
  id: number;
  name: string;
  color: string;
  mastery_percentage: number;
  topics_count: number;
  study_minutes: number;
}

export interface WeakTopicStat {
  topic_id: number;
  topic_title: string;
  subject_name: string;
  confidence_level: number;
  mastery_score: number;
  recommendation: string;
}

export interface RecommendationItem {
  type: 'task' | 'flashcard' | 'quiz' | 'exam_prep';
  title: string;
  reason: string;
  priority: string;
  action_url: string;
}

export interface DashboardSummary {
  user_name: string;
  today_focus_minutes: number;
  daily_goal_minutes: number;
  active_streak_days: number;
  total_study_hours: number;
  pending_tasks_count: number;
  due_flashcards_count: number;
  upcoming_exams_count: number;
  mastery_average: number;
  weekly_focus: WeeklyFocusDay[];
  subject_mastery: SubjectMasteryStat[];
  weak_topics: WeakTopicStat[];
  recommendations: RecommendationItem[];
  has_activity: boolean;
}
