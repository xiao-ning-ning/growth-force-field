@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Growth Force Field

echo.
echo ========================================
echo        Growth Force Field
echo ========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到 Node.js，请先安装
    echo.
    echo 请访问以下地址下载安装 Node.js（LTS 版本）:
    echo   https://nodejs.org/
    echo.
    echo 安装完成后，重新双击 start.bat
    echo.
    pause
    exit /b
)

echo [OK] Node.js 已就绪

:: Install dependencies if needed
if not exist "node_modules" (
    echo [i] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 依赖安装失败，请检查 npm 是否正常
        pause
        exit /b
    )
)

:: Check .env
if not exist ".env" (
    echo [ERROR] 未找到 .env 配置文件
    echo.
    echo 请在项目根目录创建 .env 文件，至少包含:
    echo   OPENAI_API_KEY=你的API密钥
    echo   ADMIN_PASSWORD=你的管理员密码（至少8位）
    echo.
    echo 参考 README 中的配置说明
    echo.
    pause
    exit /b
)

echo [OK] 环境就绪，正在启动...
node server\index.js --open
pause
