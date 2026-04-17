@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Growth Force Field

echo.
echo ========================================
echo        Growth Force Field
echo ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 未检测到 Node.js，正在安装...
    winget install OpenJS.NodeJS.LTS --accept-source --accept-package-agreements >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Node.js 安装完成，请重新双击 start.bat
    ) else (
        echo [ERROR] 自动安装失败，请访问 https://nodejs.org 手动安装
    )
    pause
    exit /b
)

if not exist "node_modules" (
    echo [i] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 依赖安装失败
        pause
        exit /b
    )
)

node server\index.js --open
pause
