# Lite LMS — Configuration and Deployment Guide

This guide provides step-by-step instructions to deploy the Lite LMS Progressive Web App (PWA) **natively** on a **Raspberry Pi 4 Model B (8GB RAM, 500GB SSD)**.

## Environment Overview
- **Hardware:** Raspberry Pi 4 Model B (8GB RAM, 500GB SSD)
- **OS:** Raspberry Pi OS (64-bit)
- **Runtime:** Node.js 20 LTS + PM2 process manager
- **Databases:** MariaDB 10.11 (relational) + MongoDB 4.4.18 (document)
- **Web Server:** Nginx reverse proxy with self-signed SSL
- **Target Status:** Air-gapped local network (disconnected from the internet permanently)

> **⚠️ AIR-GAPPED NOTE:** You will perform the initial setup while connected to the internet to install packages. After setup is complete, the Raspberry Pi will be disconnected and operate in an air-gapped local network.

---

## 1. Install Node.js 20 LTS

```bash
# Add NodeSource repository for Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js (includes npm)
sudo apt install -y nodejs

# Verify installation
node -v   # Should output v20.x.x
npm -v    # Should output 10.x.x

# Install PM2 globally (process manager to keep the app alive)
sudo npm install -g pm2
```

---

## 2. Install MariaDB

```bash
# Install MariaDB server
sudo apt update
sudo apt install -y mariadb-server

# Start and enable MariaDB to run on boot
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure the installation (set root password, remove anonymous users, etc.)
sudo mysql_secure_installation
```

### 2.1 Create the Database and User
```bash
sudo mariadb -u root -p
```
Run the following SQL commands inside the MariaDB shell:
```sql
CREATE DATABASE litelms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'litelms'@'localhost' IDENTIFIED BY 'YourStrongPassword2026!';
GRANT ALL PRIVILEGES ON litelms.* TO 'litelms'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
*(Replace `YourStrongPassword2026!` with a strong, unique password.)*

### 2.2 Verify
```bash
sudo mariadb -u litelms -p -e "SHOW DATABASES;"
```
You should see `litelms` in the output.

---

## 3. Install MongoDB 4.4.18

> **⚠️ ARM CPU CONSTRAINT:** The Raspberry Pi 4 uses a Cortex-A72 CPU (ARMv8.0-A). MongoDB versions ≥ 4.4.19 require ARMv8.2-A and will crash with an `Illegal instruction` error. You **must** use version 4.4.18 or earlier.

```bash
# MongoDB 4.4 requires libssl1.1 which is not available in modern Debian (Bookworm ships libssl3)
# Temporarily add Debian Bullseye security repo to install it
echo "deb http://security.debian.org/debian-security bullseye-security main" | sudo tee /etc/apt/sources.list.d/bullseye-security.list
sudo apt update
sudo apt install -y libssl1.1
sudo rm /etc/apt/sources.list.d/bullseye-security.list
sudo apt update

# Add the MongoDB 4.4 repository for ARM64
# Note: [trusted=yes] is required because MongoDB 4.4's GPG key uses SHA1,
# which is no longer accepted by modern OS security policies (deprecated Feb 2026).
echo "deb [ arch=arm64 trusted=yes ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Update and install MongoDB 4.4.18 specifically
sudo apt update
sudo apt install -y mongodb-org=4.4.18 mongodb-org-server=4.4.18 mongodb-org-shell=4.4.18 mongodb-org-mongos=4.4.18 mongodb-org-tools=4.4.18

# Pin the version to prevent accidental upgrades
echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-org-shell hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3.1 Create the Database User
```bash
mongo
```
Run the following commands inside the MongoDB shell:
```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "YourMongoPassword2026!",
  roles: [{ role: "readWriteAnyDatabase", db: "admin" }]
});
exit
```

### 3.2 Enable Authentication
```bash
sudo nano /etc/mongod.conf
```
Find and update the `security` section:
```yaml
security:
  authorization: enabled
```
Restart MongoDB:
```bash
sudo systemctl restart mongod
```

### 3.3 Verify
```bash
mongo -u admin -p "YourMongoPassword2026!" --authenticationDatabase admin --eval "db.adminCommand('ping')"
```
Should return `{ "ok" : 1 }`.

---

## 4. Deploy the Next.js Application

### 4.1 Clone and Install
```bash
cd ~
git clone https://github.com/aries2061/LiteLMS.git
cd LiteLMS
npm install
```

### 4.2 Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
Fill in your actual credentials:
```env
# Database URLs
DATABASE_URL=mysql://litelms:YourStrongPassword2026!@localhost:3306/litelms
MONGODB_URI=mongodb://admin:YourMongoPassword2026!@localhost:27017/litelms?authSource=admin

# NextAuth.js
NEXTAUTH_SECRET=your-random-32-character-secret
NEXTAUTH_URL=https://lms.your-domain.com
```
*(Generate NEXTAUTH_SECRET with: `openssl rand -base64 32`)*

### 4.3 Generate Prisma Client and Run Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

### 4.4 Build and Start the Application
```bash
# Build the production bundle
npm run build

# Start with PM2 (keeps the app alive and auto-restarts on crash)
pm2 start npm --name "lite-lms" -- start

# Save the PM2 process list so it auto-starts on boot
pm2 save
pm2 startup
```
*(Follow the instructions printed by `pm2 startup` to enable auto-start on boot.)*

### 4.5 Verify
```bash
curl http://localhost:3000
```
You should see the full Lite LMS HTML page.

---

## 5. Setup Nginx Reverse Proxy & Self-Signed SSL

### 5.1 Network Preparation
In your router (or DNS server), create a Local DNS record pointing `lms.your-domain.com` to the Raspberry Pi's local IP address (e.g., `192.168.1.100`).

### 5.2 Install Nginx & OpenSSL
```bash
sudo apt update
sudo apt install nginx openssl -y
```

### 5.3 Generate Self-Signed SSL Certificate
Generate a certificate valid for 10 years (3650 days):
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/litelms.key \
  -out /etc/nginx/ssl/litelms.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=lms.your-domain.com"
```

### 5.4 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/lite-lms
```
Paste the following configuration:
```nginx
server {
    listen 80;
    server_name lms.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name lms.your-domain.com;

    ssl_certificate /etc/nginx/ssl/litelms.crt;
    ssl_certificate_key /etc/nginx/ssl/litelms.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

> **⚠️ Self-Signed Browser Warning:**
> When you first navigate to the site on a new device, your browser will show a privacy warning. Click **"Advanced"** → **"Proceed to lms.your-domain.com (unsafe)"** to accept the self-signed certificate.

---

## 6. Verify Access

1. Open a browser on a phone, tablet, or laptop connected to the same network.
2. Navigate to: **`https://lms.your-domain.com`**
3. Accept the self-signed certificate warning.
4. You should see the Lite LMS landing page.
5. Install the PWA via the browser's "Install" button.

---

## 7. Log Monitoring

```bash
# Next.js application logs (via PM2):
pm2 logs lite-lms

# MariaDB logs:
sudo journalctl -u mariadb -f

# MongoDB logs:
sudo journalctl -u mongod -f

# Nginx access and error logs:
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 8. Daily Backup System

### 8.1 Create the Backup Script
```bash
mkdir -p ~/lite-lms-backups
nano ~/LiteLMS/backup.sh
```
Paste this script:
```bash
#!/bin/bash
BACKUP_DIR="/home/pi/lite-lms-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 1. Backup MariaDB
mariadb-dump -u litelms -p"YourStrongPassword2026!" litelms | gzip > "$BACKUP_DIR/mariadb_backup_$TIMESTAMP.sql.gz"

# 2. Backup MongoDB
mongodump --uri="mongodb://admin:YourMongoPassword2026!@localhost:27017/litelms?authSource=admin" --archive | gzip > "$BACKUP_DIR/mongodb_backup_$TIMESTAMP.archive.gz"

# 3. Clean up older backups (keep last 30 days)
find $BACKUP_DIR -type f -mtime +30 -name '*.gz' -exec rm {} \;

echo "Backup completed successfully at $TIMESTAMP"
```
Make it executable:
```bash
chmod +x ~/LiteLMS/backup.sh
```

### 8.2 Schedule the Backup
```bash
crontab -e
```
Add the following line:
```cron
0 2 * * * /home/pi/LiteLMS/backup.sh >> /home/pi/lite-lms-backups/backup.log 2>&1
```

---

## 9. Updating Code Offline (Air-Gapped)

Since the Raspberry Pi is disconnected from the internet, you cannot run `npm install` or `git pull` directly.

### Step A: Prepare the Update on a Connected Machine
On your connected Mac/PC:
```bash
cd ~/MyWorkSpace/lite-lms

# Make your code changes, then:
npm install          # Install any new dependencies
npm run build        # Verify the build succeeds

# Create a portable transfer bundle:
tar -czf litelms-update.tar.gz \
  --exclude='.git' \
  --exclude='.env' \
  .
```

### Step B: Transfer to the Raspberry Pi
Copy `litelms-update.tar.gz` to a USB drive and physically transfer it to the Pi.

### Step C: Apply the Update on the Pi
```bash
# Mount the USB drive (if not auto-mounted)
sudo mount /dev/sda1 /media/usb

# Backup the current deployment
cp -r ~/LiteLMS ~/LiteLMS-backup-$(date +%Y%m%d)

# Extract the update
cd ~/LiteLMS
tar -xzf /media/usb/litelms-update.tar.gz --strip-components=0

# Apply any new database migrations
npx prisma migrate deploy

# Rebuild and restart
npm run build
pm2 restart lite-lms
```
*Your offline Raspberry Pi is now successfully updated!*

---

## 10. Final Air-Gapped Operation

After you have successfully:
1. Verified accessibility via the local domain from other devices.
2. Confirmed database connections and migrations are applied.
3. Verified backups trigger successfully.
4. Installed the PWA on local devices.

**You may now physically unplug the Raspberry Pi from the internet.**

Lite LMS, Nginx, MariaDB, and MongoDB will operate seamlessly over the local air-gapped network. PM2 will automatically restart the Next.js application if the Pi reboots.
