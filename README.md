# NEXORA — BY PARMANAND SHARMA

> **“Learn Smarter. Grow Faster.”**  
> *A Smart Adaptive Learning Platform engineered for peak academic retention, distraction-free focus, and actionable learning analytics.*

---

## 🌟 Executive Summary

**Nexora** is a complete, production-grade, full-stack educational SaaS platform architected by **Parmanand Sharma**. Built with high-performance Python (FastAPI) and a modern, responsive React + TypeScript interface, Nexora empowers students to structure complex curricula, practice adaptive assessments, retain concepts via spaced repetition, plan study schedules using heuristic constraint algorithms, and extract answers directly from lecture notes and PDFs.

Nexora is designed with **zero external API dependencies** by default: its extractive text summarizer, cited document Q&A engine, spaced repetition scheduler, and task priority algorithms run entirely locally.

---

## 🚀 Key Architectural Modules

### 1. Personalized Telemetry Dashboard
* **Dynamic Welcome & Streaks:** Tracks consecutive daily focus activity and displays personalized greetings.
* **Real Database Metrics:** Real-time counters for due flashcards, upcoming exams, weekly study time, and overall curriculum mastery.
* **First-Time User Onboarding:** Automatically detects empty user accounts and presents an interactive onboarding screen with an option to load a realistic sample curriculum.
* **Weekly Focus Chart:** Visualizes daily study minutes using interactive Recharts graphs.

### 2. Subjects & Topics Curriculum Hierarchy
* **Full CRUD Operations:** Create, edit, and categorize courses and topics.
* **Granular Confidence & Mastery:** 5-star confidence ratings and automated mastery percentages that update dynamically as quizzes and flashcards are completed.
* **Strict User Isolation:** Multi-tenant architecture guarantees users access only their own academic records.

### 3. Smart Study Planner
* **Heuristic Recommendation Algorithm:** Dynamically calculates study priority based on:
  * Exam proximity (imminent exams within 3–7 days)
  * Identified weak topics (confidence $\le 2$ or mastery $< 50\%$)
  * Task urgency and deadlines
* **Conflict & Overbooking Detection:** Flags days where scheduled task durations exceed the student's daily study capacity (e.g. overbooked by 45 minutes).
* **Transparent Reasoning:** Displays plain-language explanations for every recommendation (e.g., *“Due in 1 day • Upcoming: 'Algorithms Midterm' in 5d • Low mastery in topic (42%)”*).

### 4. Deep Focus Studio (Pomodoro Timer)
* **Customizable Modes:** Standard Pomodoro (25m), Short Break (5m), Long Break (15m), or open Stopwatch.
* **Course & Task Linkage:** Directly associates focus sessions with specific subjects or study planner tasks to increment actual logged minutes.
* **Zero-Dependency Web Audio Synthesizer:** Built-in audio chime notifications using HTML5 Web Audio API (no external MP3/WAV assets required).
* **State Preservation:** Synchronizes timer state with browser storage so accidental refreshes never interrupt a focus block.

### 5. Quizzes & Assessments
* **Multi-Format Questions:** Multiple Choice (MCQ), True/False, and Short Answer with automatic whitespace & keyword normalization.
* **Authentic Grading Logic:** Computes raw scores, percentages, and pass/fail statuses against configurable thresholds.
* **Explanations & Weak Topic Identification:** Delivers immediate question-by-question explanations and logs identified knowledge gaps for targeted revision.
* **Auto-Generation:** Extracts practice assessments directly from study notes and uploaded PDFs.

### 6. Spaced Repetition Flashcards (SuperMemo SM-2)
* **Mathematically Documented Algorithm:** Implements the SuperMemo SM-2 spaced repetition formula:
  $$\text{Interval}_{new} = \text{Interval}_{prev} \times \text{Ease Factor}$$
* **4-Point Recall Rating Scale:**
  1. *Again* (Reset repetition, review tomorrow)
  2. *Hard* (1.2x interval scaling, slight ease penalty)
  3. *Good* (Standard progression: 1d $\rightarrow$ 6d $\rightarrow$ $I \times EF$)
  4. *Easy* (Bonus multiplier $+15\%$ ease boost)
* **Interactive 3D Flip Card:** Realistic flip animation with optional recall hints.

### 7. Notes & PDF Assistant
* **Markdown Support:** Full-featured note-taking canvas with tags and pinning.
* **PDF Text Extraction:** Parses uploaded PDFs using pure-Python `pypdf` with file type validation (max 10MB) and scanned/image-only PDF detection.
* **Pure-Python Local Extractive Summarizer:** Scores sentences using TF-IDF word frequency, position weights, and length normalization.
* **Cited Document Q&A Engine:** Locates semantic matches in documents and cites verbatim source excerpts with confidence ratings.

### 8. Exams, Goals & Performance Analytics
* **Exam Countdowns:** Live day counters with weight percentages and target scores.
* **Milestone Study Goals:** Real-time progress bars for study hours, cards reviewed, and quizzes passed.
* **Deep Analytics:** 14-day study progression curves, planned vs. actual study minutes comparison, and historical quiz accuracy progression.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Icons & Charts** | Lucide React, Recharts, Canvas Confetti |
| **Audio** | HTML5 Web Audio API (Synthesizer) |
| **Backend** | Python 3.10–3.14, FastAPI, Pydantic v2 |
| **Database** | SQLAlchemy 2.0 (SQLite for local, PostgreSQL ready) |
| **Authentication** | BCrypt password hashing, PyJWT (JSON Web Tokens) |
| **Document Processing**| PyPDF, Pure-Python TF-IDF Local NLP |
| **Testing** | Pytest, HTTPX TestClient |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## ⚙️ Quickstart Local Setup

### Prerequisites
* **Node.js** (v18+) & **npm**
* **Python** (v3.10+)

### 1. Clone & Setup Workspace
```bash
git clone <repository_url> nexora
cd nexora
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will run at `http://127.0.0.1:8000` (Swagger docs available at `http://127.0.0.1:8000/docs`).*

### 3. Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
*Frontend will run at `http://localhost:5173`.*

---

## 🧪 Automated Testing

### Backend Unit & Integration Tests (Pytest)
```bash
cd backend
.\venv\Scripts\pytest -v
```
**Test Coverage:**
- `test_health_check`: Verifies system metadata and creator attribution.
- `test_registration_and_login`: Tests BCrypt hashing, JWT issuance, and authentication.
- `test_user_data_isolation`: Verifies that User B cannot access or modify User A's private subjects.
- `test_quiz_grading_and_history`: Validates MCQ/True-False grading logic and weak topic extraction.
- `test_sm2_algorithm_progression`: Validates SM-2 interval calculations and ease factor scaling.
- `test_nlp_extractive_summarizer`: Tests local sentence ranking and key point extraction.
- `test_answer_document_query`: Tests cited passage retrieval and keyword matching.
- `test_question_generator_from_notes`: Tests auto-generation of questions and flashcards.
- `test_scheduler_conflict_detection`: Tests capacity overbooking alerts.

### End-to-End Workflow Verification
```bash
python backend/tests/verify_e2e.py
```

### Frontend Typecheck & Production Build
```bash
cd frontend
npm run build
```

---

## 🌐 Public Cloud Deployment Guide

Nexora is built for frictionless deployment across modern cloud providers:

### Option A: Free-Tier Deployment (Render / Railway / Fly.io)

#### Backend Deployment (Render Web Service)
1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com) and create a **New Web Service**.
3. Select your repository and set:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, configure:
   - `DATABASE_URL`: Provide a managed PostgreSQL database URL (or use default SQLite for light usage)
   - `JWT_SECRET`: A secure 64-character random string
   - `ENVIRONMENT`: `production`
   - `CORS_ORIGINS`: `["https://your-frontend.vercel.app"]`
5. Click **Create Web Service** to obtain your public backend URL (e.g., `https://nexora-api.onrender.com`).

#### Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com) and import your repository.
2. Set **Root Directory** to `frontend`.
3. In **Environment Variables**, set:
   - `VITE_API_BASE_URL`: `https://nexora-api.onrender.com/api`
4. Click **Deploy**. Vercel will build and assign a public HTTPS URL (e.g., `https://nexora.vercel.app`).

### Option B: Docker Compose Deployment (Single VPS / Cloud Server)
```bash
# Build and run containers
docker-compose up --build -d
```
This runs:
- `backend` on port `8000`
- `frontend` with optimized Nginx reverse proxy on port `80`

### Option C: Custom Domain Setup
1. In your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy), create a `CNAME` record:
   - **Type:** `CNAME`
   - **Host:** `@` or `app`
   - **Target:** Your Vercel or Render deployment domain (e.g., `cname.vercel-dns.com`)
2. In your hosting dashboard, add your custom domain.
3. Automated SSL/TLS certificates will be provisioned automatically within minutes.

---

## 🔒 Security & Data Privacy

* **Zero Data Leakage:** Extractive summarization and document Q&A run on pure-Python algorithms without transmitting student notes to third-party AI APIs.
* **Cryptographic Password Hashing:** Salted hashes generated via `bcrypt`.
* **Stateless Authentication:** Cryptographically signed JWT tokens with standard expiration.
* **Strict Tenant Isolation:** Every database query filters by `user_id == current_user.id` to prevent cross-account data leaks.
* **Upload Validation:** Strict MIME type checking and file size limits (10MB max).

---

## 👤 Project Credits

* **Website Name:** Nexora
* **Tagline:** “Learn Smarter. Grow Faster.”
* **Architect & Developer:** **Parmanand Sharma**
* **License:** MIT License
