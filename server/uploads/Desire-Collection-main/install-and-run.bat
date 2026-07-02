@echo off
cd /d "C:\Users\VARSHINI\Downloads\Desire-Collection-main"

echo Installing frontend dependencies...
cd frontend
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo npm install failed
    exit /b 1
)

echo.
echo ====================================
echo Starting Desire-Collection Servers
echo ====================================
echo.

REM Start the frontend in a new window
echo Starting frontend development server on http://localhost:3000
start "Desire-Collection Frontend" cmd /k "npm start"

REM Note: Backend requires Python which is not installed
REM echo Backend would need Python 3.8+ and dependencies from requirements.txt
echo.
echo Frontend started! Visit http://localhost:3000 in your browser.
echo.
pause
