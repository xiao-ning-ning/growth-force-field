@echo off
cd /d "%~dp0"

:: Check if port 3000 is in use, kill the process if so
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Port 3000 in use, killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

node server\index.js --open
