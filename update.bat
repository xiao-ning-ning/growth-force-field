@echo off
chcp 65001 >nul
title 成长力场 - 更新程序

echo ========================================
echo        成长力场 - 检查更新
echo ========================================
echo.

:: 停止运行中的服务器
echo [1/5] 停止运行中的服务器...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

:: 备份用户数据
echo [2/5] 备份用户数据...
if exist "data" (
    xcopy /E /I /Y "data" "data_backup" >nul 2>&1
    echo 已备份到 data_backup\
) else (
    echo 未找到 data 目录，跳过备份。
)

:: 下载最新版本
echo [3/5] 从 GitHub 下载最新版本...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/xiao-ning-ning/growth-force-field/archive/refs/heads/main.zip' -OutFile 'latest.zip'"
if errorlevel 1 (
    echo 下载失败！请检查网络连接后重试。
    pause
    exit /b 1
)

:: 解压覆盖（排除 data 和 data_backup）
echo [4/5] 解压并更新文件...
powershell -Command "Expand-Archive -Force -Path 'latest.zip' -DestinationPath '.'"
:: 将解压出的 growth-force-field-main 里的文件移到当前目录（覆盖）
xcopy /E /I /Y "growth-force-field-main\*" "." >nul 2>&1
rd /S /Q "growth-force-field-main" >nul 2>&1
del "latest.zip"

:: 还原用户数据
echo [5/5] 还原用户数据...
if exist "data_backup" (
    xcopy /E /I /Y "data_backup\*" "data\" >nul 2>&1
    rd /S /Q "data_backup" >nul 2>&1
    echo 已还原你的数据到 data\
) else (
    echo 未找到备份，跳过还原。
)

:: 重启服务器
echo.
echo ========================================
echo        更新完成！
echo ========================================
echo 正在启动服务器...
start cmd /k "title 成长力场 && node server/index.js"
echo 服务器已启动，请访问 http://localhost:3000
echo.
pause
