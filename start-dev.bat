@echo off
setlocal EnableExtensions
title StopKadr — Expo (Expo Go)

cd /d "%~dp0"

echo.
echo === StopKadr: Metro + QR for Expo Go ===
echo Folder: %CD%
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
  echo [WARN] Port 8081 is already in use — maybe Metro is already running.
  echo        Close the other window or: taskkill /F /IM node.exe
  echo.
)

echo [2/2] expo start -c  (cache clear)
echo Phone: Expo Go, same Wi-Fi, scan QR.
echo Stop: Ctrl+C in this window.
echo.

call npm start
set "EC=%ERRORLEVEL%"

echo.
if not "%EC%"=="0" echo Expo exited with code %EC%.
pause
exit /b %EC%
