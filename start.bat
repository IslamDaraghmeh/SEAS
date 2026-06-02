@echo off
REM ============================================
REM SEAS - Smart Exam Attendance System
REM Docker Startup Script for Windows
REM ============================================

echo.
echo  ____  _____    _    ____
echo / ___|| ____|  / \  / ___|
echo \___ \|  _|   / _ \ \___ \
echo  ___) | |___ / ___ \ ___) |
echo |____/|_____/_/   \_\____/
echo.
echo Smart Exam Attendance System
echo ============================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Parse command line arguments
set ACTION=%1
if "%ACTION%"=="" set ACTION=up

if "%ACTION%"=="up" (
    echo [INFO] Starting all SEAS services...
    echo.
    docker-compose up --build -d
    echo.
    echo [SUCCESS] All services are starting!
    echo.
    echo Services will be available at:
    echo   - Frontend:         http://localhost:5173
    echo   - Backend API:      http://localhost:3000/api
    echo   - Image Processing: http://localhost:8000
    echo   - Database Admin:   http://localhost:8080
    echo.
    echo Use 'start.bat logs' to view logs
    echo Use 'start.bat stop' to stop all services
    goto :end
)

if "%ACTION%"=="stop" (
    echo [INFO] Stopping all SEAS services...
    docker-compose down
    echo [SUCCESS] All services stopped.
    goto :end
)

if "%ACTION%"=="restart" (
    echo [INFO] Restarting all SEAS services...
    docker-compose down
    docker-compose up --build -d
    echo [SUCCESS] All services restarted.
    goto :end
)

if "%ACTION%"=="logs" (
    echo [INFO] Showing logs (Ctrl+C to exit)...
    docker-compose logs -f
    goto :end
)

if "%ACTION%"=="status" (
    echo [INFO] Service status:
    echo.
    docker-compose ps
    goto :end
)

if "%ACTION%"=="clean" (
    echo [WARNING] This will remove all containers, volumes, and data!
    set /p confirm="Are you sure? (y/N): "
    if /i "%confirm%"=="y" (
        docker-compose down -v --remove-orphans
        echo [SUCCESS] All containers and volumes removed.
    ) else (
        echo [INFO] Operation cancelled.
    )
    goto :end
)

if "%ACTION%"=="seed" (
    echo [INFO] Running database seeder...
    docker-compose exec backend npx prisma db seed
    echo [SUCCESS] Database seeded.
    goto :end
)

echo Usage: start.bat [command]
echo.
echo Commands:
echo   up       Start all services (default)
echo   stop     Stop all services
echo   restart  Restart all services
echo   logs     View service logs
echo   status   Show service status
echo   clean    Remove all containers and volumes
echo   seed     Run database seeder

:end
