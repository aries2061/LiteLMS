# Lite LMS — Configuration and Deployment Guide

This guide provides step-by-step instructions to configure and deploy the Lite LMS Progressive Web App (PWA) on a **Raspberry Pi 4 Model B (8GB RAM, 500GB SSD)**.

## Environment Overview
- **Hardware:** Raspberry Pi 4 Model B (8GB RAM, 500GB SSD)
- **OS:** Raspberry Pi OS (64-bit)
- **Containers:** Next.js (Web App), MariaDB (Relational DB), MongoDB (Document DB)
- **Networking:** Nginx Reverse Proxy with Let's Encrypt SSL
- **Target Status:** Air-gapped local network (disconnected from the internet permanently)

> **⚠️ AIR-GAPPED NOTE:** You will perform the initial setup while connected to the internet to download Docker images and obtain the Let's Encrypt SSL certificate. After setup is complete, the Raspberry Pi will be disconnected and operate in an air-gapped local network.

---

## 1. Prepare the Raspberry Pi & Docker Environment

### 1.1 Verify OS and Docker
Ensure you are running **Raspberry Pi OS 64-bit** (required for MongoDB 7) and Docker is installed.
```bash
# Check Docker version
docker compose version
```
*(If Docker is not installed, install it via: `curl -fsSL https://get.docker.com | sh`)*

---

## 2. Setup Application and Databases in Docker

### 2.1 Transfer the Project
Transfer the Next.js `lite-lms` project to your Raspberry Pi.
```bash
# Clone the repository
git clone https://github.com/aries2061/LiteLMS.git
cd ~/lite-lms
```

### 2.2 Configure Environment Variables
Create the `.env` file from the example template.
```bash
cp .env.example .env
nano .env
```
Update the passwords with strong credentials:
```env
# MariaDB
MYSQL_ROOT_PASSWORD=SuperSecretRoot2026!
MYSQL_PASSWORD=LiteLmsDbPass2026!

# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=MongoSecurePass2026!

# NextAuth.js
NEXTAUTH_SECRET=your-random-32-character-secret
NEXTAUTH_URL=https://lms.your-domain.com
```
*(Replace `lms.your-domain.com` with your actual domain name).*

### 2.3 Build and Launch Containers
Lite LMS runs its databases entirely via Docker, meaning **you do not need to install MongoDB or MariaDB directly on your Raspberry Pi.** The `docker-compose.yml` file is configured to automatically download and run the Next.js web application, MariaDB, and MongoDB in isolated networks (the databases cannot communicate with each other).

Start everything in detached mode:
```bash
docker compose up --build -d
```
Verify the containers are running:
```bash
docker compose ps
```

### 2.4 Initialize Database Schema
Run the Prisma migrations to set up the MariaDB tables.
```bash
# Run migrations inside the web container
docker compose exec web npx prisma migrate deploy
```

---

## 3. Setup Nginx Reverse Proxy & Let's Encrypt SSL

To make Lite LMS accessible from other devices in the local network securely via a domain name, we'll configure Nginx and Let's Encrypt.

### 3.1 Network Preparation
1. **Local DNS:** In your router (or separate DNS server), create a Local DNS record pointing `lms.your-domain.com` to the Raspberry Pi's local IP address (e.g., `192.168.1.100`).
2. **Public DNS (Temporary):** Let's Encrypt needs to verify your domain. Temporarily point your public DNS A record for `lms.your-domain.com` to your router's public IP, and port forward port **80** on your router to the Raspberry Pi.

### 3.2 Install Nginx & Certbot
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 3.3 Obtain Let's Encrypt SSL Certificate
*While the Pi is connected to the internet:*
```bash
sudo certbot certonly --standalone -d lms.your-domain.com
```
*(Follow the prompts to generate the certificate).*

### 3.4 Configure Nginx
Create the Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/lite-lms
```
Paste the following configuration:
```nginx
server {
    listen 80;
    server_name lms.your-domain.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name lms.your-domain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/lms.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lms.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/lite-lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

> **⚠️ Let's Encrypt Offline Expiration Warning:** 
> Let's Encrypt certificates expire every 90 days. Because the Pi will be disconnected from the internet, automatic renewal will fail. Once the certificate expires, browsers on your local network will show a "Not Secure" warning. You can either temporarily reconnect the Pi to the internet every 3 months to run `sudo certbot renew`, OR you can eventually swap to self-signed SSL certificates.

---

## 4. Make Lite LMS Accessible in Local Network

Wait 1-2 minutes for the services to fully initialize. Devices on the local network (Wi-Fi or Ethernet) can now access the platform securely:

1. Open a browser on a phone, tablet, or laptop connected to the same network.
2. Navigate to: **`https://lms.your-domain.com`**

You can now click the "Install" button in your browser (Chrome/Edge/Safari) to install the Lite LMS Progressive Web App directly to your device.

---

## 5. Log Monitoring System

Monitoring requires capturing Docker logs for the application and databases, as well as Nginx logs for incoming traffic.

### 5.1 Configure Docker Log Rotation
To prevent logs from filling up the 500GB SSD over time, configure log rotation:
```bash
sudo nano /etc/docker/daemon.json
```
Add the following JSON:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
```
Restart Docker to apply the changes:
```bash
sudo systemctl restart docker
docker compose up -d
```

### 5.2 Real-Time Monitoring Commands
To actively monitor the systems:
```bash
# Monitor Next.js application logs:
docker compose -f ~/lite-lms/docker-compose.yml logs -f web

# Monitor database logs:
docker compose -f ~/lite-lms/docker-compose.yml logs -f mysql
docker compose -f ~/lite-lms/docker-compose.yml logs -f mongo

# Monitor network/nginx logs (real-time requests & errors):
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 6. Daily Backup System

Data resilience is critical. We will automate daily backups of both databases directly to the Pi's 500GB SSD.

### 6.1 Create the Backup Script
Create a backup directory and the automation script:
```bash
mkdir -p ~/lite-lms-backups
nano ~/lite-lms/backup.sh
```
Paste this script:
```bash
#!/bin/bash
PROJECT_DIR="/home/pi/lite-lms"
BACKUP_DIR="/home/pi/lite-lms-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Extract MariaDB root password from .env
source $PROJECT_DIR/.env

# 1. Backup MariaDB (Courses, Users, Enrollments)
docker compose -f $PROJECT_DIR/docker-compose.yml exec -T mysql mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases | gzip > "$BACKUP_DIR/mariadb_backup_$TIMESTAMP.sql.gz"

# 2. Backup MongoDB (Progress, Assessment Attempts)
docker compose -f $PROJECT_DIR/docker-compose.yml exec -T mongo mongodump --archive | gzip > "$BACKUP_DIR/mongodb_backup_$TIMESTAMP.archive.gz"

# 3. Clean up older backups (keep last 30 days)
find $BACKUP_DIR -type f -mtime +30 -name '*.gz' -exec rm {} \;

echo "Backup completed successfully at $TIMESTAMP"
```

Make it executable:
```bash
chmod +x ~/lite-lms/backup.sh
```

### 6.2 Schedule the Backup
Automate the backup script to run every night at 2:00 AM using cron:
```bash
crontab -e
```
Add the following line to the bottom:
```cron
0 2 * * * /home/pi/lite-lms/backup.sh >> /home/pi/lite-lms-backups/backup.log 2>&1
```

---

## 7. Updating Code and Database Schema Offline (Air-Gapped)

Because the Raspberry Pi will be air-gapped, running standard `npm install` inside Docker will fail since there is no internet to download dependencies.

### Step A: Build the Docker Image on a Connected Machine
Whenever you have code updates or schema changes, build the Docker image on your primary **connected** developer computer first.
```bash
# On your connected Mac/PC inside the lite-lms project directory:
docker build -t litelms-web:latest .

# Save the Docker image to a tarball file:
docker save litelms-web:latest | gzip > litelms-web-update.tar.gz
```

### Step B: Transfer to Raspberry Pi
Transfer `litelms-web-update.tar.gz` and any updated `schema.prisma` files to the Raspberry Pi using a USB Drive.

### Step C: Load and Apply the Update on the Pi
```bash
# Load the updated Docker image from the USB drive:
docker load -i /media/usb/litelms-web-update.tar.gz

# Navigate to the project folder
cd ~/lite-lms

# Update the docker-compose.yml to use the local image instead of building (optional)
# Re-create the web container with the newly loaded image
docker compose up -d web

# If you made database schema changes, apply them now:
docker compose exec web npx prisma migrate deploy
```
*Your offline Raspberry Pi is now successfully updated!*

---

## 8. Final Air-Gapped Operation

After you have successfully:
1. Checked accessibility via the local domain.
2. Initialized databases and made sure backups trigger successfully.
3. Installed/Verified PWA functionality on local devices.

**You may now physically unplug the Raspberry Pi from the internet.** 

Lite LMS, Nginx, MariaDB, and MongoDB will operate seamlessly over the local air-gapped network.
