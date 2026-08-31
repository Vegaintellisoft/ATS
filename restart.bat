@echo off
cd /d "%~dp0docker"

echo ========================================
echo Restarting ATS Docker Services...
echo ========================================

docker compose restart

echo.
echo ATS services restarted.
pause