#!/bin/bash

# ===========================================
# AWS EC2 Initial Setup Script
# Run this on a fresh Ubuntu 22.04/24.04 EC2 instance
# ===========================================

set -e

echo "=========================================="
echo "EC2 Setup for SEAS Application"
echo "=========================================="

# Update system
echo "1. Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "2. Installing required packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    unzip

# Install Docker
echo "3. Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Node.js (for building frontend locally if needed)
echo "4. Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Certbot for SSL
echo "5. Installing Certbot..."
sudo apt-get install -y certbot

# Configure firewall
echo "6. Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create application directory
echo "7. Creating application directory..."
sudo mkdir -p /opt/seas
sudo chown $USER:$USER /opt/seas

# Set up swap (recommended for small instances)
echo "8. Setting up swap space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Create systemd service for auto-restart
echo "9. Creating systemd service..."
sudo tee /etc/systemd/system/seas.service > /dev/null <<EOF
[Unit]
Description=SEAS Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/seas
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable seas.service

echo "=========================================="
echo "EC2 Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Log out and log back in (for docker group)"
echo "2. Clone your repository to /opt/seas"
echo "3. Copy .env.production to .env and configure"
echo "4. Run: ./deploy.sh"
echo ""
echo "For SSL with Let's Encrypt:"
echo "  sudo certbot certonly --standalone -d your-domain.com"
echo "  sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/seas/nginx/ssl/"
echo "  sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/seas/nginx/ssl/"
