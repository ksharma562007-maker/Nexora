from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, FocusSession, StudyTask, Subject
from app.schemas import FocusSessionCreate, FocusSessionOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/timer", tags=["timer"])

@router.post("/sessions", response_model=FocusSessionOut, status_code=status.HTTP_201_CREATED)
def record_focus_session(
    session_in: FocusSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    started_at = now - timedelta(seconds=session_in.duration_seconds)

    new_session = FocusSession(
        user_id=current_user.id,
        subject_id=session_in.subject_id,
        task_id=session_in.task_id,
        duration_seconds=session_in.duration_seconds,
        focus_mode=session_in.focus_mode or "pomodoro",
        completed=session_in.completed if session_in.completed is not None else True,
        notes=session_in.notes or "",
        started_at=started_at,
        ended_at=now
    )
    db.add(new_session)

    # If linked to a task, increment task actual minutes
    if session_in.task_id:
        task = db.query(StudyTask).filter(
            StudyTask.id == session_in.task_id,
            StudyTask.user_id == current_user.id
        ).first()
        if task:
            task.actual_minutes += max(1, session_in.duration_seconds // 60)

    db.commit()
    db.refresh(new_session)
    return new_session

def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

@router.get("/stats")
def get_timer_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    start_of_week = start_of_today - timedelta(days=now.weekday())

    sessions = db.query(FocusSession).filter(FocusSession.user_id == current_user.id).all()

    today_seconds = sum(s.duration_seconds for s in sessions if (s.ended_at and to_utc(s.ended_at) >= start_of_today))
    weekly_seconds = sum(s.duration_seconds for s in sessions if (s.ended_at and to_utc(s.ended_at) >= start_of_week))
    total_seconds = sum(s.duration_seconds for s in sessions)

    # Recent 10 sessions with subject details
    recent_sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id)
        .order_by(FocusSession.ended_at.desc())
        .limit(10)
        .all()
    )

    formatted_recent = []
    for s in recent_sessions:
        subj_name = "General Study"
        subj_color = "#6366F1"
        if s.subject_id:
            subj = db.query(Subject).filter(Subject.id == s.subject_id).first()
            if subj:
                subj_name = subj.name
                subj_color = subj.color

        formatted_recent.append({
            "id": s.id,
            "duration_seconds": s.duration_seconds,
            "duration_minutes": round(s.duration_seconds / 60, 1),
            "focus_mode": s.focus_mode,
            "subject_name": subj_name,
            "subject_color": subj_color,
            "notes": s.notes,
            "ended_at": s.ended_at
        })

    return {
        "today_minutes": round(today_seconds / 60, 1),
        "weekly_minutes": round(weekly_seconds / 60, 1),
        "total_hours": round(total_seconds / 3600, 2),
        "total_sessions": len(sessions),
        "recent_sessions": formatted_recent,
        "daily_goal_minutes": current_user.daily_goal_minutes,
        "pomodoro_focus_min": current_user.pomodoro_focus_min,
        "pomodoro_break_min": current_user.pomodoro_break_min
    }
