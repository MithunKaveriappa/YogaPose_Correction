@echo off
echo ===================================================
echo   Stopping YogaCorrector Backend and Frontend Servers
echo ===================================================

echo Stopping all Python backend processes...
taskkill /F /IM python.exe /T 2>nul

echo Stopping all Node.js frontend processes...
taskkill /F /IM node.exe /T 2>nul

echo ===================================================
echo   All background servers have been stopped.
echo ===================================================
