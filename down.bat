@echo off
cd "C:\Users\user\Desktop\ATS\docker"

echo ========================================
echo Stopping ATS Docker Services...
echo ========================================

docker compose down

echo.
echo ATS services stopped.
pause