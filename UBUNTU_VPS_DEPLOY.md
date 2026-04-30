# Kinetic Vault ERP - Ubuntu VPS Deployment Guide (Step-by-Step)

Complete deployment guide for Ubuntu 20.04/22.04 VPS servers.

---

## 🖥️ Server Requirements

- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: 2 cores minimum
- **Disk**: 20GB minimum
- **Ports**: 80, 443, 5000 (internal)

---

## 📋 Step 1: Connect to Your VPS

```bash
# Connect via SSH (replace with your VPS IP)
ssh root@YOUR_VPS_IP_ADDRESS

# Or if using a user account
ssh username@YOUR_VPS_IP_ADDRESS
```

---

## 🔧 Step 2: Update System & Install Dependencies

```bash
# Update package list and upgrade existing packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nano ufw certbot nginx

# Install Node.js 20.x (for frontend build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

---

## 🐳 Step 3: Install Docker & Docker Compose

```bash
# Remove old Docker versions if any
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install Docker using official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (replace 'ubuntu' with your username)
sudo usermod -aG docker ubuntu

# Apply group changes
newgrp docker

# Verify Docker installation
docker --version
docker compose version

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 📁 Step 4: Upload Project to VPS

### Option A: Using Git Clone (Recommended)

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/AAMISHKHAN0/Bussiness-Erp-Software.git

# Enter project directory
cd Bussiness-Erp-Software

# List files to verify
ls -la
```

### Option B: Using SCP (Upload from local machine)

**On your LOCAL machine (not VPS):**

```bash
# Zip the project folder locally first
cd "d:\bussiness Erp Software"
# Or on Mac/Linux: cd /path/to/bussiness-erp-software

# Create zip file
zip -r erp-software.zip software/

# Upload to VPS
scp erp-software.zip root@YOUR_VPS_IP_ADDRESS:/root/
```

**Then on your VPS:**

```bash
# Extract the uploaded file
cd ~
unzip erp-software.zip
cd software
```

---

## ⚙️ Step 5: Configure Environment Variables

```bash
# Navigate to project root
cd ~/Bussiness-Erp-Software
# or: cd ~/software

# Copy production template to .env
cp .env.production .env

# Edit the .env file with your secure values
nano .env
```

### Required Changes in `.env`:

```bash
# Database Password (CHANGE THIS!)
DB_PASSWORD=YourSuperSecurePassword123!

# JWT Secrets (Generate these with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=GENERATE_64_CHAR_HEX_STRING_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_64_CHAR_HEX_STRING_HERE

# Your domain or VPS IP
CORS_ORIGIN=http://YOUR_VPS_IP_ADDRESS
# Or with domain: CORS_ORIGIN=https://your-domain.com

# Node Environment
NODE_ENV=production

# License file path
LICENSE_FILE_PATH=/app/license.json
```

**Save and exit nano:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## 🔐 Step 6: Generate JWT Secrets

```bash
# Generate JWT_SECRET (copy the output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (copy the output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy both outputs and paste them into your `.env` file.

---

## 📜 Step 7: Create License File

```bash
# Create license.json in the project root
cd ~/Bussiness-Erp-Software

# Create the license file
nano license.json
```

Paste this content:

```json
{
  "key": "YER-A1B2-C3D4-E5F6",
  "tier": "1 Year",
  "expiresAt": 1767225600000,
  "activatedAt": 1735689600000
}
```

Save and exit: `Ctrl+X`, `Y`, `Enter`

---

## 🚀 Step 8: Deploy the Application

```bash
# Navigate to project directory
cd ~/Bussiness-Erp-Software

# Make deploy script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh production deploy
```

**What this does:**
1. Builds the frontend React app
2. Builds Docker images for backend and frontend
3. Starts PostgreSQL, Backend, and Nginx containers
4. Waits for services to be healthy

**Deployment time:** ~5-10 minutes (first time)

---

## 🔍 Step 9: Verify Deployment

```bash
# Check if containers are running
docker ps

# You should see 3 containers:
# - erp_postgres_prod
# - erp_backend_prod
# - erp_nginx_prod

# Check backend logs
docker logs erp_backend_prod

# Check nginx logs
docker logs erp_nginx_prod

# Test health endpoint
curl http://localhost:5000/health

# Test API endpoint
curl http://localhost/api/v1/health
```

---

## 🌐 Step 10: Access Your ERP

Open your browser and visit:

```
http://YOUR_VPS_IP_ADDRESS
```

**Default Login:**
- Email: `admin@company.com`
- Password: `password123`
- License Key: `YER-A1B2-C3D4-E5F6`

⚠️ **IMPORTANT: Change the password immediately after first login!**

---

## 🔒 Step 11: Configure Firewall (UFW)

```bash
# Check firewall status
sudo ufw status

# Allow SSH (so you don't get locked out)
sudo ufw allow OpenSSH
# or: sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to backend port (only nginx should access it)
sudo ufw deny 5000/tcp

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status verbose
```

---

## 📦 SSL Certificate with Let's Encrypt (Optional but Recommended)

### If you have a domain name:

```bash
# Install certbot
sudo apt install -y certbot

# Stop nginx temporarily (if running standalone)
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Create SSL directory in project
mkdir -p ~/Bussiness-Erp-Software/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/Bussiness-Erp-Software/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/Bussiness-Erp-Software/nginx/ssl/key.pem

# Fix permissions
sudo chown -R $USER:$USER ~/Bussiness-Erp-Software/nginx/ssl

# Restart containers
cd ~/Bussiness-Erp-Software
./deploy.sh production restart
```

### Auto-renewal for SSL:

```bash
# Add to crontab for auto-renewal
crontab -e

# Add this line at the bottom (renews at 3 AM daily):
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/*.pem ~/Bussiness-Erp-Software/nginx/ssl/ && cd ~/Bussiness-Erp-Software && docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 🔄 Useful Management Commands

```bash
# View logs
./deploy.sh production logs

# Or view specific container logs:
docker logs -f erp_backend_prod    # Follow backend logs
docker logs -f erp_nginx_prod      # Follow nginx logs
docker logs -f erp_postgres_prod   # Follow database logs

# Restart services
./deploy.sh production restart

# Stop all services
./deploy.sh production stop

# Update after code changes
./deploy.sh production update

# Check container status
docker ps

# Enter backend container (for debugging)
docker exec -it erp_backend_prod sh

# Enter database (PostgreSQL)
docker exec -it erp_postgres_prod psql -U erp_user -d erp_production

# Check resource usage
docker stats
```

---

## 💾 Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker exec erp_postgres_prod pg_dump -U erp_user erp_production > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# To restore from backup:
# docker exec -i erp_postgres_prod psql -U erp_user -d erp_production < backup_file.sql
```

### Automated Daily Backup:

```bash
crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * docker exec erp_postgres_prod pg_dump -U erp_user erp_production > ~/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 🐛 Troubleshooting

### Problem: Backend won't start

```bash
# Check logs
docker logs erp_backend_prod

# Common issues:
# 1. Database not ready - wait 30 seconds and restart
./deploy.sh production restart

# 2. Environment variables missing
docker exec erp_backend_prod env | grep -i jwt

# 3. Database connection issues
docker exec -it erp_backend_prod node -e "const db = require('./dist/config/db'); db.connectWithRetry().then(() => console.log('Connected')).catch(console.error)"
```

### Problem: Frontend shows "Cannot connect to server"

```bash
# Check if backend is running
curl http://localhost:5000/health

# If not running, check logs
docker logs erp_backend_prod

# Check nginx configuration
docker exec erp_nginx_prod nginx -t
```

### Problem: License activation fails

```bash
# Check license file exists
cat ~/Bussiness-Erp-Software/license.json

# Check license endpoint
curl http://localhost:5000/api/v1/license/status

# Rebuild and restart
cd ~/Bussiness-Erp-Software
./deploy.sh production restart
```

### Problem: Permission denied errors

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/Bussiness-Erp-Software

# Make scripts executable
chmod +x ~/Bussiness-Erp-Software/deploy.sh
```

---

## 📊 Monitoring & Health Checks

```bash
# System health
htop                    # CPU/Memory usage
df -h                   # Disk space
free -h                 # Memory

# Docker health
docker ps               # Container status
docker stats            # Resource usage
docker system df        # Disk usage

# Application health
curl http://localhost:5000/health
curl http://localhost/api/v1/health
```

---

## 🎯 Complete Deployment Checklist

- [ ] VPS server created (Ubuntu 20.04/22.04)
- [ ] Connected via SSH
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Docker & Docker Compose installed
- [ ] Node.js 20.x installed
- [ ] Project uploaded to VPS
- [ ] `.env` file configured with secure passwords
- [ ] JWT secrets generated and set
- [ ] `license.json` created
- [ ] Firewall configured (UFW)
- [ ] Deploy script executed successfully
- [ ] All 3 containers running (`docker ps`)
- [ ] Health checks pass (`curl` commands)
- [ ] ERP accessible via browser
- [ ] Default login works
- [ ] SSL certificate configured (if using domain)
- [ ] Backup strategy configured
- [ ] Default password changed

---

## 📞 Quick Reference Commands

```bash
# Full deployment from scratch
cd ~/Bussiness-Erp-Software
chmod +x deploy.sh
./deploy.sh production deploy

# Daily management
./deploy.sh production logs     # View logs
./deploy.sh production restart  # Restart services
./deploy.sh production stop     # Stop services
./deploy.sh production update     # Update after code changes

# Access URLs
http://YOUR_VPS_IP_ADDRESS      # ERP Application
http://YOUR_VPS_IP_ADDRESS/api/v1/health  # API Health Check
```

---

**Your ERP is now fully deployed and ready for production use!** 🚀

For issues, check the logs with `docker logs` or refer to the troubleshooting section above.
