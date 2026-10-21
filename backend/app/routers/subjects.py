from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Subject, Topic
from app.schemas import (
    SubjectCreate, SubjectUpdate, SubjectOut, SubjectDetailOut,
    TopicCreate, TopicUpdate, TopicOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/subjects", tags=["subjects"])

@router.get("", response_model=List[SubjectOut])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    results = []
    for s in subjects:
        topics_count = len(s.topics)
        if topics_count > 0:
            avg_mastery = sum(t.mastery_score for t in s.topics) / topics_count
        else:
            avg_mastery = 0.0

        item = SubjectOut.model_validate(s)
        item.topics_count = topics_count
        item.mastery_average = round(avg_mastery, 1)
        results.append(item)
    return results

@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    subj_in: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_subject = Subject(
        user_id=current_user.id,
        name=subj_in.name.strip(),
        code=subj_in.code.strip() if subj_in.code else "",
        description=subj_in.description or "",
        color=subj_in.color or "#6366F1",
        icon=subj_in.icon or "BookOpen",
        target_hours=subj_in.target_hours or 20.0
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    res = SubjectOut.model_validate(new_subject)
    res.topics_count = 0
    res.mastery_average = 0.0
    return res

@router.get("/{subject_id}", response_model=SubjectDetailOut)
def get_subject_detail(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    topics_count = len(subject.topics)
    avg_mastery = sum(t.mastery_score for t in subject.topics) / topics_count if topics_count > 0 else 0.0

    res = SubjectDetailOut.model_validate(subject)
    res.topics_count = topics_count
    res.mastery_average = round(avg_mastery, 1)
    res.topics = [TopicOut.model_validate(t) for t in subject.topics]
    return res

@router.put("/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    subj_in: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if subj_in.name is not None:
        subject.name = subj_in.name.strip()
    if subj_in.code is not None:
        subject.code = subj_in.code.strip()
    if subj_in.description is not None:
        subject.description = subj_in.description
    if subj_in.color is not None:
        subject.color = subj_in.color
    if subj_in.icon is not None:
        subject.icon = subj_in.icon
    if subj_in.target_hours is not None:
        subject.target_hours = subj_in.target_hours

    db.commit()
    db.refresh(subject)

    topics_count = len(subject.topics)
    avg_mastery = sum(t.mastery_score for t in subject.topics) / topics_count if topics_count > 0 else 0.0
    res = SubjectOut.model_validate(subject)
    res.topics_count = topics_count
    res.mastery_average = round(avg_mastery, 1)
    return res

@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return {"message": "Subject and related data deleted successfully"}

# --- Topic Endpoints ---
@router.post("/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(
    topic_in: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == topic_in.subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Associated subject not found")

    new_topic = Topic(
        user_id=current_user.id,
        subject_id=subject.id,
        title=topic_in.title.strip(),
        description=topic_in.description or "",
        priority=topic_in.priority or "medium",
        confidence_level=topic_in.confidence_level or 2,
        mastery_score=topic_in.mastery_score or 0.0,
        status=topic_in.status or "not_started"
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    return new_topic

@router.put("/topics/{topic_id}", response_model=TopicOut)
def update_topic(
    topic_id: int,
    topic_in: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.user_id == current_user.id
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if topic_in.title is not None:
        topic.title = topic_in.title.strip()
    if topic_in.description is not None:
        topic.description = topic_in.description
    if topic_in.priority is not None:
        topic.priority = topic_in.priority
    if topic_in.confidence_level is not None:
        topic.confidence_level = max(1, min(5, topic_in.confidence_level))
    if topic_in.mastery_score is not None:
        topic.mastery_score = max(0.0, min(100.0, topic_in.mastery_score))
        if topic.mastery_score >= 85:
            topic.status = "mastered"
        elif topic.mastery_score > 0:
            topic.status = "in_progress"
    if topic_in.status is not None:
        topic.status = topic_in.status

    db.commit()
    db.refresh(topic)
    return topic

@router.delete("/topics/{topic_id}")
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topic = db.query(Topic).filter(
        Topic.id == topic_id,
        Topic.user_id == current_user.id
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted successfully"}
