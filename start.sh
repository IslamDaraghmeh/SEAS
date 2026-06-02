#!/bin/bash
# ============================================
# SEAS - Smart Exam Attendance System
# Docker Startup Script for Unix/Linux/Mac
# ============================================

set -e

echo ""
echo " ____  _____    _    ____  "
echo "/ ___|| ____|  / \  / ___| "
echo "\___ \|  _|   / _ \ \___ \ "
echo " ___) | |___ / ___ \ ___) |"
echo "|____/|_____/_/   \_\____/ "
echo ""
echo "Smart Exam Attendance System"
echo "============================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi

# Parse command line arguments
ACTION=${1:-up}

case "$ACTION" in
    up)
        echo "[INFO] Starting all SEAS services..."
        echo ""
        docker-compose up --build -d
        echo ""
        echo "[SUCCESS] All services are starting!"
        echo ""
        echo "Services will be available at:"
        echo "  - Frontend:         http://localhost:5173"
        echo "  - Backend API:      http://localhost:3000/api"
        echo "  - Image Processing: http://localhost:8000"
        echo "  - Database Admin:   http://localhost:8080"
        echo ""
        echo "Use './start.sh logs' to view logs"
        echo "Use './start.sh stop' to stop all services"
        ;;

    stop)
        echo "[INFO] Stopping all SEAS services..."
        docker-compose down
        echo "[SUCCESS] All services stopped."
        ;;

    restart)
        echo "[INFO] Restarting all SEAS services..."
        docker-compose down
        docker-compose up --build -d
        echo "[SUCCESS] All services restarted."
        ;;

    logs)
        echo "[INFO] Showing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;

    status)
        echo "[INFO] Service status:"
        echo ""
        docker-compose ps
        ;;

    clean)
        echo "[WARNING] This will remove all containers, volumes, and data!"
        read -p "Are you sure? (y/N): " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            docker-compose down -v --remove-orphans
            echo "[SUCCESS] All containers and volumes removed."
        else
            echo "[INFO] Operation cancelled."
        fi
        ;;

    seed)
        echo "[INFO] Running database seeder..."
        docker-compose exec backend npx prisma db seed
        echo "[SUCCESS] Database seeded."
        ;;

    *)
        echo "Usage: ./start.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up       Start all services (default)"
        echo "  stop     Stop all services"
        echo "  restart  Restart all services"
        echo "  logs     View service logs"
        echo "  status   Show service status"
        echo "  clean    Remove all containers and volumes"
        echo "  seed     Run database seeder"
        ;;
esac
