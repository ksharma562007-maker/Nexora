from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, FlashcardDeck, Flashcard, FlashcardReviewLog, Note, Subject
from app.schemas import (
    FlashcardDeckCreate, FlashcardDeckUpdate, FlashcardDeckOut,
    FlashcardCreate, FlashcardUpdate, FlashcardOut,
    FlashcardReviewRequest
)
from app.auth import get_current_user
from app.services.spaced_repetition import calculate_sm2
from app.services.question_generator import generate_flashcards_from_text

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])

@router.get("/decks", response_model=List[FlashcardDeckOut])
def get_decks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decks = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == current_user.id).order_by(FlashcardDeck.created_at.desc()).all()
    now = datetime.now(timezone.utc)
    results = []

    for d in decks:
        total = len(d.cards)
        due = sum(1 for c in d.cards if (c.due_date.tzinfo and c.due_date <= now) or (not c.due_date.tzinfo and c.due_date <= now.replace(tzinfo=None)))
        new_cards = sum(1 for c in d.cards if c.repetition == 0)

        item = FlashcardDeckOut.model_validate(d)
        item.total_cards = total
        item.due_cards = due
        item.new_cards = new_cards
        results.append(item)

    return results

@router.post("/decks", response_model=FlashcardDeckOut, status_code=status.HTTP_201_CREATED)
def create_deck(
    deck_in: FlashcardDeckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_deck = FlashcardDeck(
        user_id=current_user.id,
        subject_id=deck_in.subject_id,
        topic_id=deck_in.topic_id,
        title=deck_in.title.strip(),
        description=deck_in.description or "",
        color=deck_in.color or "#8B5CF6"
    )
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)

    res = FlashcardDeckOut.model_validate(new_deck)
    res.total_cards = 0
    res.due_cards = 0
    res.new_cards = 0
    return res

@router.get("/decks/{deck_id}", response_model=FlashcardDeckOut)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard deck not found")

    now = datetime.now(timezone.utc)
    total = len(deck.cards)
    due = sum(1 for c in deck.cards if (c.due_date.tzinfo and c.due_date <= now) or (not c.due_date.tzinfo and c.due_date <= now.replace(tzinfo=None)))
    new_cards = sum(1 for c in deck.cards if c.repetition == 0)

    res = FlashcardDeckOut.model_validate(deck)
    res.total_cards = total
    res.due_cards = due
    res.new_cards = new_cards
    return res

@router.put("/decks/{deck_id}", response_model=FlashcardDeckOut)
def update_deck(
    deck_id: int,
    deck_in: FlashcardDeckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard deck not found")

    if deck_in.title is not None:
        deck.title = deck_in.title.strip()
    if deck_in.description is not None:
        deck.description = deck_in.description
    if deck_in.subject_id is not None:
        deck.subject_id = deck_in.subject_id
    if deck_in.topic_id is not None:
        deck.topic_id = deck_in.topic_id
    if deck_in.color is not None:
        deck.color = deck_in.color

    db.commit()
    db.refresh(deck)

    now = datetime.now(timezone.utc)
    total = len(deck.cards)
    due = sum(1 for c in deck.cards if (c.due_date.tzinfo and c.due_date <= now) or (not c.due_date.tzinfo and c.due_date <= now.replace(tzinfo=None)))
    new_cards = sum(1 for c in deck.cards if c.repetition == 0)

    res = FlashcardDeckOut.model_validate(deck)
    res.total_cards = total
    res.due_cards = due
    res.new_cards = new_cards
    return res

@router.delete("/decks/{deck_id}")
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard deck not found")

    db.delete(deck)
    db.commit()
    return {"message": "Deck deleted successfully"}

# --- Cards Endpoints ---
@router.get("/decks/{deck_id}/cards", response_model=List[FlashcardOut])
def get_deck_cards(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify deck ownership
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    cards = db.query(Flashcard).filter(
        Flashcard.deck_id == deck_id,
        Flashcard.user_id == current_user.id
    ).order_by(Flashcard.due_date.asc()).all()
    return cards

@router.post("/cards", response_model=FlashcardOut, status_code=status.HTTP_201_CREATED)
def create_card(
    card_in: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == card_in.deck_id,
        FlashcardDeck.user_id == current_user.id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    new_card = Flashcard(
        deck_id=deck.id,
        user_id=current_user.id,
        front=card_in.front.strip(),
        back=card_in.back.strip(),
        hint=card_in.hint.strip() if card_in.hint else "",
        repetition=0,
        interval_days=1,
        ease_factor=2.5,
        due_date=datetime.now(timezone.utc)
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.put("/cards/{card_id}", response_model=FlashcardOut)
def update_card(
    card_id: int,
    card_in: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Flashcard).filter(
        Flashcard.id == card_id,
        Flashcard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    if card_in.front is not None:
        card.front = card_in.front.strip()
    if card_in.back is not None:
        card.back = card_in.back.strip()
    if card_in.hint is not None:
        card.hint = card_in.hint.strip()

    db.commit()
    db.refresh(card)
    return card

@router.delete("/cards/{card_id}")
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Flashcard).filter(
        Flashcard.id == card_id,
        Flashcard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    db.delete(card)
    db.commit()
    return {"message": "Card deleted successfully"}

@router.get("/due", response_model=List[FlashcardOut])
def get_due_cards(
    deck_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    query = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.due_date <= now
    )
    if deck_id:
        query = query.filter(Flashcard.deck_id == deck_id)

    due_cards = query.order_by(Flashcard.due_date.asc()).limit(limit).all()
    return due_cards

@router.post("/cards/{card_id}/review", response_model=FlashcardOut)
def review_card(
    card_id: int,
    review_in: FlashcardReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Flashcard).filter(
        Flashcard.id == card_id,
        Flashcard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    old_interval = card.interval_days
    new_rep, new_interval, new_ease, next_due = calculate_sm2(
        rating=review_in.rating,
        repetition=card.repetition,
        interval_days=card.interval_days,
        ease_factor=card.ease_factor
    )

    # Log review
    log = FlashcardReviewLog(
        flashcard_id=card.id,
        user_id=current_user.id,
        rating=review_in.rating,
        interval_before=old_interval,
        interval_after=new_interval,
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(log)

    # Update card
    card.repetition = new_rep
    card.interval_days = new_interval
    card.ease_factor = new_ease
    card.due_date = next_due
    card.last_reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(card)
    return card

@router.post("/generate-from-note", response_model=List[FlashcardOut])
def generate_cards_from_note(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note_id = data.get("note_id")
    deck_id = data.get("deck_id")
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if not deck_id:
        # Create a new deck for this note
        deck = FlashcardDeck(
            user_id=current_user.id,
            subject_id=note.subject_id,
            topic_id=note.topic_id,
            title=f"Deck: {note.title}",
            description=f"Auto-generated cards from note: {note.title}",
            color="#8B5CF6"
        )
        db.add(deck)
        db.commit()
        db.refresh(deck)
        deck_id = deck.id
    else:
        deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id, FlashcardDeck.user_id == current_user.id).first()
        if not deck:
            raise HTTPException(status_code=404, detail="Target deck not found")

    raw_cards = generate_flashcards_from_text(note.content, max_cards=10)
    if not raw_cards:
        raise HTTPException(
            status_code=400,
            detail="Could not extract enough concept terms or definitions from note to create flashcards."
        )

    created_cards = []
    now = datetime.now(timezone.utc)
    for c in raw_cards:
        card = Flashcard(
            deck_id=deck_id,
            user_id=current_user.id,
            front=c["front"],
            back=c["back"],
            hint=c.get("hint", ""),
            repetition=0,
            interval_days=1,
            ease_factor=2.5,
            due_date=now
        )
        db.add(card)
        created_cards.append(card)

    db.commit()
    for c in created_cards:
        db.refresh(c)

    return created_cards
