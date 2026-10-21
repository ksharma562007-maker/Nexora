from typing import List, Optional, Any, Dict
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- User & Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = "Google User"
    avatar: Optional[str] = None
    id_token: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    daily_goal_minutes: Optional[int] = None
    pomodoro_focus_min: Optional[int] = None
    pomodoro_break_min: Optional[int] = None
    theme_preference: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    avatar: str
    daily_goal_minutes: int
    pomodoro_focus_min: int
    pomodoro_break_min: int
    theme_preference: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Subject & Topic Schemas ---
class TopicBase(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    confidence_level: Optional[int] = 2
    mastery_score: Optional[float] = 0.0
    status: Optional[str] = "not_started"

class TopicCreate(TopicBase):
    subject_id: int

class TopicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    confidence_level: Optional[int] = None
    mastery_score: Optional[float] = None
    status: Optional[str] = None

class TopicOut(TopicBase):
    id: int
    user_id: int
    subject_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = ""
    description: Optional[str] = ""
    color: Optional[str] = "#6366F1"
    icon: Optional[str] = "BookOpen"
    target_hours: Optional[float] = 20.0

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    target_hours: Optional[float] = None

class SubjectOut(SubjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    topics_count: Optional[int] = 0
    mastery_average: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)

class SubjectDetailOut(SubjectOut):
    topics: List[TopicOut] = []

# --- Study Tasks & Planner Schemas ---
class StudyTaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    priority: Optional[str] = "medium"
    estimated_minutes: Optional[int] = 30
    due_date: Optional[datetime] = None
    scheduled_date: Optional[date] = None

class StudyTaskCreate(StudyTaskBase):
    pass

class StudyTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    priority: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    due_date: Optional[datetime] = None
    scheduled_date: Optional[date] = None
    status: Optional[str] = None
    recommendation_reason: Optional[str] = None

class StudyTaskOut(StudyTaskBase):
    id: int
    user_id: int
    actual_minutes: int
    status: str
    recommendation_reason: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Focus Timer Schemas ---
class FocusSessionCreate(BaseModel):
    subject_id: Optional[int] = None
    task_id: Optional[int] = None
    duration_seconds: int = Field(..., ge=1)
    focus_mode: Optional[str] = "pomodoro"
    completed: Optional[bool] = True
    notes: Optional[str] = ""

class FocusSessionOut(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    task_id: Optional[int] = None
    duration_seconds: int
    focus_mode: str
    completed: bool
    notes: str
    started_at: datetime
    ended_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Quizzes Schemas ---
class QuizQuestionBase(BaseModel):
    question_text: str
    question_type: Optional[str] = "mcq"
    options: List[str] = []
    correct_answer: str
    explanation: Optional[str] = ""
    points: Optional[int] = 1

class QuizQuestionOut(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: str
    options: List[str]
    explanation: Optional[str] = ""
    points: int

    model_config = ConfigDict(from_attributes=True)

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    time_limit_minutes: Optional[int] = 15
    passing_score: Optional[int] = 70
    questions: List[QuizQuestionBase] = []

class QuizOut(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    title: str
    description: str
    time_limit_minutes: int
    passing_score: int
    created_at: datetime
    question_count: int = 0
    subject_name: Optional[str] = None
    latest_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class QuizTakeOut(QuizOut):
    questions: List[QuizQuestionOut] = []

class QuizSubmit(BaseModel):
    answers: Dict[str, str]  # question_id string -> answer

class QuizQuestionResult(BaseModel):
    question_id: int
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str

class QuizAttemptOut(BaseModel):
    id: int
    quiz_id: int
    score: float
    max_score: float
    percentage: float
    passed: bool
    completed_at: datetime
    results: List[QuizQuestionResult] = []
    weak_topics: List[str] = []

# --- Flashcards Schemas ---
class FlashcardDeckCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    color: Optional[str] = "#8B5CF6"

class FlashcardDeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    color: Optional[str] = None

class FlashcardCreate(BaseModel):
    deck_id: int
    front: str
    back: str
    hint: Optional[str] = ""

class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    hint: Optional[str] = None

class FlashcardOut(BaseModel):
    id: int
    deck_id: int
    user_id: int
    front: str
    back: str
    hint: Optional[str] = ""
    repetition: int
    interval_days: int
    ease_factor: float
    due_date: datetime
    last_reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class FlashcardDeckOut(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    title: str
    description: str
    color: str
    created_at: datetime
    total_cards: int = 0
    due_cards: int = 0
    new_cards: int = 0

    model_config = ConfigDict(from_attributes=True)

class FlashcardReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=4) # 1: Again, 2: Hard, 3: Good, 4: Easy

# --- Notes & PDF Assistant Schemas ---
class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    tags: Optional[str] = ""
    is_pinned: Optional[bool] = False

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    tags: Optional[str] = None
    is_pinned: Optional[bool] = None

class NoteOut(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    title: str
    content: str
    summary: Optional[str] = ""
    tags: Optional[str] = ""
    is_pinned: bool
    source_filename: Optional[str] = ""
    created_at: datetime
    updated_at: datetime
    subject_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class NoteSummaryResponse(BaseModel):
    summary: str
    key_points: List[str]
    word_count: int
    estimated_read_minutes: int

class AskDocRequest(BaseModel):
    query: str

class AskDocResponse(BaseModel):
    answer: str
    cited_snippets: List[str]
    confidence: float

# --- Exam Schemas ---
class ExamCreate(BaseModel):
    title: str
    subject_id: Optional[int] = None
    exam_date: datetime
    target_score: Optional[float] = 90.0
    location: Optional[str] = ""
    notes: Optional[str] = ""
    weight_percentage: Optional[float] = 20.0

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[int] = None
    exam_date: Optional[datetime] = None
    target_score: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    weight_percentage: Optional[float] = None
    is_completed: Optional[bool] = None

class ExamOut(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    title: str
    exam_date: datetime
    target_score: float
    location: Optional[str] = ""
    notes: Optional[str] = ""
    weight_percentage: float
    is_completed: bool
    days_remaining: int = 0
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Goals Schemas ---
class GoalCreate(BaseModel):
    title: str
    category: Optional[str] = "study_hours"
    target_value: float
    unit: Optional[str] = "hours"
    deadline: Optional[datetime] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[datetime] = None
    is_completed: Optional[bool] = None

class GoalOut(BaseModel):
    id: int
    user_id: int
    title: str
    category: str
    target_value: float
    current_value: float
    unit: str
    deadline: Optional[datetime] = None
    is_completed: bool
    progress_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard & Analytics Schemas ---
class WeeklyFocusDay(BaseModel):
    day: str
    date: str
    minutes: int

class SubjectMasteryStat(BaseModel):
    id: int
    name: str
    color: str
    mastery_percentage: float
    topics_count: int
    study_minutes: int

class WeakTopicStat(BaseModel):
    topic_id: int
    topic_title: str
    subject_name: str
    confidence_level: int
    mastery_score: float
    recommendation: str

class RecommendationItem(BaseModel):
    type: str # 'task', 'flashcard', 'quiz', 'exam_prep'
    title: str
    reason: str
    priority: str
    action_url: str

class DashboardSummaryOut(BaseModel):
    user_name: str
    today_focus_minutes: int
    daily_goal_minutes: int
    active_streak_days: int
    total_study_hours: float
    pending_tasks_count: int
    due_flashcards_count: int
    upcoming_exams_count: int
    mastery_average: float
    weekly_focus: List[WeeklyFocusDay]
    subject_mastery: List[SubjectMasteryStat]
    weak_topics: List[WeakTopicStat]
    recommendations: List[RecommendationItem]
    has_activity: bool
