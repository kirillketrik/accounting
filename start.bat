@echo off
REM Installs Docker Desktop if needed, then builds and runs the app.
REM
REM Usage:
REM   start.bat          rem prod (nginx + built frontend, on port 80 / %FRONTEND_PORT%)
REM   start.bat dev      rem dev (hot reload, ports 5173 + 8000)
setlocal enabledelayedexpansion

set MODE=%1
if "%MODE%"=="" set MODE=prod

where docker >nul 2>nul
if errorlevel 1 (
    echo Docker was not found on this machine.
    echo Downloading the Docker Desktop installer...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker Desktop Installer.exe' -OutFile '%TEMP%\DockerDesktopInstaller.exe'"
    if not exist "%TEMP%\DockerDesktopInstaller.exe" (
        echo Download failed. Install Docker manually:
        start https://www.docker.com/products/docker-desktop/
        exit /b 1
    )
    echo Launching the installer - this needs Administrator rights and may prompt you.
    "%TEMP%\DockerDesktopInstaller.exe" install --quiet --accept-license
    echo.
    echo Docker Desktop was installed. On a first install, Windows may require
    echo enabling WSL2/virtualization and a REBOOT before Docker will work.
    echo Reboot if prompted, then re-run this script.
    pause
    exit /b 0
)

docker info >nul 2>nul
if errorlevel 1 (
    echo Docker is installed but not running. Start Docker Desktop and re-run this script.
    exit /b 1
)

cd /d "%~dp0"

if not exist ".env" (
    echo .env not found - creating it from .env.example ^(defaults already work^)...
    copy /y .env.example .env >nul
)

if /I "%MODE%"=="dev" (
    docker compose -f docker-compose.dev.yml up --build
) else (
    docker compose -f docker-compose.yml up --build -d

    if not defined FRONTEND_PORT set FRONTEND_PORT=80

    set IP=
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
        if not defined IP set IP=%%a
    )
    set IP=%IP: =%

    echo.
    echo App is running:
    echo   Local:   http://localhost:%FRONTEND_PORT%
    if defined IP echo   Network: http://%IP%:%FRONTEND_PORT%   (share this with colleagues on the LAN)
)

endlocal
