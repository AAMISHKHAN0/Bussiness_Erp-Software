# provision-db.ps1
# This script helps set up the erp_system database for local development.

Clear-Host
Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Kinetic Vault ERP - Automated Database Provisioning" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan

# 1. Check for Docker
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCheck) {
    Write-Host "Docker detected! Attempting to start PostgreSQL via Docker Compose..." -ForegroundColor Green
    docker-compose up -d postgres
    Write-Host "Waiting for database to be healthy..." -ForegroundColor Yellow
    
    $retry = 0
    while ($retry -lt 15) {
        $status = docker inspect -f '{{.State.Health.Status}}' erp_postgres 2>$null
        if ($status -eq "healthy") {
            Write-Host "PostgreSQL is UP and Healthy!" -ForegroundColor Green
            break
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $retry++
    }
} else {
    Write-Host "Docker not found. Checking for local PostgreSQL service..." -ForegroundColor Yellow
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        Write-Host "PostgreSQL service found: $($pgService.Name)" -ForegroundColor Green
        if ($pgService.Status -ne "Running") {
            Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
            Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
        } else {
            Write-Host "PostgreSQL service is already running." -ForegroundColor Green
        }
    } else {
        Write-Host "No PostgreSQL service or Docker found." -ForegroundColor Red
        Write-Host "Manual Installation Steps:" -ForegroundColor White
        Write-Host "1. Download PostgreSQL: https://www.postgresql.org/download/windows/"
        Write-Host "2. Install with default settings (Password: postgres)"
        Write-Host "3. The backend will automatically connect once it's installed."
        return
    }
}

# 2. Initialize Database Schema
Write-Host "Initializing Master & Tenant Databases..." -ForegroundColor Cyan
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    $env:PGPASSWORD = "postgres"
    
    # Create erp_master (Master DB for tenant management)
    Write-Host "Ensuring 'erp_master' exists..." -ForegroundColor Yellow
    psql -h localhost -U postgres -c "CREATE DATABASE erp_master;" 2>$null
    
    # Create erp_system (Fallback/Default DB)
    Write-Host "Ensuring 'erp_system' exists..." -ForegroundColor Yellow
    psql -h localhost -U postgres -c "CREATE DATABASE erp_system;" 2>$null

    # Run seed script if available
    if (Test-Path "setup_dev_db.sql") {
        Write-Host "Running database initialization script (setup_dev_db.sql)..." -ForegroundColor Yellow
        psql -h localhost -U postgres -f setup_dev_db.sql
        Write-Host "Databases initialized and seeded!" -ForegroundColor Green
    }
} else {
    # Try through docker if psql localized missing
    if ($dockerCheck) {
        Write-Host "psql not in path, using docker exec to initialize..." -ForegroundColor Yellow
        docker exec -i erp_postgres psql -U postgres -c "CREATE DATABASE erp_master;" 2>$null
        docker exec -i erp_postgres psql -U postgres -c "CREATE DATABASE erp_system;" 2>$null
        if (Test-Path "setup_dev_db.sql") {
            Get-Content setup_dev_db.sql | docker exec -i erp_postgres psql -U postgres
            Write-Host "Databases initialized via Docker!" -ForegroundColor Green
        }
    } else {
        Write-Host "psql command not in PATH. Manual step required." -ForegroundColor Yellow
    }
}

Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Provisioning complete! Start your backend to connect." -ForegroundColor Green
Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
