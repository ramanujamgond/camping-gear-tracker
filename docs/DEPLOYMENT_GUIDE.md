# Deployment Guide

Complete guide for deploying the Camping Gear Tracker backend and building the Android APK.

## Table of Contents
1. [Backend Deployment](#backend-deployment)
2. [Android APK Build](#android-apk-build)
3. [Post-Deployment](#post-deployment)

---

## Backend Deployment

### Option 1: Deploy to VPS/Cloud Server (Recommended)

#### Prerequisites
- Ubuntu/Debian server (AWS EC2, DigitalOcean, etc.)
- Domain name (optional but recommended)
- SSH access to server

#### Step 1: Server Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 2: Upload Project Files

```bash
# On your local machine, create deployment package
cd camping-gear-tracker
tar -czf camping-gear-backend.tar.gz backend/ docker-compose.yml

# Upload to server
scp camping-gear-backend.tar.gz user@your-server-ip:~/

# On server, extract files
ssh user@your-server-ip
tar -xzf camping-gear-backend.tar.gz
cd camping-gear-tracker
```

#### Step 3: Configure Environment

```bash
# Edit .env file
cd backend
nano .env
```

Update these values:
```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
DB_NAME=camping_gear
DB_HOST=db
DB_PORT=5432
DATABASE_URL=postgres://postgres:CHANGE_THIS_STRONG_PASSWORD@db:5432/camping_gear

# Server Configuration
PORT=3000
NODE_ENV=production

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Authentication Configuration
SUPER_ADMIN_PIN=CHANGE_THIS_PIN
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_MIN_32_CHARS
JWT_EXPIRES_IN=365d
```

**Important**: Change all passwords and secrets!

#### Step 4: Update Docker Compose for Production

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: camping_gear_db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - camping-network

  api:
    build: ./backend
    container_name: camping_gear_api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - PORT=3000
      - NODE_ENV=production
      - UPLOAD_DIR=/usr/src/app/uploads
      - SUPER_ADMIN_PIN=${SUPER_ADMIN_PIN}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
    depends_on:
      - db
    volumes:
      - uploads:/usr/src/app/uploads
    networks:
      - camping-network

volumes:
  pgdata:
  uploads:

networks:
  camping-network:
    driver: bridge
```

#### Step 5: Start Services

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker logs camping_gear_api
docker logs camping_gear_db

# Verify API is running
curl http://localhost:3000/health
```

#### Step 6: Setup Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/camping-gear
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change this

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/camping-gear /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

#### Step 8: Setup Firewall

```bash
# Configure UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Option 2: Deploy to Heroku

```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create camping-gear-tracker

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SUPER_ADMIN_PIN=2200
heroku config:set JWT_SECRET=your-secret-key
heroku config:set JWT_EXPIRES_IN=365d

# Deploy
cd backend
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a camping-gear-tracker
git push heroku main
```

### Option 3: Deploy to Railway.app

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add PostgreSQL database
6. Set environment variables
7. Deploy automatically

---

## Android APK Build

### Prerequisites

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account (create one at expo.dev if needed)
eas login
```

### Step 1: Configure EAS Build

```bash
cd mobile

# Initialize EAS
eas build:configure
```

This creates `eas.json`. Update it:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 2: Update API URL for Production

Edit `mobile/src/config/api.js`:

```javascript
// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.29.226:3000/api/v1'  // Development
  : 'https://your-domain.com/api/v1';     // Production - CHANGE THIS

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    ITEMS: '/items',
    CATEGORIES: '/categories',
  },
  TIMEOUT: 10000,
};
```

### Step 3: Update app.json

```json
{
  "expo": {
    "name": "Camping Gear Tracker",
    "slug": "camping-gear-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2e7d32"
      },
      "package": "com.campinggeartracker",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Camping Gear Tracker to access your camera to scan QR codes and take photos"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Camping Gear Tracker to access your photos to upload item images"
        }
      ]
    ]
  }
}
```

### Step 4: Build APK

```bash
# Build for testing (Preview APK)
eas build --platform android --profile preview

# Build for production
eas build --platform android --profile production
```

The build process will:
1. Upload your code to Expo servers
2. Build the APK in the cloud
3. Provide a download link when complete (usually 10-20 minutes)

### Step 5: Download and Install APK

```bash
# After build completes, download APK
# Link will be shown in terminal and at: https://expo.dev/accounts/[your-account]/projects/camping-gear-tracker/builds

# Transfer APK to Android device
# Install by opening the APK file on your device
```

### Alternative: Build Locally (Advanced)

```bash
# Install Android Studio and SDK
# Set ANDROID_HOME environment variable

# Build locally
eas build --platform android --profile preview --local
```

---

## Post-Deployment

### 1. Test Backend API

```bash
# Health check
curl https://your-domain.com/health

# Test login
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"2200"}'
```

### 2. Test Mobile App

1. Install APK on Android device
2. Login with super admin PIN (2200)
3. Create a test user
4. Scan a QR code
5. Add an item with photo
6. Export PDF
7. Test all features

### 3. Backup Strategy

```bash
# Backup database
docker exec camping_gear_db pg_dump -U postgres camping_gear > backup_$(date +%Y%m%d).sql

# Backup images
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Setup automated backups (cron)
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

### 4. Monitoring

```bash
# View logs
docker logs -f camping_gear_api
docker logs -f camping_gear_db

# Check container status
docker ps

# Check disk space
df -h

# Check memory
free -h
```

### 5. Update Procedure

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker logs camping_gear_api
```

---

## Troubleshooting

### Backend Issues

**Problem**: Database connection failed
```bash
# Check database is running
docker ps | grep camping_gear_db

# Check database logs
docker logs camping_gear_db

# Restart database
docker-compose restart db
```

**Problem**: API not responding
```bash
# Check API logs
docker logs camping_gear_api

# Restart API
docker-compose restart api

# Check port is open
sudo netstat -tulpn | grep 3000
```

### Mobile App Issues

**Problem**: Cannot connect to API
- Check API URL in `mobile/src/config/api.js`
- Ensure backend is accessible from internet
- Check firewall rules

**Problem**: APK won't install
- Enable "Install from Unknown Sources" in Android settings
- Check APK is not corrupted
- Ensure Android version is compatible (Android 5.0+)

---

## Security Checklist

- [ ] Changed default super admin PIN
- [ ] Changed JWT_SECRET to random string
- [ ] Changed database password
- [ ] Enabled HTTPS with SSL certificate
- [ ] Configured firewall (UFW)
- [ ] Set NODE_ENV=production
- [ ] Disabled unnecessary ports
- [ ] Setup automated backups
- [ ] Configured log rotation
- [ ] Updated all dependencies

---

## Support

For issues or questions:
1. Check logs: `docker logs camping_gear_api`
2. Review this guide
3. Check GitHub issues
4. Contact support

