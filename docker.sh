#!/bin/bash

# LogLens Docker Setup Script
# This script helps with common Docker operations for LogLens

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

usage() {
    echo "LogLens Docker Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services (docker-compose up -d)"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  rebuild     Rebuild and restart all containers"
    echo "  logs        View logs (follow mode)"
    echo "  status      Check service status"
    echo "  seed        Run database seeding"
    echo "  reset       Stop and remove all volumes (WARNING: deletes all data)"
    echo "  db          Connect to PostgreSQL database"
    echo "  shell-api   Access API container shell"
    echo "  shell-web   Access web container shell"
    echo "  clean       Remove all containers and volumes"
    echo "  help        Show this help message"
    echo ""
}

case "${1:-help}" in
    start)
        echo -e "${GREEN}Starting LogLens services...${NC}"
        docker-compose up -d
        echo -e "${GREEN}Services started! Check status with: $0 status${NC}"
        ;;
    stop)
        echo -e "${YELLOW}Stopping LogLens services...${NC}"
        docker-compose down
        echo -e "${GREEN}Services stopped${NC}"
        ;;
    restart)
        echo -e "${YELLOW}Restarting LogLens services...${NC}"
        docker-compose restart
        echo -e "${GREEN}Services restarted${NC}"
        ;;
    rebuild)
        echo -e "${YELLOW}Rebuilding LogLens containers...${NC}"
        docker-compose up -d --build
        echo -e "${GREEN}Build complete!${NC}"
        ;;
    logs)
        docker-compose logs -f
        ;;
    status)
        echo -e "${GREEN}Service Status:${NC}"
        docker-compose ps
        ;;
    seed)
        echo -e "${YELLOW}Running database seed...${NC}"
        docker-compose exec api pnpm prisma:seed
        echo -e "${GREEN}Database seeded!${NC}"
        ;;
    reset)
        echo -e "${RED}WARNING: This will delete all database volumes!${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            echo -e "${GREEN}Volumes removed${NC}"
        fi
        ;;
    db)
        echo -e "${GREEN}Connecting to PostgreSQL...${NC}"
        docker-compose exec db psql -U loglens -d loglens
        ;;
    shell-api)
        echo -e "${GREEN}Accessing API container...${NC}"
        docker-compose exec api sh
        ;;
    shell-web)
        echo -e "${GREEN}Accessing web container...${NC}"
        docker-compose exec web sh
        ;;
    clean)
        echo -e "${RED}WARNING: This will remove all containers and volumes!${NC}"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v --remove-orphans
            echo -e "${GREEN}Cleanup complete${NC}"
        fi
        ;;
    help|*)
        usage
        ;;
esac
