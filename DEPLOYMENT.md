# Deployment Guide - Modbus Monitoring System

This guide will walk you through deploying the Modbus monitoring system to a VPS server.

## Prerequisites

- A VPS server with Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access to the server
- Domain names configured:
  - Frontend: `modbus.ducorr.com`
  - Backend API: `ap-modbus.ducorr.com`
- SSH access to your VPS

## Step 1: Initial Server Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### 1.2 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Required Software

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install Certbot (for SSL certificates)
sudo apt install certbot python3-certbot-nginx -y

# Verify installations
docker --version
docker-compose --version
nginx -v
```

### 1.4 Create Application Directory

```bash
sudo mkdir -p /var/www/modbus
sudo chown $USER:$USER /var/www/modbus
cd /var/www/modbus
```

## Step 2: Configure Domain Names (DNS)

Before proceeding, ensure your DNS records are configured:

1. **A Record for Frontend:**
   - Name: `modbus.ducorr.com`
   - Type: A
   - Value: Your VPS IP address

2. **A Record for Backend API:**
   - Name: `ap-modbus.ducorr.com`
   - Type: A
   - Value: Your VPS IP address

Wait for DNS propagation (can take up to 48 hours, usually much faster).

## Step 3: Clone Repository from GitHub

### 3.1 Install Git (if not already installed)

```bash
sudo apt install git -y
```

### 3.2 Clone Your Repository

```bash
cd /var/www/modbus
git clone https://github.com/your-username/modbus.git .
# Replace 'your-username' with your actual GitHub username
```

## Step 4: Configure Environment Variables

### 4.1 Create Production Environment File

```bash
cd /var/www/modbus
cp env.prod.example .env
nano .env
```

### 4.2 Update .env File with Production Values

```env
NODE_ENV=prod

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://ap-modbus.ducorr.com

# Backend Configuration
PORT=3001
FRONTEND_URL=https://modbus.ducorr.com

# Modbus Device Configuration
MODBUS_HOST=192.168.100.40
MODBUS_PORT=502
MODBUS_SLAVE_ID=1
MODBUS_TYPE=TCP
MODBUS_TIMEOUT=2000
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 5: Configure Nginx Reverse Proxy

### 5.1 Create Nginx Configuration for Frontend

```bash
sudo nano /etc/nginx/sites-available/modbus-frontend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name modbus.ducorr.com;

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

### 5.2 Create Nginx Configuration for Backend API

```bash
sudo nano /etc/nginx/sites-available/modbus-backend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name ap-modbus.ducorr.com;

    location / {
        proxy_pass http://localhost:3001;
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

### 5.3 Enable Nginx Sites

```bash
sudo ln -s /etc/nginx/sites-available/modbus-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/modbus-backend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Step 6: Obtain SSL Certificates

```bash
# Get SSL certificate for frontend
sudo certbot --nginx -d modbus.ducorr.com

# Get SSL certificate for backend
sudo certbot --nginx -d ap-modbus.ducorr.com

# Certbot will automatically update your Nginx configs with SSL
```

## Step 7: Build and Start Docker Containers

### 7.1 Build and Start Services

```bash
cd /var/www/modbus
docker-compose build
docker-compose up -d
```

### 7.2 Verify Containers are Running

```bash
docker-compose ps
docker-compose logs -f
```

You should see both `modbus-backend` and `modbus-frontend` containers running.

## Step 8: Verify Deployment

### 8.1 Check Container Status

```bash
docker ps
```

### 8.2 Test Frontend

Open your browser and visit:
- `https://modbus.ducorr.com`

### 8.3 Test Backend API

Test the API endpoint:
```bash
curl https://ap-modbus.ducorr.com/modbus/read?type=holding&address=0&quantity=1
```

## Step 9: Set Up Auto-Start on Reboot

### 9.1 Enable Docker Service

```bash
sudo systemctl enable docker
```

### 9.2 Create Systemd Service for Docker Compose (Optional)

```bash
sudo nano /etc/systemd/system/modbus.service
```

Add:

```ini
[Unit]
Description=Modbus Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/modbus
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable the service:

```bash
sudo systemctl enable modbus.service
sudo systemctl start modbus.service
```

## Step 10: Firewall Configuration

### 10.1 Configure UFW Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Maintenance Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services

```bash
docker-compose restart
# or restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Update Application

```bash
cd /var/www/modbus
git pull
docker-compose build
docker-compose up -d
```

### Stop Services

```bash
docker-compose down
```

### Start Services

```bash
docker-compose up -d
```

## Troubleshooting

### Check if ports are in use

```bash
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
```

### Check Docker container logs

```bash
docker logs modbus-backend
docker logs modbus-frontend
```

### Check Nginx logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### Check SSL certificate renewal

```bash
sudo certbot renew --dry-run
```

SSL certificates auto-renew via certbot timer, but you can manually renew:

```bash
sudo certbot renew
```

## Security Recommendations

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords** for SSH access

3. **Consider setting up fail2ban:**
   ```bash
   sudo apt install fail2ban -y
   ```

4. **Regular backups** of your `.env` file and database (if you add one later)

5. **Monitor logs regularly** for any suspicious activity

## Next Steps

- Set up monitoring (e.g., PM2, or Docker health checks)
- Configure automated backups
- Set up CI/CD pipeline for easier deployments
- Add monitoring and alerting tools

## Support

If you encounter issues:
1. Check container logs: `docker-compose logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables in `.env` file
4. Ensure DNS records are properly configured

