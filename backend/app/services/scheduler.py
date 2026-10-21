from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import StudyTask, Exam, Topic, User

def rank_and_schedule_tasks(db: Session, user: User) -> List[Dict[str, Any]]:
    """
    Real heuristic scheduling algorithm that analyzes:
    1. Priority level (urgent/high/med/low)
    2. Deadline urgency & overdue status
    3. Associated upcoming exams proximity
    4. Associated topic confidence and mastery scores
    5. Daily study capacity limits & overbooking checks
    Returns ordered tasks with calculated priority scores, conflict flags, and transparent reasons.
    """
    now = datetime.now(timezone.utc)
    today = now.date()

    # Fetch pending tasks
    tasks = db.query(StudyTask).filter(
        StudyTask.user_id == user.id,
        StudyTask.status.in_(["pending", "in_progress"])
    ).all()

    # Fetch active upcoming exams
    upcoming_exams = db.query(Exam).filter(
        Exam.user_id == user.id,
        Exam.is_completed == False,
        Exam.exam_date >= now - timedelta(days=1)
    ).all()
    # Map subject_id -> closest exam days
    subject_exam_map: Dict[int, Tuple[int, str]] = {}
    for exam in upcoming_exams:
        days_left = max(0, (exam.exam_date.date() - today).days)
        if exam.subject_id:
            if exam.subject_id not in subject_exam_map or days_left < subject_exam_map[exam.subject_id][0]:
                subject_exam_map[exam.subject_id] = (days_left, exam.title)

    # Fetch topics for user
    topics = db.query(Topic).filter(Topic.user_id == user.id).all()
    topic_map: Dict[int, Topic] = {t.id: t for t in topics}

    scored_tasks = []

    for task in tasks:
        score = 0.0
        reasons = []

        # 1. Base priority
        priority_weights = {
            "urgent": 40.0,
            "high": 30.0,
            "medium": 20.0,
            "low": 10.0
        }
        p_val = priority_weights.get(task.priority.lower(), 20.0)
        score += p_val

        # 2. Due date urgency
        if task.due_date:
            due_dt = task.due_date if task.due_date.tzinfo else task.due_date.replace(tzinfo=timezone.utc)
            delta_days = (due_dt.date() - today).days

            if delta_days < 0:
                score += 50.0
                reasons.append(f"Overdue by {abs(delta_days)} day(s)")
            elif delta_days == 0:
                score += 40.0
                reasons.append("Due today")
            elif delta_days <= 2:
                score += 25.0
                reasons.append(f"Due in {delta_days} days")
            elif delta_days <= 5:
                score += 12.0
                reasons.append(f"Due in {delta_days} days")

        # 3. Exam proximity for subject
        if task.subject_id and task.subject_id in subject_exam_map:
            exam_days, exam_title = subject_exam_map[task.subject_id]
            if exam_days <= 2:
                score += 35.0
                reasons.append(f"Critical: '{exam_title}' in {exam_days}d")
            elif exam_days <= 7:
                score += 20.0
                reasons.append(f"Upcoming: '{exam_title}' in {exam_days}d")
            elif exam_days <= 14:
                score += 10.0
                reasons.append(f"Exam in {exam_days}d")

        # 4. Weak topic reinforcement
        if task.topic_id and task.topic_id in topic_map:
            topic = topic_map[task.topic_id]
            if topic.confidence_level <= 2 or topic.mastery_score < 50.0:
                score += 20.0
                reasons.append(f"Low mastery in topic ({int(topic.mastery_score)}%)")
            elif topic.confidence_level == 3:
                score += 8.0

        # Construct concise explanation
        if not reasons:
            reasons.append(f"Priority: {task.priority.capitalize()}")
        explanation = " • ".join(reasons)

        # Update recommendation reason on task
        task.recommendation_reason = explanation

        scored_tasks.append({
            "task": task,
            "score": round(score, 1),
            "reasons": reasons,
            "explanation": explanation
        })

    # Sort descending by score
    scored_tasks.sort(key=lambda x: x["score"], reverse=True)
    db.commit()

    return scored_tasks

def detect_schedule_conflicts(tasks: List[StudyTask], daily_capacity_minutes: int = 120) -> Dict[str, Any]:
    """
    Detects dates where tasks exceed daily capacity.
    """
    daily_load: Dict[str, int] = {}
    conflicts = []

    for task in tasks:
        if task.scheduled_date and task.status != "completed":
            d_str = str(task.scheduled_date)
            daily_load[d_str] = daily_load.get(d_str, 0) + (task.estimated_minutes or 30)

    for d_str, total_min in daily_load.items():
        if total_min > daily_capacity_minutes:
            conflicts.append({
                "date": d_str,
                "allocated_minutes": total_min,
                "capacity_minutes": daily_capacity_minutes,
                "overbooked_by": total_min - daily_capacity_minutes,
                "warning": f"Overbooked by {total_min - daily_capacity_minutes} mins on {d_str}"
            })

    return {
        "daily_load": daily_load,
        "conflicts": conflicts
    }
