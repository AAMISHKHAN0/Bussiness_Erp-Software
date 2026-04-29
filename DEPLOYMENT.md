# Kinetic Vault ERP - VPS Deployment Guide

Complete production deployment guide for VPS/cloud servers.

## Prerequisites

- **Server**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Docker**: 20.10+ with Docker Compose
- **Domain**: (optional) for SSL certificates
- **Ports**: 80, 443, 5000 (internal)

## Quick Start (5 minutes)

```bash
# 1. Clone and enter directory
git clone https://github.com/AAMISHKHAN0/Bussiness-Erp-Software.git
cd Bussiness-Erp-Software

# 2. Configure environment
cp .env.production .env
# Edit .env with your secure passwords and secrets

# 3. Deploy
chmod +x deploy.sh
./deploy.sh production deploy
```

## Detailed Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Environment Configuration

Edit `.env` file with production values:

```bash
# Required: Database
DB_PASSWORD=your_secure_password_here_min_16_chars

# Required: JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_64_char_hex_string_here
JWT_REFRESH_SECRET=your_other_64_char_hex_string_here

# Required: Your domain
CORS_ORIGIN=https://your-domain.com

# Optional: License file path
LICENSE_FILE_PATH=/app/license.json
```

### 3. SSL Certificates (HTTPS)

**Option A: Let's Encrypt (Recommended)**

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

**Option B: Self-signed (Development only)**

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

### 4. License Activation

Create `license.json` in project root:

```json
{
  "key": "YER-A1B2-C3D4-E5F6",
  "tier": "1 Year",
  "expiresAt": 1767225600000,
  "activatedAt": 1735689600000
}
```

Or activate via web UI using key: `YER-A1B2-C3D4-E5F6`

### 5. Deployment Commands

```bash
# First deployment
./deploy.sh production deploy

# View logs
./deploy.sh production logs

# Update after code changes
./deploy.sh production update

# Stop services
./deploy.sh production stop

# Restart services
./deploy.sh production restart
```

### 6. Database Setup (First Time)

```bash
# Access PostgreSQL container
docker exec -it erp_postgres_prod psql -U erp_user -d erp_production

# Run migrations (if not auto-run)
docker exec erp_backend_prod npm run migrate

# Seed admin user (if needed)
docker exec erp_backend_prod npm run seed
```

## Default Login Credentials

- **Email**: `admin@company.com`
- **Password**: `password123`
- **Activation Key**: `YER-A1B2-C3D4-E5F6`

**⚠️ Change immediately after first login!**

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker logs erp_backend_prod

# Verify environment variables
docker exec erp_backend_prod env | grep -i jwt

# Test database connection
docker exec erp_backend_prod node -e "const { connectWithRetry } = require('./dist/config/db'); connectWithRetry().then(console.log)"
```

### Frontend not loading

```bash
# Check nginx logs
docker logs erp_nginx_prod

# Verify frontend build
docker exec erp_nginx_prod ls -la /usr/share/nginx/html
```

### License issues

```bash
# Check license file
docker exec erp_backend_prod cat /app/license.json

# Verify backend license endpoint
curl http://localhost:5000/api/v1/license/status
```

### Database connection errors

```bash
# Check PostgreSQL logs
docker logs erp_postgres_prod

# Verify credentials in .env match
docker exec erp_postgres_prod env
```

## Security Checklist

- [ ] Changed default JWT secrets
- [ ] Changed default database password
- [ ] Disabled mock fallback (`ALLOW_DB_MOCK_FALLBACK=false`)
- [ ] Enabled HTTPS with valid SSL certificate
- [ ] Firewall: only ports 80, 443 open
- [ ] Regular backups configured for PostgreSQL
- [ ] Log rotation enabled

## Backup Strategy

```bash
# Automated daily backup
docker exec erp_postgres_prod pg_dump -U erp_user erp_production > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20240101.sql | docker exec -i erp_postgres_prod psql -U erp_user -d erp_production
```

## Monitoring

```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Health checks
curl http://localhost:5000/health
curl http://localhost/api/v1/health
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/AAMISHKHAN0/Bussiness-Erp-Software/issues
- Documentation: See README.md
