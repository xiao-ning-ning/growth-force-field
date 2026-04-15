@echo off
chcp 65001 >nul 2>nul
title 成长力场 - Growth Force Field
echo.
echo  ╔══════════════════════════════════╗
echo  ║      成长力场 Growth Force Field ║
echo  ╚══════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Check if port 3000 is already in use
netstat -aon | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo  [!] 端口 3000 已被占用，正在释放...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>nul
    )
    timeout /t 1 /nobreak >nul
    echo  [v] 端口已释放
    echo.
)

echo  正在启动服务...
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo  首次运行，安装依赖中...
    call npm install --production
    echo.
)

:: Start the server
node server\index.js --open

echo.
echo  服务已停止。
pause
