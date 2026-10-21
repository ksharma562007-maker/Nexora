import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import init_db
from app.routers import (
    auth, subjects, planner, timer, quizzes,
    flashcards, notes, exams, analytics, seed
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    init_db()
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown logic if any

app = FastAPI(
    title="Nexora | Smart Learning Platform",
    description=f"{settings.PROJECT_NAME} by {settings.CREATOR} — {settings.TAGLINE}",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(planner.router)
app.include_router(timer.router)
app.include_router(quizzes.router)
app.include_router(flashcards.router)
app.include_router(notes.router)
app.include_router(exams.router)
app.include_router(analytics.router)
app.include_router(seed.router)

@app.get("/api/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "creator": settings.CREATOR,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Production frontend static files serving if built
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/"):
            return {"error": "Not Found"}
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
