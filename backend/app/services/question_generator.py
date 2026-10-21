import re
import random
from typing import List, Dict, Any
from app.services.nlp_summarizer import split_sentences

DEFINITION_PATTERNS = [
    r'^(?:[-*•]\s*)?([A-Z][a-zA-Z0-9\s]{2,30})\s+(?:is defined as|refers to|is a type of|is an?)\s+([^.]+)',
    r'^(?:[-*•]\s*)?([A-Z][a-zA-Z0-9\s]{2,30}):\s+([^.]+)',
    r'^(?:[-*•]\s*)?([A-Za-z0-9\s]{2,30})\s+(?:means|signifies|represents)\s+([^.]+)'
]

def extract_term_definitions(text: str) -> List[Dict[str, str]]:
    """Extracts concept terms and their definitions from note text."""
    results = []
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    for line in lines:
        for pattern in DEFINITION_PATTERNS:
            match = re.search(pattern, line)
            if match:
                term = match.group(1).strip()
                definition = match.group(2).strip()
                if len(term) >= 3 and len(definition) >= 15:
                    results.append({
                        "term": term,
                        "definition": definition,
                        "source_line": line
                    })
                break

    # If few definitions found, extract sentences with strong keywords
    if len(results) < 3:
        sentences = split_sentences(text)
        for s in sentences:
            if " is " in s or " are " in s:
                parts = re.split(r'\s+is\s+|\s+are\s+', s, maxsplit=1)
                if len(parts) == 2 and 3 <= len(parts[0].strip()) <= 40 and len(parts[1].strip()) >= 20:
                    term = parts[0].strip()
                    # Clean markdown bullets
                    term = re.sub(r'^[-*#•\s]+', '', term)
                    if term and not term.lower().startswith(("there", "it", "this", "which", "what")):
                        results.append({
                            "term": term,
                            "definition": parts[1].strip().rstrip('.'),
                            "source_line": s
                        })
    return results

def generate_practice_questions(text: str, num_questions: int = 5) -> List[Dict[str, Any]]:
    """
    Generates authentic MCQ and True/False practice questions from note text.
    Uses real sentences and extracted definitions from the content.
    """
    pairs = extract_term_definitions(text)
    sentences = split_sentences(text)
    questions = []

    # 1. Generate MCQs from term definitions
    if len(pairs) >= 2:
        for idx, item in enumerate(pairs):
            if len(questions) >= num_questions:
                break
            correct_def = item["definition"]
            # Distractors from other terms or standard academic distractors
            other_defs = [p["definition"] for p in pairs if p["term"] != item["term"]]
            random.shuffle(other_defs)
            distractors = other_defs[:3]

            # If not enough distractors, add plausible variations
            while len(distractors) < 3:
                distractors.append(f"An unrelated auxiliary process not covered under {item['term']}.")

            options = [correct_def] + distractors
            random.shuffle(options)

            questions.append({
                "question_text": f"What is the definition or role of '{item['term']}' according to the material?",
                "question_type": "mcq",
                "options": options,
                "correct_answer": correct_def,
                "explanation": f"Source reference: {item['source_line']}",
                "points": 1
            })

    # 2. Generate True/False questions from key sentences
    for idx, sentence in enumerate(sentences):
        if len(questions) >= num_questions:
            break
        if len(sentence) < 30 or len(sentence) > 160:
            continue
        
        # Decide if True or inverted
        is_true = (len(questions) % 2 == 0)
        if is_true:
            q_text = f"True or False: {sentence}"
            ans = "True"
            explanation = f"Correct. The text explicitly states: \"{sentence}\""
        else:
            # Create a negation
            altered = re.sub(r'\b(is|are|can|will|should)\b', r'\1 NOT', sentence, count=1)
            if altered == sentence:
                altered = f"It is never the case that {sentence[0].lower() + sentence[1:]}"
            q_text = f"True or False: {altered}"
            ans = "False"
            explanation = f"False. The original material states: \"{sentence}\""

        questions.append({
            "question_text": q_text,
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answer": ans,
            "explanation": explanation,
            "points": 1
        })

    # Fallback if text was very short
    if not questions and sentences:
        s = sentences[0]
        questions.append({
            "question_text": f"True or False: {s}",
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "True",
            "explanation": f"Verified from document: {s}",
            "points": 1
        })

    return questions[:num_questions]

def generate_flashcards_from_text(text: str, max_cards: int = 10) -> List[Dict[str, str]]:
    """
    Extracts terms and definitions into study flashcards.
    """
    pairs = extract_term_definitions(text)
    cards = []

    for item in pairs:
        cards.append({
            "front": f"What is {item['term']}?",
            "back": item["definition"],
            "hint": f"Key concept related to {item['term'][:15]}..."
        })
        if len(cards) >= max_cards:
            break

    # If fewer than 4 cards, convert prominent sentences
    if len(cards) < 4:
        sentences = split_sentences(text)
        for s in sentences:
            if len(cards) >= max_cards:
                break
            if len(s) > 35:
                # Use first half as prompt, second half as recall
                words = s.split()
                mid = len(words) // 2
                cards.append({
                    "front": f"Complete the concept: {' '.join(words[:mid])} ...",
                    "back": f"... {' '.join(words[mid:])}",
                    "hint": "Recall the study note text"
                })

    return cards[:max_cards]
