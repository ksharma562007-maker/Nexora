import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    User, Subject, Topic, StudyTask, FocusSession,
    Quiz, QuizQuestion, QuizAttempt, FlashcardDeck, Flashcard,
    Note, Exam, Goal
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/seed", tags=["seed"])

@router.post("", status_code=status.HTTP_201_CREATED)
def seed_sample_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Populates comprehensive, realistic sample academic data for the logged-in user
    so they can explore all features of Nexora immediately.
    """
    now = datetime.now(timezone.utc)
    today = now.date()

    # 1. Subjects
    subj_dsa = Subject(
        user_id=current_user.id,
        name="Data Structures & Algorithms",
        code="CS201",
        description="Foundational computer science topics: trees, graphs, sorting, and dynamic programming.",
        color="#6366F1",
        icon="Code",
        target_hours=35.0
    )
    subj_ai = Subject(
        user_id=current_user.id,
        name="Machine Learning & Deep Learning",
        code="AI301",
        description="Supervised learning, neural networks, backpropagation, and transformer models.",
        color="#8B5CF6",
        icon="Cpu",
        target_hours=40.0
    )
    subj_os = Subject(
        user_id=current_user.id,
        name="Operating Systems & Architecture",
        code="CS204",
        description="Processes, threads, synchronization primitives, memory management, and file systems.",
        color="#EC4899",
        icon="Layers",
        target_hours=25.0
    )
    db.add_all([subj_dsa, subj_ai, subj_os])
    db.commit()
    db.refresh(subj_dsa)
    db.refresh(subj_ai)
    db.refresh(subj_os)

    # 2. Topics
    top_bst = Topic(
        user_id=current_user.id, subject_id=subj_dsa.id,
        title="Binary Search Trees & AVL",
        description="Balanced search trees, tree rotations, logarithmic lookup and insertion guarantees.",
        priority="medium", confidence_level=4, mastery_score=85.0, status="mastered"
    )
    top_graphs = Topic(
        user_id=current_user.id, subject_id=subj_dsa.id,
        title="Graph Algorithms & Shortest Path",
        description="Breadth-First Search, Depth-First Search, Dijkstra's algorithm, and topological sorting.",
        priority="high", confidence_level=2, mastery_score=42.0, status="in_progress"
    )
    top_dp = Topic(
        user_id=current_user.id, subject_id=subj_dsa.id,
        title="Dynamic Programming Patterns",
        description="Optimal substructure, overlapping subproblems, memoization, and tabulation techniques.",
        priority="high", confidence_level=3, mastery_score=60.0, status="in_progress"
    )
    top_grad = Topic(
        user_id=current_user.id, subject_id=subj_ai.id,
        title="Gradient Descent & Backprop",
        description="Optimization algorithms, stochastic gradient descent, learning rate schedules, and momentum.",
        priority="medium", confidence_level=5, mastery_score=92.0, status="mastered"
    )
    top_trans = Topic(
        user_id=current_user.id, subject_id=subj_ai.id,
        title="Transformers & Self-Attention",
        description="Scaled dot-product attention, multi-head projections, positional encoding, and encoder-decoder stacks.",
        priority="high", confidence_level=2, mastery_score=38.0, status="in_progress"
    )
    top_sync = Topic(
        user_id=current_user.id, subject_id=subj_os.id,
        title="Process Synchronization & Mutexes",
        description="Critical sections, semaphores, race conditions, deadlock conditions, and monitors.",
        priority="medium", confidence_level=3, mastery_score=55.0, status="in_progress"
    )
    db.add_all([top_bst, top_graphs, top_dp, top_grad, top_trans, top_sync])
    db.commit()
    db.refresh(top_bst)
    db.refresh(top_graphs)
    db.refresh(top_trans)

    # 3. Rich Markdown Notes
    note_ai = Note(
        user_id=current_user.id,
        subject_id=subj_ai.id,
        topic_id=top_trans.id,
        title="Self-Attention and the Transformer Architecture",
        content="""# Self-Attention and the Transformer Architecture

The Transformer architecture, introduced by Vaswani et al. in 'Attention Is All You Need' (2017), replaced recurrent networks in natural language processing.

### Core Concepts

* **Self-Attention** is defined as an attention mechanism relating different positions of a single sequence to compute a representation of the sequence.
* **Scaled Dot-Product Attention** computes attention weights using queries (Q), keys (K), and values (V) according to the formula: Softmax(Q * K^T / sqrt(d_k)) * V.
* **Multi-Head Attention** allows the model to jointly attend to information from different representation subspaces at different positions.
* **Positional Encoding** injects information about the relative or absolute position of tokens in the sequence since the architecture contains no recurrence.
* **Feed-Forward Networks** apply two linear transformations with a ReLU or GELU activation in between to each position separately and identically.

### Why Attention Outperforms RNNs
1. **Parallelization**: Transformers process entire sequences simultaneously rather than sequentially step-by-step.
2. **Path Length**: Maximum path length between any two tokens is O(1), preventing vanishing gradient bottlenecks over long contexts.
""",
        summary="The Transformer architecture relies on self-attention mechanisms to relate different sequence positions simultaneously. Key components include Scaled Dot-Product Attention, Multi-Head projections, and Positional Encodings to replace recurrent models.",
        tags="Deep Learning, NLP, Transformers",
        is_pinned=True
    )

    note_dsa = Note(
        user_id=current_user.id,
        subject_id=subj_dsa.id,
        topic_id=top_bst.id,
        title="Binary Search Trees and Balanced AVL Trees",
        content="""# Binary Search Trees and Balanced AVL Trees

A Binary Search Tree (BST) is a hierarchical node-based data structure where each node has at most two children.

### Fundamental Properties
* For any node N, every node in N's left subtree has a key strictly less than N.key.
* Every node in N's right subtree has a key strictly greater than N.key.
* **AVL Tree** is a self-balancing binary search tree where the difference between heights of left and right subtrees (the balance factor) cannot exceed 1.
* **Tree Rotation** is defined as an operation on a binary search tree that changes the structure without altering the in-order sequence of elements.
* Average time complexity for search, insertion, and deletion in a balanced BST is O(log n).
""",
        summary="A Binary Search Tree maintains keys where left children are strictly smaller and right children strictly larger. AVL trees self-balance via tree rotations to guarantee O(log n) time complexity.",
        tags="Data Structures, Trees, Algorithms",
        is_pinned=False
    )
    db.add_all([note_ai, note_dsa])
    db.commit()

    # 4. Flashcard Decks & Cards
    deck_ai = FlashcardDeck(
        user_id=current_user.id,
        subject_id=subj_ai.id,
        topic_id=top_trans.id,
        title="Transformers & Deep Learning Concepts",
        description="High-yield flashcards covering attention mechanisms, vectors, and embeddings.",
        color="#8B5CF6"
    )
    deck_dsa = FlashcardDeck(
        user_id=current_user.id,
        subject_id=subj_dsa.id,
        topic_id=top_graphs.id,
        title="Graph Algorithms & Complexities",
        description="Big-O runtimes and algorithm characteristics.",
        color="#6366F1"
    )
    db.add_all([deck_ai, deck_dsa])
    db.commit()
    db.refresh(deck_ai)
    db.refresh(deck_dsa)

    card1 = Flashcard(
        deck_id=deck_ai.id, user_id=current_user.id,
        front="What is Scaled Dot-Product Attention formula?",
        back="Attention(Q, K, V) = Softmax(Q * K^T / sqrt(d_k)) * V",
        hint="Involves Queries, Keys, and Values scaled by dimension",
        repetition=1, interval_days=1, ease_factor=2.5,
        due_date=now - timedelta(hours=2) # Due for review!
    )
    card2 = Flashcard(
        deck_id=deck_ai.id, user_id=current_user.id,
        front="Why are Positional Encodings required in Transformers?",
        back="Because Transformers lack recurrence and process all tokens simultaneously; positional encodings provide word order information.",
        hint="Think about order invariance...",
        repetition=2, interval_days=3, ease_factor=2.6,
        due_date=now + timedelta(days=2)
    )
    card3 = Flashcard(
        deck_id=deck_ai.id, user_id=current_user.id,
        front="What is the computational complexity of standard self-attention with sequence length N?",
        back="O(N^2) in both time and memory due to the full N x N attention matrix.",
        hint="Quadratic scaling with token count",
        repetition=0, interval_days=1, ease_factor=2.5,
        due_date=now - timedelta(hours=5) # Due!
    )
    card4 = Flashcard(
        deck_id=deck_dsa.id, user_id=current_user.id,
        front="What is the time complexity of Dijkstra's algorithm with a min-priority queue?",
        back="O((V + E) log V) where V is vertices and E is edges.",
        hint="Vertices plus edges logarithmic factor",
        repetition=1, interval_days=2, ease_factor=2.4,
        due_date=now - timedelta(hours=1) # Due!
    )
    db.add_all([card1, card2, card3, card4])
    db.commit()

    # 5. Quiz with Questions & Attempt
    quiz_dsa = Quiz(
        user_id=current_user.id,
        subject_id=subj_dsa.id,
        topic_id=top_bst.id,
        title="Data Structures Checkpoint: Trees & Graphs",
        description="Comprehensive evaluation of binary tree mechanics and graph traversal principles.",
        time_limit_minutes=15,
        passing_score=70
    )
    db.add(quiz_dsa)
    db.commit()
    db.refresh(quiz_dsa)

    q1 = QuizQuestion(
        quiz_id=quiz_dsa.id,
        question_text="What is the worst-case time complexity of searching in an unbalanced Binary Search Tree?",
        question_type="mcq",
        options_json=json.dumps(["O(1)", "O(log n)", "O(n)", "O(n log n)"]),
        correct_answer="O(n)",
        explanation="In a skewed degenerate tree (like a linked list), searching every node requires O(n) operations.",
        points=1
    )
    q2 = QuizQuestion(
        quiz_id=quiz_dsa.id,
        question_text="True or False: In an AVL tree, the balance factor of every node must be either -1, 0, or 1.",
        question_type="true_false",
        options_json=json.dumps(["True", "False"]),
        correct_answer="True",
        explanation="Correct! By definition, an AVL tree requires the height difference between left and right subtrees to not exceed 1.",
        points=1
    )
    q3 = QuizQuestion(
        quiz_id=quiz_dsa.id,
        question_text="Which graph traversal algorithm uses a First-In-First-Out (FIFO) queue?",
        question_type="mcq",
        options_json=json.dumps(["Depth-First Search", "Breadth-First Search", "Kruskal's Algorithm", "Floyd-Warshall"]),
        correct_answer="Breadth-First Search",
        explanation="Breadth-First Search (BFS) explores layer-by-layer using a FIFO queue.",
        points=1
    )
    db.add_all([q1, q2, q3])
    db.commit()

    # Quiz attempt
    attempt = QuizAttempt(
        quiz_id=quiz_dsa.id,
        user_id=current_user.id,
        score=2.0,
        max_score=3.0,
        percentage=66.7,
        passed=False,
        answers_json=json.dumps({str(q1.id): "O(n)", str(q2.id): "True", str(q3.id): "Depth-First Search"}),
        weak_topics_json=json.dumps(["Breadth-First Search queue mechanics"]),
        completed_at=now - timedelta(days=1)
    )
    db.add(attempt)
    db.commit()

    # 6. Study Tasks
    task1 = StudyTask(
        user_id=current_user.id,
        subject_id=subj_dsa.id,
        topic_id=top_graphs.id,
        title="Implement Dijkstra's Algorithm with Min-Heap in Python",
        description="Code the shortest path algorithm from scratch and test with adjacency list representations.",
        priority="urgent",
        estimated_minutes=45,
        actual_minutes=0,
        due_date=now + timedelta(days=1),
        scheduled_date=today,
        status="pending",
        recommendation_reason="Urgent priority • Subject exam in 5 days • Low mastery in topic (42%)"
    )
    task2 = StudyTask(
        user_id=current_user.id,
        subject_id=subj_ai.id,
        topic_id=top_trans.id,
        title="Walk through Scaled Dot-Product Attention derivation",
        description="Verify Q, K, V dimensions and write down why sqrt(d_k) prevents small softmax gradients.",
        priority="high",
        estimated_minutes=35,
        actual_minutes=0,
        due_date=now + timedelta(days=3),
        scheduled_date=today,
        status="pending",
        recommendation_reason="High priority • Due in 3 days • Low mastery in topic (38%)"
    )
    task3 = StudyTask(
        user_id=current_user.id,
        subject_id=subj_os.id,
        topic_id=top_sync.id,
        title="Solve Producer-Consumer problem using Semaphores",
        description="Review critical sections and prevent race condition deadlocks.",
        priority="medium",
        estimated_minutes=30,
        actual_minutes=30,
        due_date=now - timedelta(days=1),
        scheduled_date=today - timedelta(days=1),
        status="completed",
        completed_at=now - timedelta(days=1),
        recommendation_reason="Completed yesterday"
    )
    db.add_all([task1, task2, task3])
    db.commit()

    # 7. Focus Sessions across past 5 days
    for days_ago, mins in [(4, 45), (3, 60), (2, 50), (1, 75), (0, 35)]:
        s_date = now - timedelta(days=days_ago)
        sess = FocusSession(
            user_id=current_user.id,
            subject_id=subj_dsa.id if days_ago % 2 == 0 else subj_ai.id,
            duration_seconds=mins * 60,
            focus_mode="pomodoro",
            completed=True,
            notes=f"Deep work study session - {mins} minutes",
            started_at=s_date - timedelta(minutes=mins),
            ended_at=s_date
        )
        db.add(sess)
    db.commit()

    # 8. Upcoming Exam
    exam1 = Exam(
        user_id=current_user.id,
        subject_id=subj_dsa.id,
        title="Algorithms & Complexity Midterm Exam",
        exam_date=now + timedelta(days=5),
        target_score=95.0,
        location="Hall C, Computer Science Building",
        notes="Covers asymptotic notation, BSTs, AVL rotations, graph traversal, and Dijkstra.",
        weight_percentage=30.0,
        is_completed=False
    )
    db.add(exam1)

    # 9. Study Goals
    goal1 = Goal(
        user_id=current_user.id,
        title="Accumulate 10 Hours of Deep Focus This Week",
        category="study_hours",
        target_value=10.0,
        current_value=4.4,
        unit="hours",
        deadline=now + timedelta(days=3),
        is_completed=False
    )
    goal2 = Goal(
        user_id=current_user.id,
        title="Review 20 Spaced Repetition Cards",
        category="cards_reviewed",
        target_value=20.0,
        current_value=14.0,
        unit="cards",
        deadline=now + timedelta(days=2),
        is_completed=False
    )
    db.add_all([exam1, goal1, goal2])
    db.commit()

    return {"message": "Sample educational data seeded successfully! All features are ready to explore."}
