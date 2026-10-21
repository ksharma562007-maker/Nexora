import pytest
from app.services.spaced_repetition import calculate_sm2
from app.services.nlp_summarizer import generate_extractive_summary, answer_document_query
from app.services.question_generator import extract_term_definitions, generate_practice_questions, generate_flashcards_from_text
from app.services.scheduler import detect_schedule_conflicts
from app.models import StudyTask
from datetime import date

def test_sm2_algorithm_progression():
    # Test Good rating (3) from initial state
    rep, interval, ease, due = calculate_sm2(rating=3, repetition=0, interval_days=1, ease_factor=2.5)
    assert rep == 1
    assert interval == 1
    assert ease == 2.5

    # Second Good review
    rep2, interval2, ease2, _ = calculate_sm2(rating=3, repetition=rep, interval_days=interval, ease_factor=ease)
    assert rep2 == 2
    assert interval2 == 6

    # Easy rating (4) bonus
    rep_easy, interval_easy, ease_easy, _ = calculate_sm2(rating=4, repetition=2, interval_days=6, ease_factor=2.5)
    assert rep_easy == 3
    assert interval_easy > 6
    assert ease_easy > 2.5

    # Failed recall (1) resets repetition count and interval
    rep_fail, interval_fail, ease_fail, _ = calculate_sm2(rating=1, repetition=4, interval_days=20, ease_factor=2.6)
    assert rep_fail == 0
    assert interval_fail == 1
    assert ease_fail < 2.6

def test_nlp_extractive_summarizer():
    sample_text = """
    Artificial Intelligence is transforming modern engineering disciplines and education.
    Machine Learning algorithms identify patterns in large datasets to make predictive inferences.
    Deep neural networks utilize backpropagation and gradient descent to optimize complex non-linear functions.
    Supervised learning requires ground-truth labels for each input observation during model training.
    Unsupervised learning discovers latent clustering structures without explicit supervisory targets.
    """
    summary_res = generate_extractive_summary(sample_text, max_sentences=2)
    assert len(summary_res["key_points"]) <= 2
    assert summary_res["word_count"] > 20
    assert len(summary_res["summary"]) > 30

def test_answer_document_query():
    doc_text = """
    A Binary Search Tree (BST) is a hierarchical node-based data structure where each node has at most two children.
    Every node in a BST satisfies the binary search property where left subtree keys are smaller than root key.
    AVL trees are self-balancing binary search trees that maintain logarithmic height guarantees.
    """
    # Specific query
    res = answer_document_query(doc_text, "What is an AVL tree?")
    assert "AVL trees are self-balancing" in res["answer"]
    assert len(res["cited_snippets"]) > 0
    assert res["confidence"] > 0.0

    # Query with no match
    no_match = answer_document_query(doc_text, "quantum entanglement teleportation photons")
    assert "No direct matching content" in no_match["answer"]
    assert no_match["confidence"] == 0.0

def test_question_generator_from_notes():
    text = """
    - Gradient Descent is defined as an optimization algorithm for finding the minimum of a differentiable function.
    - Learning Rate refers to a hyperparameter that controls how much to change the model in response to the estimated error each time the model weights are updated.
    - Overfitting is a condition where a statistical model begins to memorize noise instead of underlying distribution.
    """
    questions = generate_practice_questions(text, num_questions=3)
    assert len(questions) >= 1
    q = questions[0]
    assert "question_text" in q
    assert "correct_answer" in q
    assert len(q["options"]) >= 2

    flashcards = generate_flashcards_from_text(text, max_cards=3)
    assert len(flashcards) >= 1
    assert "front" in flashcards[0]
    assert "back" in flashcards[0]

def test_scheduler_conflict_detection():
    today = date.today()
    t1 = StudyTask(id=1, user_id=1, title="Task 1", estimated_minutes=90, scheduled_date=today, status="pending")
    t2 = StudyTask(id=2, user_id=1, title="Task 2", estimated_minutes=60, scheduled_date=today, status="pending")

    conflicts = detect_schedule_conflicts([t1, t2], daily_capacity_minutes=120)
    # Total minutes = 150 > capacity 120
    assert len(conflicts["conflicts"]) == 1
    assert conflicts["conflicts"][0]["overbooked_by"] == 30
