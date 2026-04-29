#!/bin/bash

# Kinetic Vault ERP - Production Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: production (default), staging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        if [ -f .env.production ]; then
            log_warn ".env file not found. Copying from .env.production..."
            cp .env.production .env
            log_warn "Please edit .env file with your actual values before continuing!"
            exit 1
        else
            log_error "No .env file found. Please create one based on .env.production"
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Build frontend
build_frontend() {
    log_info "Building frontend for production..."
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d node_modules ]; then
        log_info "Installing frontend dependencies..."
        npm ci
    fi
    
    # Build
    npm run build
    
    cd ..
    log_success "Frontend build complete"
}

# Deploy function
deploy() {
    log_info "Starting deployment for environment: $ENV"
    
    # Build and start containers
    log_info "Building and starting Docker containers..."
    docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    docker-compose -f $COMPOSE_FILE build
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check if backend is running
    if docker ps | grep -q "erp_backend_prod"; then
        log_success "Backend container is running"
    else
        log_error "Backend container failed to start. Check logs with: docker logs erp_backend_prod"
        exit 1
    fi
    
    # Check if nginx is running
    if docker ps | grep -q "erp_nginx_prod"; then
        log_success "Nginx container is running"
    else
        log_error "Nginx container failed to start. Check logs with: docker logs erp_nginx_prod"
        exit 1
    fi
    
    log_success "Deployment complete!"
    log_info "Your ERP should be accessible at: http://$(hostname -I | awk '{print $1}')"
}

# Show logs
show_logs() {
    log_info "Showing recent logs..."
    docker-compose -f $COMPOSE_FILE logs --tail=50
}

# Main execution
case "${2:-deploy}" in
    check)
        check_prerequisites
        ;;
    build)
        check_prerequisites
        build_frontend
        ;;
    deploy)
        check_prerequisites
        build_frontend
        deploy
        show_logs
        ;;
    logs)
        show_logs
        ;;
    stop)
        log_info "Stopping services..."
        docker-compose -f $COMPOSE_FILE down
        log_success "Services stopped"
        ;;
    restart)
        log_info "Restarting services..."
        docker-compose -f $COMPOSE_FILE restart
        log_success "Services restarted"
        ;;
    update)
        log_info "Updating deployment..."
        check_prerequisites
        build_frontend
        docker-compose -f $COMPOSE_FILE pull
        docker-compose -f $COMPOSE_FILE up -d --build
        log_success "Update complete"
        ;;
    *)
        echo "Usage: $0 [environment] [command]"
        echo ""
        echo "Environments:"
        echo "  production    Deploy to production (default)"
        echo ""
        echo "Commands:"
        echo "  check         Check prerequisites"
        echo "  build         Build frontend only"
        echo "  deploy        Full deployment (default)"
        echo "  logs          Show container logs"
        echo "  stop          Stop all services"
        echo "  restart       Restart services"
        echo "  update        Pull updates and redeploy"
        echo ""
        echo "Examples:"
        echo "  $0 production deploy    # Full production deployment"
        echo "  $0 production logs      # View logs"
        exit 1
        ;;
esac
