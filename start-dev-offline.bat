@echo off
setlocal EnableExtensions
title StopKadr — Expo offline

cd /d "%~dp0"

echo.
echo === StopKadr: Expo OFFLINE (no api.expo.dev) ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not in PATH.
  pause
  exit /b 1
)

if not exist "node_modules" (
  call npm install
  if errorlevel 1 exit /b 1
)

call npm run start:offline
pause
exit /b %ERRORLEVEL%
