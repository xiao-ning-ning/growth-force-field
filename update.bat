@echo off
chcp 65001 >nul
title Update - Growth Force Field

echo ========================================
echo        Growth Force Field - Updating
echo ========================================
echo.
echo [1/5] Stopping server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/5] Backing up user data...
if exist "data" (
    xcopy /E /I /Y "data" "data_backup"
    echo Data backed up to data_backup
) else (
    echo No data folder found, skip backup.
)

echo [3/5] Downloading latest from GitHub...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/xiao-ning-ning/growth-force-field/archive/refs/heads/main.zip' -OutFile 'latest.zip'"
if errorlevel 1 (
    echo Download failed. Check network and try again.
    pause
    exit /b 1
)

echo [4/5] Extracting and updating...
powershell -Command "Expand-Archive -Force -Path 'latest.zip' -DestinationPath '.'"
xcopy /E /I /Y "growth-force-field-main" "." >nul 2>&1
rd /S /Q "growth-force-field-main" >nul 2>&1
del latest.zip >nul 2>&1

echo [5/5] Restoring user data...
if exist "data_backup" (
    xcopy /E /I /Y "data_backup" "data" >nul 2>&1
    rd /S /Q "data_backup" >nul 2>&1
    echo User data restored to data
) else (
    echo No backup found, skip restore.
)

echo.
echo ========================================
echo        Update Complete!
echo ========================================
echo.
echo Starting server...
start cmd /k "title Growth Force Field && node server/index.js --open"
pause