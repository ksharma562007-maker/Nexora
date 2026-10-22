@echo off
title Nexora Full Stack Launcher
echo ========================================================
echo   Starting Nexora Smart Learning (Backend + Frontend)
echo ========================================================

echo 1. Starting FastAPI Backend on http://127.0.0.1:8000...
start "Nexora Backend (FastAPI)" powershell -NoExit -Command "cd backend; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo 2. Starting Vite Frontend on http://localhost:8080...
start "Nexora Frontend (Vite)" powershell -NoExit -Command "cd frontend; npm run dev"

echo.
echo ========================================================
echo   Services are running!
echo   Frontend: http://localhost:8080
echo   Backend:  http://127.0.0.1:8000/docs
echo ========================================================
