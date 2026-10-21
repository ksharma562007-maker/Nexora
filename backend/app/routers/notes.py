from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Note, Subject
from app.schemas import (
    NoteCreate, NoteUpdate, NoteOut, NoteSummaryResponse,
    AskDocRequest, AskDocResponse
)
from app.auth import get_current_user
from app.config import settings
from app.utils.pdf_extractor import extract_text_from_pdf
from app.services.nlp_summarizer import generate_extractive_summary, answer_document_query

router = APIRouter(prefix="/api/notes", tags=["notes"])

def attach_note_meta(note: Note, db: Session) -> NoteOut:
    out = NoteOut.model_validate(note)
    if note.subject_id:
        subj = db.query(Subject).filter(Subject.id == note.subject_id).first()
        if subj:
            out.subject_name = subj.name
    return out

@router.get("", response_model=List[NoteOut])
def get_notes(
    q: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Note).filter(Note.user_id == current_user.id)
    if subject_id:
        query = query.filter(Note.subject_id == subject_id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (Note.title.ilike(term)) | (Note.content.ilike(term)) | (Note.tags.ilike(term))
        )

    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()
    return [attach_note_meta(n, db) for n in notes]

@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-generate summary if content is long
    summary_text = ""
    if len(note_in.content or "") > 200:
        sum_result = generate_extractive_summary(note_in.content, max_sentences=3)
        summary_text = sum_result.get("summary", "")

    new_note = Note(
        user_id=current_user.id,
        subject_id=note_in.subject_id,
        topic_id=note_in.topic_id,
        title=note_in.title.strip(),
        content=note_in.content or "",
        summary=summary_text,
        tags=note_in.tags or "",
        is_pinned=note_in.is_pinned or False
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return attach_note_meta(new_note, db)

@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return attach_note_meta(note, db)

@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    note_in: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note_in.title is not None:
        note.title = note_in.title.strip()
    if note_in.content is not None:
        note.content = note_in.content
        # Refresh summary
        if len(note.content) > 200:
            sum_res = generate_extractive_summary(note.content, max_sentences=3)
            note.summary = sum_res.get("summary", "")
        else:
            note.summary = ""
    if note_in.subject_id is not None:
        note.subject_id = note_in.subject_id
    if note_in.topic_id is not None:
        note.topic_id = note_in.topic_id
    if note_in.tags is not None:
        note.tags = note_in.tags
    if note_in.is_pinned is not None:
        note.is_pinned = note_in.is_pinned

    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return attach_note_meta(note, db)

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

@router.post("/{note_id}/summarize", response_model=NoteSummaryResponse)
def summarize_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if not note.content.strip():
        raise HTTPException(status_code=400, detail="Note has no content to summarize")

    result = generate_extractive_summary(note.content, max_sentences=4)
    note.summary = result["summary"]
    db.commit()

    return NoteSummaryResponse(
        summary=result["summary"],
        key_points=result["key_points"],
        word_count=result["word_count"],
        estimated_read_minutes=result["estimated_read_minutes"]
    )

@router.post("/{note_id}/ask", response_model=AskDocResponse)
def ask_document_question(
    note_id: int,
    request: AskDocRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    result = answer_document_query(note.content, request.query)
    return AskDocResponse(
        answer=result["answer"],
        cited_snippets=result["cited_snippets"],
        confidence=result["confidence"]
    )

@router.post("/upload-pdf", response_model=NoteOut)
async def upload_pdf(
    file: UploadFile = File(...),
    subject_id: Optional[int] = Form(None),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate content type and file extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files (.pdf) are supported."
        )

    # Read bytes with size check
    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    extraction = extract_text_from_pdf(contents)
    if not extraction["success"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=extraction["error"]
        )

    extracted_text = extraction["text"]
    note_title = title.strip() if (title and title.strip()) else file.filename.rsplit(".", 1)[0].replace("_", " ").title()

    # Generate summary
    sum_res = generate_extractive_summary(extracted_text, max_sentences=4)
    summary_text = sum_res.get("summary", "")
    if not summary_text or len(summary_text.strip()) == 0:
        pages = extraction.get("pages_count", 1)
        summary_text = f"Document contains {pages} page{'s' if pages != 1 else ''}. Ready for active study notes and revision."

    tags = "PDF, Visual Document" if extraction.get("is_scanned") else "PDF, Uploaded"

    new_note = Note(
        user_id=current_user.id,
        subject_id=subject_id,
        title=note_title,
        content=extracted_text,
        summary=summary_text,
        tags=tags,
        source_filename=file.filename
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return attach_note_meta(new_note, db)
