@echo off
setlocal EnableExtensions EnableDelayedExpansion
title StopKadr Android release APK

cd /d "%~dp0"
echo.
echo === StopKadr: Android release APK (iOS = priority, Android = Windows path) ===
echo.

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
if not exist "%JAVA_HOME%\bin\java.exe" (
  if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
  )
)
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [ERROR] Android Studio JBR not found. Set JAVA_HOME.
  pause
  exit /b 1
)

set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
if not exist "%ANDROID_HOME%" (
  echo [ERROR] Android SDK not found: %ANDROID_HOME%
  pause
  exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo [1/4] npm install
call npm install
if errorlevel 1 exit /b 1

echo [2/4] expo prebuild android
call npx expo prebuild --platform android
if errorlevel 1 exit /b 1

echo [3/4] gradle assembleRelease
cd android
call gradlew.bat assembleRelease
if errorlevel 1 (
  cd ..
  pause
  exit /b 1
)
cd ..

set "APK=android\app\build\outputs\apk\release\app-release.apk"
if not exist "%APK%" (
  echo [ERROR] APK not found: %APK%
  pause
  exit /b 1
)

if not exist "dist" mkdir dist
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm"') do set TS=%%i
set "OUT=dist\StopKadr-release_%TS%.apk"
copy /y "%APK%" "%OUT%" >nul
echo.
echo [OK] %OUT%
echo Install on phone: adb install -r "%OUT%"
pause
