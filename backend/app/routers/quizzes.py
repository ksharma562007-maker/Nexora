import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Quiz, QuizQuestion, QuizAttempt, Subject, Topic, Note
from app.schemas import (
    QuizCreate, QuizOut, QuizTakeOut, QuizQuestionOut,
    QuizSubmit, QuizAttemptOut, QuizQuestionResult
)
from app.auth import get_current_user
from app.services.question_generator import generate_practice_questions

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

def parse_options(options_json: str) -> List[str]:
    try:
        return json.loads(options_json) if options_json else []
    except Exception:
        return []

@router.get("", response_model=List[QuizOut])
def get_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()
    results = []
    for q in quizzes:
        q_count = len(q.questions)
        subj_name = None
        if q.subject_id:
            subj = db.query(Subject).filter(Subject.id == q.subject_id).first()
            if subj:
                subj_name = subj.name

        latest_attempt = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.quiz_id == q.id, QuizAttempt.user_id == current_user.id)
            .order_by(QuizAttempt.completed_at.desc())
            .first()
        )
        latest_score = latest_attempt.percentage if latest_attempt else None

        item = QuizOut.model_validate(q)
        item.question_count = q_count
        item.subject_name = subj_name
        item.latest_score = latest_score
        results.append(item)
    return results

@router.post("", response_model=QuizOut, status_code=status.HTTP_201_CREATED)
def create_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_quiz = Quiz(
        user_id=current_user.id,
        subject_id=quiz_in.subject_id,
        topic_id=quiz_in.topic_id,
        title=quiz_in.title.strip(),
        description=quiz_in.description or "",
        time_limit_minutes=quiz_in.time_limit_minutes or 15,
        passing_score=quiz_in.passing_score or 70
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    for q_data in quiz_in.questions:
        qq = QuizQuestion(
            quiz_id=new_quiz.id,
            question_text=q_data.question_text.strip(),
            question_type=q_data.question_type or "mcq",
            options_json=json.dumps(q_data.options),
            correct_answer=q_data.correct_answer.strip(),
            explanation=q_data.explanation or "",
            points=q_data.points or 1
        )
        db.add(qq)

    db.commit()
    db.refresh(new_quiz)

    res = QuizOut.model_validate(new_quiz)
    res.question_count = len(quiz_in.questions)
    return res

@router.get("/{quiz_id}", response_model=QuizTakeOut)
def get_quiz_detail(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    subj_name = None
    if quiz.subject_id:
        subj = db.query(Subject).filter(Subject.id == quiz.subject_id).first()
        if subj:
            subj_name = subj.name

    latest_attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz.id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .first()
    )

    questions_out = []
    for q in quiz.questions:
        questions_out.append(QuizQuestionOut(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=parse_options(q.options_json),
            explanation=q.explanation,
            points=q.points
        ))

    return QuizTakeOut(
        id=quiz.id,
        user_id=quiz.user_id,
        subject_id=quiz.subject_id,
        topic_id=quiz.topic_id,
        title=quiz.title,
        description=quiz.description,
        time_limit_minutes=quiz.time_limit_minutes,
        passing_score=quiz.passing_score,
        created_at=quiz.created_at,
        question_count=len(quiz.questions),
        subject_name=subj_name,
        latest_score=latest_attempt.percentage if latest_attempt else None,
        questions=questions_out
    )

@router.post("/{quiz_id}/submit", response_model=QuizAttemptOut)
def submit_quiz(
    quiz_id: int,
    submission: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz.questions
    if not questions:
        raise HTTPException(status_code=400, detail="Cannot submit an empty quiz")

    total_score = 0.0
    max_score = 0.0
    results_list: List[QuizQuestionResult] = []
    weak_topics: List[str] = []

    for q in questions:
        max_score += q.points
        user_ans = submission.answers.get(str(q.id), "").strip()
        correct_ans = q.correct_answer.strip()

        # Grade logic based on type
        is_correct = False
        if q.question_type in ["mcq", "true_false"]:
            is_correct = (user_ans.lower() == correct_ans.lower())
        else: # short answer
            is_correct = (
                user_ans.lower() == correct_ans.lower() or
                (len(correct_ans) > 3 and correct_ans.lower() in user_ans.lower())
            )

        if is_correct:
            total_score += q.points
        else:
            # Mark concept as weak
            concept_hint = q.question_text[:40] + ("..." if len(q.question_text) > 40 else "")
            weak_topics.append(concept_hint)

        results_list.append(QuizQuestionResult(
            question_id=q.id,
            question_text=q.question_text,
            user_answer=user_ans if user_ans else "(No Answer)",
            correct_answer=correct_ans,
            is_correct=is_correct,
            explanation=q.explanation or f"The correct answer is: {correct_ans}"
        ))

    percentage = round((total_score / max_score * 100.0) if max_score > 0 else 0.0, 1)
    passed = percentage >= quiz.passing_score

    # Save attempt
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=total_score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        answers_json=json.dumps(submission.answers),
        weak_topics_json=json.dumps(weak_topics),
        completed_at=datetime.now(timezone.utc)
    )
    db.add(attempt)

    # If linked to a topic, update topic mastery dynamically
    if quiz.topic_id:
        topic = db.query(Topic).filter(Topic.id == quiz.topic_id, Topic.user_id == current_user.id).first()
        if topic:
            # Weighted update: 60% historical + 40% new attempt
            if topic.mastery_score > 0:
                topic.mastery_score = round(0.6 * topic.mastery_score + 0.4 * percentage, 1)
            else:
                topic.mastery_score = percentage

            if topic.mastery_score >= 85:
                topic.status = "mastered"
                topic.confidence_level = min(5, topic.confidence_level + 1)
            elif topic.mastery_score < 50:
                topic.status = "in_progress"
                topic.confidence_level = max(1, topic.confidence_level - 1)

    db.commit()
    db.refresh(attempt)

    return QuizAttemptOut(
        id=attempt.id,
        quiz_id=quiz.id,
        score=total_score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        completed_at=attempt.completed_at,
        results=results_list,
        weak_topics=weak_topics
    )

@router.get("/{quiz_id}/attempts", response_model=List[QuizAttemptOut])
def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    results = []
    for a in attempts:
        weak = json.loads(a.weak_topics_json) if a.weak_topics_json else []
        results.append(QuizAttemptOut(
            id=a.id,
            quiz_id=a.quiz_id,
            score=a.score,
            max_score=a.max_score,
            percentage=a.percentage,
            passed=a.passed,
            completed_at=a.completed_at,
            results=[],
            weak_topics=weak
        ))
    return results

@router.post("/generate-from-note", response_model=QuizOut, status_code=status.HTTP_201_CREATED)
def generate_quiz_from_note(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note_id = data.get("note_id")
    note_text = ""
    title = data.get("title", "Practice Assessment")
    subject_id = data.get("subject_id")
    topic_id = data.get("topic_id")

    if note_id:
        note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Source note not found")
        note_text = note.content
        title = f"Quiz: {note.title}"
        subject_id = note.subject_id
        topic_id = note.topic_id
    else:
        note_text = data.get("text", "")

    if not note_text.strip():
        raise HTTPException(status_code=400, detail="Cannot generate quiz from empty text")

    generated_qs = generate_practice_questions(note_text, num_questions=5)
    if not generated_qs:
        raise HTTPException(
            status_code=400,
            detail="Could not extract enough structured concepts from text to generate questions. Please ensure notes contain clear definitions or bullet points."
        )

    new_quiz = Quiz(
        user_id=current_user.id,
        subject_id=subject_id,
        topic_id=topic_id,
        title=title,
        description=f"Auto-generated practice quiz based on study notes. Contains {len(generated_qs)} questions.",
        time_limit_minutes=max(5, len(generated_qs) * 2),
        passing_score=70
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    for q in generated_qs:
        qq = QuizQuestion(
            quiz_id=new_quiz.id,
            question_text=q["question_text"],
            question_type=q["question_type"],
            options_json=json.dumps(q["options"]),
            correct_answer=q["correct_answer"],
            explanation=q["explanation"],
            points=q["points"]
        )
        db.add(qq)

    db.commit()
    db.refresh(new_quiz)

    res = QuizOut.model_validate(new_quiz)
    res.question_count = len(generated_qs)
    return res

@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}
