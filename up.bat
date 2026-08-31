@echo off
cd "C:\Users\user\Desktop\ATS\docker"

echo ========================================
echo Starting ATS Docker Services...
echo ========================================

docker compose up
echo.
echo ATS services started.
pause