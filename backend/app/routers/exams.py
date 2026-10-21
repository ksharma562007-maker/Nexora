from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Exam, Goal, Subject
from app.schemas import (
    ExamCreate, ExamUpdate, ExamOut,
    GoalCreate, GoalUpdate, GoalOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["exams_and_goals"])

def attach_exam_meta(exam: Exam, db: Session) -> ExamOut:
    now = datetime.now(timezone.utc)
    exam_dt = exam.exam_date if exam.exam_date.tzinfo else exam.exam_date.replace(tzinfo=timezone.utc)
    days_left = max(0, (exam_dt.date() - now.date()).days)

    out = ExamOut.model_validate(exam)
    out.days_remaining = days_left
    if exam.subject_id:
        subj = db.query(Subject).filter(Subject.id == exam.subject_id).first()
        if subj:
            out.subject_name = subj.name
            out.subject_color = subj.color
    return out

def attach_goal_meta(goal: Goal) -> GoalOut:
    pct = (goal.current_value / goal.target_value * 100.0) if goal.target_value > 0 else 0.0
    out = GoalOut.model_validate(goal)
    out.progress_percentage = min(100.0, round(pct, 1))
    return out

# --- Exams Endpoints ---
@router.get("/exams", response_model=List[ExamOut])
def get_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exams = (
        db.query(Exam)
        .filter(Exam.user_id == current_user.id)
        .order_by(Exam.exam_date.asc())
        .all()
    )
    return [attach_exam_meta(e, db) for e in exams]

@router.post("/exams", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_exam = Exam(
        user_id=current_user.id,
        subject_id=exam_in.subject_id,
        title=exam_in.title.strip(),
        exam_date=exam_in.exam_date,
        target_score=exam_in.target_score or 90.0,
        location=exam_in.location or "",
        notes=exam_in.notes or "",
        weight_percentage=exam_in.weight_percentage or 20.0
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return attach_exam_meta(new_exam, db)

@router.put("/exams/{exam_id}", response_model=ExamOut)
def update_exam(
    exam_id: int,
    exam_in: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if exam_in.title is not None:
        exam.title = exam_in.title.strip()
    if exam_in.subject_id is not None:
        exam.subject_id = exam_in.subject_id
    if exam_in.exam_date is not None:
        exam.exam_date = exam_in.exam_date
    if exam_in.target_score is not None:
        exam.target_score = exam_in.target_score
    if exam_in.location is not None:
        exam.location = exam_in.location
    if exam_in.notes is not None:
        exam.notes = exam_in.notes
    if exam_in.weight_percentage is not None:
        exam.weight_percentage = exam_in.weight_percentage
    if exam_in.is_completed is not None:
        exam.is_completed = exam_in.is_completed

    db.commit()
    db.refresh(exam)
    return attach_exam_meta(exam, db)

@router.delete("/exams/{exam_id}")
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(
        Exam.id == exam_id,
        Exam.user_id == current_user.id
    ).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}

# --- Goals Endpoints ---
@router.get("/goals", response_model=List[GoalOut])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).order_by(Goal.created_at.desc()).all()
    return [attach_goal_meta(g) for g in goals]

@router.post("/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_goal = Goal(
        user_id=current_user.id,
        title=goal_in.title.strip(),
        category=goal_in.category or "study_hours",
        target_value=goal_in.target_value,
        current_value=0.0,
        unit=goal_in.unit or "hours",
        deadline=goal_in.deadline
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return attach_goal_meta(new_goal)

@router.put("/goals/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal_in.title is not None:
        goal.title = goal_in.title.strip()
    if goal_in.category is not None:
        goal.category = goal_in.category
    if goal_in.target_value is not None:
        goal.target_value = goal_in.target_value
    if goal_in.current_value is not None:
        goal.current_value = goal_in.current_value
    if goal_in.unit is not None:
        goal.unit = goal_in.unit
    if goal_in.deadline is not None:
        goal.deadline = goal_in.deadline
    if goal_in.is_completed is not None:
        goal.is_completed = goal_in.is_completed

    # Check auto-complete
    if goal.current_value >= goal.target_value and goal.target_value > 0:
        goal.is_completed = True

    db.commit()
    db.refresh(goal)
    return attach_goal_meta(goal)

@router.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal removed successfully"}
