@echo off
cd /d "%~dp0docker"

echo ========================================
echo Rebuilding ATS Docker Services...
echo ========================================

docker compose down -v
docker compose up -d --build --renew-anon-volumes

echo.
echo ATS services rebuilt and started.
pause