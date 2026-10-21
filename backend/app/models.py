from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Date, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar = Column(String(100), default="avatar-1")
    daily_goal_minutes = Column(Integer, default=120)
    pomodoro_focus_min = Column(Integer, default=25)
    pomodoro_break_min = Column(Integer, default=5)
    theme_preference = Column(String(20), default="dark")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("StudyTask", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    decks = relationship("FlashcardDeck", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), default="")
    description = Column(Text, default="")
    color = Column(String(50), default="#6366F1")
    icon = Column(String(50), default="BookOpen")
    target_hours = Column(Float, default=20.0)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    tasks = relationship("StudyTask", back_populates="subject")
    quizzes = relationship("Quiz", back_populates="subject")
    decks = relationship("FlashcardDeck", back_populates="subject")
    notes = relationship("Note", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")
    sessions = relationship("FocusSession", back_populates="subject")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    priority = Column(String(50), default="medium")  # low, medium, high
    confidence_level = Column(Integer, default=2)     # 1-5
    mastery_score = Column(Float, default=0.0)        # 0.0 to 100.0%
    status = Column(String(50), default="not_started") # not_started, in_progress, mastered
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="topics")
    subject = relationship("Subject", back_populates="topics")
    tasks = relationship("StudyTask", back_populates="topic")

class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    priority = Column(String(50), default="medium")  # low, medium, high, urgent
    estimated_minutes = Column(Integer, default=30)
    actual_minutes = Column(Integer, default=0)
    due_date = Column(DateTime, nullable=True)
    scheduled_date = Column(Date, nullable=True)
    status = Column(String(50), default="pending")   # pending, in_progress, completed, skipped
    recommendation_reason = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="tasks")
    subject = relationship("Subject", back_populates="tasks")
    topic = relationship("Topic", back_populates="tasks")

class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(Integer, ForeignKey("study_tasks.id", ondelete="SET NULL"), nullable=True)
    duration_seconds = Column(Integer, default=0)  # elapsed focus time
    focus_mode = Column(String(50), default="pomodoro")  # pomodoro, stopwatch, countdown
    completed = Column(Boolean, default=True)
    notes = Column(Text, default="")
    started_at = Column(DateTime, default=utcnow)
    ended_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="sessions")
    subject = relationship("Subject", back_populates="sessions")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    time_limit_minutes = Column(Integer, default=15)
    passing_score = Column(Integer, default=70)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="quizzes")
    subject = relationship("Subject", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="mcq")  # mcq, true_false, short_answer
    options_json = Column(Text, default="[]")           # JSON array of strings
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, default="")
    points = Column(Integer, default=1)

    quiz = relationship("Quiz", back_populates="questions")

    @property
    def options(self) -> list:
        import json
        try:
            return json.loads(self.options_json) if self.options_json else []
        except Exception:
            return []

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    answers_json = Column(Text, default="{}")        # JSON map {question_id: user_answer}
    weak_topics_json = Column(Text, default="[]")    # JSON array of identified weak topics
    completed_at = Column(DateTime, default=utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")

class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    color = Column(String(50), default="#8B5CF6")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="decks")
    subject = relationship("Subject", back_populates="decks")
    cards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    hint = Column(Text, default="")
    # Spaced Repetition (SuperMemo SM-2)
    repetition = Column(Integer, default=0)
    interval_days = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)
    due_date = Column(DateTime, default=utcnow, index=True)
    last_reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    deck = relationship("FlashcardDeck", back_populates="cards")
    user = relationship("User", back_populates="flashcards")
    review_logs = relationship("FlashcardReviewLog", back_populates="card", cascade="all, delete-orphan")

class FlashcardReviewLog(Base):
    __tablename__ = "flashcard_review_logs"

    id = Column(Integer, primary_key=True, index=True)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1=Again, 2=Hard, 3=Good, 4=Easy
    interval_before = Column(Integer, default=0)
    interval_after = Column(Integer, default=0)
    reviewed_at = Column(DateTime, default=utcnow)

    card = relationship("Flashcard", back_populates="review_logs")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")
    summary = Column(Text, default="")
    tags = Column(String(255), default="")
    is_pinned = Column(Boolean, default=False)
    source_filename = Column(String(255), default="")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="notes")
    subject = relationship("Subject", back_populates="notes")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    exam_date = Column(DateTime, nullable=False, index=True)
    target_score = Column(Float, default=90.0)
    location = Column(String(255), default="")
    notes = Column(Text, default="")
    weight_percentage = Column(Float, default=20.0)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="study_hours") # study_hours, quizzes_passed, cards_reviewed, topics_mastered
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0)
    unit = Column(String(50), default="hours")
    deadline = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="goals")
