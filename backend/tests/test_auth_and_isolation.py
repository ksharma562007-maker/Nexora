import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

TEST_DB_FILE = "test_nexora_temp.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///./{TEST_DB_FILE}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    # Teardown: close and remove file
    try:
        engine.dispose()
        if os.path.exists(TEST_DB_FILE):
            os.remove(TEST_DB_FILE)
    except Exception:
        pass

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "Nexora"
    assert data["creator"] == "Parmanand Sharma"
    assert data["tagline"] == "Learn Smarter. Grow Faster."

def test_registration_and_login():
    reg_payload = {
        "email": "student@nexora.io",
        "username": "parmanand_learner",
        "full_name": "Parmanand Sharma",
        "password": "Password123!"
    }
    r = client.post("/api/auth/register", json=reg_payload)
    assert r.status_code == 201
    reg_data = r.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "student@nexora.io"

    # Login
    login_payload = {
        "email": "student@nexora.io",
        "password": "Password123!"
    }
    l = client.post("/api/auth/login", json=login_payload)
    assert l.status_code == 200
    token = l.json()["access_token"]

    # Profile me
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["username"] == "parmanand_learner"

def test_user_data_isolation():
    # User A
    client.post("/api/auth/register", json={
        "email": "usera@nexora.io",
        "username": "user_a",
        "full_name": "User Alpha",
        "password": "SecretPassword123!"
    })
    token_a = client.post("/api/auth/login", json={"email": "usera@nexora.io", "password": "SecretPassword123!"}).json()["access_token"]

    # User B
    client.post("/api/auth/register", json={
        "email": "userb@nexora.io",
        "username": "user_b",
        "full_name": "User Beta",
        "password": "SecretPassword123!"
    })
    token_b = client.post("/api/auth/login", json={"email": "userb@nexora.io", "password": "SecretPassword123!"}).json()["access_token"]

    # User A creates a private subject
    subj_res = client.post(
        "/api/subjects",
        json={"name": "Alpha Private Subject", "code": "ALPHA101", "description": "Top secret"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert subj_res.status_code == 201
    subj_a_id = subj_res.json()["id"]

    # User B lists subjects -> should NOT see User A's subject
    b_subjects = client.get("/api/subjects", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert all(s["id"] != subj_a_id for s in b_subjects)

    # User B tries to get or delete User A's subject directly -> 404
    b_get = client.get(f"/api/subjects/{subj_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert b_get.status_code == 404

    b_del = client.delete(f"/api/subjects/{subj_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert b_del.status_code == 404

def test_quiz_grading_and_history():
    token = client.post("/api/auth/login", json={"email": "student@nexora.io", "password": "Password123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create quiz
    q_create = client.post("/api/quizzes", json={
        "title": "Algorithms Test",
        "description": "Binary search and asymptotic notation",
        "passing_score": 70,
        "questions": [
            {
                "question_text": "What is the time complexity of Binary Search?",
                "question_type": "mcq",
                "options": ["O(1)", "O(log n)", "O(n)"],
                "correct_answer": "O(log n)",
                "points": 1
            },
            {
                "question_text": "True or False: Hash table lookups are always O(n).",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "False",
                "points": 1
            }
        ]
    }, headers=headers)
    assert q_create.status_code == 201
    quiz_id = q_create.json()["id"]

    # Fetch quiz
    q_detail = client.get(f"/api/quizzes/{quiz_id}", headers=headers).json()
    q1_id = q_detail["questions"][0]["id"]
    q2_id = q_detail["questions"][1]["id"]

    # Submit quiz (1 correct, 1 incorrect)
    sub_res = client.post(f"/api/quizzes/{quiz_id}/submit", json={
        "answers": {
            str(q1_id): "O(log n)",
            str(q2_id): "True" # wrong answer
        }
    }, headers=headers)
    assert sub_res.status_code == 200
    attempt = sub_res.json()
    assert attempt["score"] == 1.0
    assert attempt["max_score"] == 2.0
    assert attempt["percentage"] == 50.0
    assert attempt["passed"] is False
    assert len(attempt["results"]) == 2
    assert attempt["results"][0]["is_correct"] is True
    assert attempt["results"][1]["is_correct"] is False

def test_google_auth():
    payload = {
        "email": "parmanand.google@gmail.com",
        "full_name": "Parmanand Google User"
    }
    # First sign in (creates user)
    res = client.post("/api/auth/google", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "parmanand.google@gmail.com"
    assert data["user"]["full_name"] == "Parmanand Google User"

    # Second sign in (logs into existing user)
    res2 = client.post("/api/auth/google", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["user"]["id"] == data["user"]["id"]

