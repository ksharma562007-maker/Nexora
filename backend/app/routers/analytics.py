from datetime import datetime, timedelta, timezone, date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    User, Subject, Topic, StudyTask, FocusSession,
    Quiz, QuizAttempt, Flashcard, Exam, Goal
)
from app.schemas import (
    DashboardSummaryOut, WeeklyFocusDay, SubjectMasteryStat,
    WeakTopicStat, RecommendationItem
)
from app.auth import get_current_user

def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    today = now.date()
    start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    # 1. Focus Sessions
    sessions = db.query(FocusSession).filter(FocusSession.user_id == current_user.id).all()
    today_seconds = sum(
        s.duration_seconds for s in sessions
        if s.ended_at and to_utc(s.ended_at) >= start_of_today
    )
    total_seconds = sum(s.duration_seconds for s in sessions)

    # 2. Weekly focus breakdown (last 7 days)
    weekly_focus: List[WeeklyFocusDay] = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        start_d = datetime(target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc)
        end_d = start_d + timedelta(days=1)

        day_secs = sum(
            s.duration_seconds for s in sessions
            if s.ended_at and start_d <= to_utc(s.ended_at) < end_d
        )
        day_str = day_names[target_date.weekday()]
        weekly_focus.append(WeeklyFocusDay(
            day=day_str,
            date=target_date.strftime("%b %d"),
            minutes=round(day_secs / 60)
        ))

    # 3. Active Streak calculation
    active_dates = set()
    for s in sessions:
        if s.ended_at:
            active_dates.add(s.ended_at.date())
    completed_tasks = db.query(StudyTask).filter(
        StudyTask.user_id == current_user.id,
        StudyTask.status == "completed",
        StudyTask.completed_at != None
    ).all()
    for t in completed_tasks:
        if t.completed_at:
            active_dates.add(t.completed_at.date())

    streak = 0
    check_date = today
    # If not active today yet, check if was active yesterday
    if check_date not in active_dates:
        check_date = today - timedelta(days=1)

    while check_date in active_dates:
        streak += 1
        check_date -= timedelta(days=1)

    # 4. Subjects & Mastery
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    all_topics = db.query(Topic).filter(Topic.user_id == current_user.id).all()
    subject_stats: List[SubjectMasteryStat] = []
    total_mastery = 0.0

    for s in subjects:
        s_topics = [t for t in all_topics if t.subject_id == s.id]
        t_count = len(s_topics)
        avg_m = (sum(t.mastery_score for t in s_topics) / t_count) if t_count > 0 else 0.0
        total_mastery += avg_m

        # Study time for this subject
        s_secs = sum(sess.duration_seconds for sess in sessions if sess.subject_id == s.id)
        subject_stats.append(SubjectMasteryStat(
            id=s.id,
            name=s.name,
            color=s.color,
            mastery_percentage=round(avg_m, 1),
            topics_count=t_count,
            study_minutes=round(s_secs / 60)
        ))

    overall_mastery = round((total_mastery / len(subjects)), 1) if subjects else 0.0

    # 5. Weak Topics (confidence <= 2 or mastery < 50%)
    weak_topics: List[WeakTopicStat] = []
    for t in all_topics:
        if t.confidence_level <= 2 or (t.mastery_score < 50.0 and t.status != "not_started"):
            subj = next((s for s in subjects if s.id == t.subject_id), None)
            subj_name = subj.name if subj else "General"
            rec = "Practice with flashcards or take a revision quiz" if t.mastery_score < 40 else "Review key notes and schedule a focus block"
            weak_topics.append(WeakTopicStat(
                topic_id=t.id,
                topic_title=t.title,
                subject_name=subj_name,
                confidence_level=t.confidence_level,
                mastery_score=t.mastery_score,
                recommendation=rec
            ))

    # 6. Tasks, Due Flashcards, Upcoming Exams
    pending_tasks = db.query(StudyTask).filter(
        StudyTask.user_id == current_user.id,
        StudyTask.status.in_(["pending", "in_progress"])
    ).count()

    due_flashcards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.due_date <= now
    ).count()

    upcoming_exams = db.query(Exam).filter(
        Exam.user_id == current_user.id,
        Exam.is_completed == False,
        Exam.exam_date >= start_of_today
    ).count()

    # 7. Actionable Recommendations
    recommendations: List[RecommendationItem] = []
    # Flashcard recommendation
    if due_flashcards > 0:
        recommendations.append(RecommendationItem(
            type="flashcard",
            title=f"Review {due_flashcards} due flashcard{'s' if due_flashcards != 1 else ''}",
            reason="Spaced repetition interval due today to prevent memory decay",
            priority="high",
            action_url="/flashcards"
        ))

    # Weak topic recommendation
    if weak_topics:
        top_weak = weak_topics[0]
        recommendations.append(RecommendationItem(
            type="quiz",
            title=f"Reinforce topic: {top_weak.topic_title}",
            reason=f"Current mastery is {top_weak.mastery_score:.0f}%. Practice quiz recommended.",
            priority="medium",
            action_url="/quizzes"
        ))

    # Urgent upcoming exam
    closest_exam = (
        db.query(Exam)
        .filter(Exam.user_id == current_user.id, Exam.is_completed == False, Exam.exam_date >= start_of_today)
        .order_by(Exam.exam_date.asc())
        .first()
    )
    if closest_exam:
        exam_dt = closest_exam.exam_date if closest_exam.exam_date.tzinfo else closest_exam.exam_date.replace(tzinfo=timezone.utc)
        days_left = (exam_dt.date() - today).days
        recommendations.append(RecommendationItem(
            type="exam_prep",
            title=f"Prepare for '{closest_exam.title}' in {days_left} days",
            reason=f"Upcoming exam on {exam_dt.strftime('%b %d')}. Complete scheduled study blocks.",
            priority="urgent" if days_left <= 3 else "high",
            action_url="/exams"
        ))

    # Study planner task recommendation
    top_task = (
        db.query(StudyTask)
        .filter(StudyTask.user_id == current_user.id, StudyTask.status == "pending")
        .order_by(StudyTask.priority.desc(), StudyTask.due_date.asc().nullslast())
        .first()
    )
    if top_task:
        recommendations.append(RecommendationItem(
            type="task",
            title=f"Task: {top_task.title}",
            reason=top_task.recommendation_reason or f"Priority: {top_task.priority.capitalize()}",
            priority=top_task.priority,
            action_url="/planner"
        ))

    # Check if user has any activity
    has_activity = (
        len(subjects) > 0 or
        len(sessions) > 0 or
        pending_tasks > 0 or
        len(all_topics) > 0
    )

    return DashboardSummaryOut(
        user_name=current_user.full_name,
        today_focus_minutes=round(today_seconds / 60),
        daily_goal_minutes=current_user.daily_goal_minutes,
        active_streak_days=streak,
        total_study_hours=round(total_seconds / 3600, 1),
        pending_tasks_count=pending_tasks,
        due_flashcards_count=due_flashcards,
        upcoming_exams_count=upcoming_exams,
        mastery_average=overall_mastery,
        weekly_focus=weekly_focus,
        subject_mastery=subject_stats,
        weak_topics=weak_topics[:5],
        recommendations=recommendations[:4],
        has_activity=has_activity
    )

@router.get("/deep")
def get_deep_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    today = now.date()

    # 1. 14-day Focus Trend
    focus_trend = []
    sessions = db.query(FocusSession).filter(FocusSession.user_id == current_user.id).all()
    for i in range(13, -1, -1):
        target_date = today - timedelta(days=i)
        start_d = datetime(target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc)
        end_d = start_d + timedelta(days=1)
        day_secs = sum(s.duration_seconds for s in sessions if s.ended_at and start_d <= to_utc(s.ended_at) < end_d)
        focus_trend.append({
            "date": target_date.strftime("%b %d"),
            "minutes": round(day_secs / 60),
            "target": current_user.daily_goal_minutes
        })

    # 2. Planned vs Actual study minutes by subject
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    tasks = db.query(StudyTask).filter(StudyTask.user_id == current_user.id).all()

    planned_vs_actual = []
    for s in subjects:
        s_tasks = [t for t in tasks if t.subject_id == s.id]
        planned_min = sum(t.estimated_minutes or 30 for t in s_tasks)
        actual_min = sum(t.actual_minutes or 0 for t in s_tasks)
        # Add actual sessions for subject
        sess_min = sum(sess.duration_seconds for sess in sessions if sess.subject_id == s.id) // 60
        actual_total = max(actual_min, sess_min)

        planned_vs_actual.append({
            "subject": s.name,
            "planned": planned_min,
            "actual": actual_total,
            "color": s.color
        })

    # 3. Quiz accuracy trend
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.asc())
        .limit(10)
        .all()
    )
    quiz_trend = []
    for idx, a in enumerate(attempts):
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        quiz_trend.append({
            "attempt": idx + 1,
            "quiz_title": quiz.title if quiz else "Quiz",
            "score_pct": a.percentage,
            "passed": a.passed,
            "date": a.completed_at.strftime("%b %d") if a.completed_at else ""
        })

    # 4. Task completion rate
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    in_progress = sum(1 for t in tasks if t.status == "in_progress")
    pending = sum(1 for t in tasks if t.status == "pending")

    return {
        "focus_trend": focus_trend,
        "planned_vs_actual": planned_vs_actual,
        "quiz_trend": quiz_trend,
        "tasks_summary": {
            "total": total_tasks,
            "completed": completed_tasks,
            "in_progress": in_progress,
            "pending": pending,
            "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0.0
        }
    }
