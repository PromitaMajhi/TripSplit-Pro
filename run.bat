@echo off
setlocal
title TripSplit Pro - Auto Launch
cd /d "%~dp0"

echo ==========================================
echo    🚀 TripSplit Pro - Automatic Launcher
echo ==========================================

:: Step 1: Check for Node.js
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [❌] Error: Node.js is NOT installed!
    echo Please install it from: https://nodejs.org/
    echo Once installed, restart this file.
    pause
    exit /b 1
)

:: Step 2: Check for dependencies
if not exist "node_modules\" (
    echo [📦] Installing dependencies for first-time use...
    echo (This may take a minute)
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [❌] Error during installation.
        pause
        exit /b 1
    )
    echo [✅] Installation complete!
)

:: Step 3: Start the server
echo [⚡] Starting development server...
echo [🌐] Once started, open: http://localhost:5173
echo.

:: Open browser automatically after a short delay
start "" http://localhost:5173

call npm run dev

if %ERRORLEVEL% neq 0 (
    echo [❌] App stopped unexpectedly.
    pause
)
