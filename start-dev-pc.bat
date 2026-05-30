@echo off
setlocal EnableExtensions
title StopKadr — Expo + PC sync (8792)

cd /d "%~dp0"

echo.
echo === StopKadr: Metro + PC receiver (port 8792) + Expo Go ===
echo Folder: %CD%
echo Phone and PC — same Wi-Fi. In app: Save -^> to PC
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not in PATH. Install Node 20 LTS.
  pause
  exit /b 1
)

if not exist "node_modules\expo\bin\cli" (
  echo [1/2] npm install — first run
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

netstat -ano | findstr /R /C:":8081 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo [WARN] Port 8081 in use — close other Metro or: taskkill /F /IM node.exe
  echo.
)

netstat -ano | findstr /R /C:":8792 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo [WARN] Port 8792 in use — PC sync may already run.
  echo.
)

echo [2/2] npm run dev  (pc-sync + expo start -c)
echo PC inbox: %USERPROFILE%\Documents\StopKadr-Inbox\
echo Stop: Ctrl+C
echo.

call npm run dev
set "EC=%ERRORLEVEL%"

echo.
if not "%EC%"=="0" echo Exited with code %EC%.
pause
exit /b %EC%
