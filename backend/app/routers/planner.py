from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, StudyTask, Subject
from app.schemas import StudyTaskCreate, StudyTaskUpdate, StudyTaskOut
from app.auth import get_current_user
from app.services.scheduler import rank_and_schedule_tasks, detect_schedule_conflicts

router = APIRouter(prefix="/api/planner", tags=["planner"])

def attach_subject_meta(task: StudyTask, db: Session) -> StudyTaskOut:
    out = StudyTaskOut.model_validate(task)
    if task.subject_id:
        subj = db.query(Subject).filter(Subject.id == task.subject_id).first()
        if subj:
            out.subject_name = subj.name
            out.subject_color = subj.color
    return out

@router.get("/tasks", response_model=List[StudyTaskOut])
def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StudyTask).filter(StudyTask.user_id == current_user.id)
    if status_filter:
        query = query.filter(StudyTask.status == status_filter)
    tasks = query.order_by(StudyTask.due_date.asc().nullslast(), StudyTask.created_at.desc()).all()
    return [attach_subject_meta(t, db) for t in tasks]

@router.post("/tasks", response_model=StudyTaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: StudyTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_task = StudyTask(
        user_id=current_user.id,
        subject_id=task_in.subject_id,
        topic_id=task_in.topic_id,
        title=task_in.title.strip(),
        description=task_in.description or "",
        priority=task_in.priority or "medium",
        estimated_minutes=task_in.estimated_minutes or 30,
        due_date=task_in.due_date,
        scheduled_date=task_in.scheduled_date,
        status="pending"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Trigger scheduler update
    rank_and_schedule_tasks(db, current_user)
    db.refresh(new_task)

    return attach_subject_meta(new_task, db)

@router.put("/tasks/{task_id}", response_model=StudyTaskOut)
def update_task(
    task_id: int,
    task_in: StudyTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Study task not found")

    if task_in.title is not None:
        task.title = task_in.title.strip()
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.subject_id is not None:
        task.subject_id = task_in.subject_id
    if task_in.topic_id is not None:
        task.topic_id = task_in.topic_id
    if task_in.priority is not None:
        task.priority = task_in.priority
    if task_in.estimated_minutes is not None:
        task.estimated_minutes = task_in.estimated_minutes
    if task_in.actual_minutes is not None:
        task.actual_minutes = task_in.actual_minutes
    if task_in.due_date is not None:
        task.due_date = task_in.due_date
    if task_in.scheduled_date is not None:
        task.scheduled_date = task_in.scheduled_date
    if task_in.status is not None:
        task.status = task_in.status
        if task_in.status == "completed" and not task.completed_at:
            task.completed_at = datetime.now(timezone.utc)
        elif task_in.status != "completed":
            task.completed_at = None

    db.commit()
    # Trigger smart recalculation
    rank_and_schedule_tasks(db, current_user)
    db.refresh(task)

    return attach_subject_meta(task, db)

@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(StudyTask).filter(
        StudyTask.id == task_id,
        StudyTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Study task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task removed successfully"}

@router.get("/recommendations")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    ranked = rank_and_schedule_tasks(db, current_user)
    all_tasks = db.query(StudyTask).filter(StudyTask.user_id == current_user.id).all()
    conflicts_info = detect_schedule_conflicts(all_tasks, current_user.daily_goal_minutes)

    formatted_ranked = []
    for item in ranked:
        t_out = attach_subject_meta(item["task"], db)
        formatted_ranked.append({
            "task": t_out,
            "priority_score": item["score"],
            "reasons": item["reasons"],
            "explanation": item["explanation"]
        })

    return {
        "recommended_tasks": formatted_ranked,
        "conflicts": conflicts_info["conflicts"],
        "daily_load": conflicts_info["daily_load"],
        "daily_capacity_minutes": current_user.daily_goal_minutes
    }

@router.post("/recalculate")
def recalculate_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rank_and_schedule_tasks(db, current_user)
    return {"message": "Schedule recommendations recalculated successfully."}
