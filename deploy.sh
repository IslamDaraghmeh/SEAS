#!/bin/bash

# ===========================================
# SEAS Production Deployment Script
# ===========================================

set -e

echo "=========================================="
echo "SEAS Production Deployment"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.production to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Validate required variables
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" == "CHANGE_THIS_STRONG_PASSWORD_32_CHARS" ]; then
    echo "ERROR: Please set a secure DB_PASSWORD in .env"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "CHANGE_THIS_TO_A_VERY_LONG_RANDOM_STRING_AT_LEAST_64_CHARACTERS" ]; then
    echo "ERROR: Please set a secure JWT_SECRET in .env"
    exit 1
fi

if [ -z "$REDIS_PASSWORD" ] || [ "$REDIS_PASSWORD" == "CHANGE_THIS_STRONG_REDIS_PASSWORD" ]; then
    echo "ERROR: Please set a secure REDIS_PASSWORD in .env"
    exit 1
fi

echo "1. Building frontend for production..."
cd frontend
npm ci

# Create production environment for frontend
cat > .env.production.local << EOF
VITE_API_URL=/api
VITE_WS_URL=
VITE_IMAGE_PROCESSING_URL=
EOF

npm run build
cd ..

echo "2. Creating nginx directories..."
mkdir -p nginx/ssl nginx/logs

echo "3. Checking SSL certificates..."
if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
    echo "WARNING: SSL certificates not found in nginx/ssl/"
    echo "For testing, creating self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN:-localhost}"
    echo "For production, replace with real certificates from Let's Encrypt"
fi

echo "4. Building and starting Docker containers..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

echo "5. Waiting for services to be healthy..."
sleep 10

echo "6. Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "7. Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo ""
echo "Your application should be available at:"
echo "  - HTTP:  http://${DOMAIN:-localhost}"
echo "  - HTTPS: https://${DOMAIN:-localhost}"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To seed the database (first time only):"
echo "  docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed"
