@echo off
echo ===================================================
echo   Starting YogaCorrector AI 2.0 Backend & Frontend
echo ===================================================

echo Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "YogaCorrector Backend" cmd /k "..\.venv\Scripts\python.exe run.py"

echo Starting Next.js Frontend on http://localhost:3000 ...
cd frontend
cmd /k "npm run dev"
