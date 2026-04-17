@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Growth Force Field

echo.
echo  ========================================
echo        Growth Force Field
echo  ========================================
echo.

REM 检测 Node.js
where node >nul 2>&1
if not %errorlevel%==0 (
    echo  [i] 未检测到 Node.js，正在安装...
    echo.
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements >nul 2>&1
    if %errorlevel%==0 (
        echo  [OK] Node.js 安装完成
        echo.
        echo  请重新双击 start.bat 启动
        echo.
        pause
        goto :eof
    ) else (
        echo  [ERROR] 自动安装 Node.js 失败
        echo.
        echo  请手动安装 Node.js：
        echo  1. 访问 https://nodejs.org 下载安装包
        echo  2. 安装完成后重新双击 start.bat
        echo.
        pause
        goto :eof
    )
)

REM 检测端口占用
netstat -aon | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo  [!] Port 3000 已被占用，正在释放...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul 2>&1
    echo  [OK] 端口已释放
    echo.
)

REM 检查依赖
if not exist "node_modules\" (
    echo  [i] 首次运行，正在安装依赖...
    call npm install
    if not %errorlevel%==0 (
        echo  [ERROR] 依赖安装失败
        pause
        goto :eof
    )
    echo.
)

REM 启动服务
echo  启动服务中...
echo.
node server\index.js --open

echo.
echo  服务已停止
pause
