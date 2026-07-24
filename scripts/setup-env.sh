#!/usr/bin/env bash
# Script de configuracion automatica de .env para el Backend Strapi
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
    read -rp "El archivo .env ya existe. Desea sobrescribirlo? (s/N): " CONFIRM
    if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
        echo "Operacion cancelada."
        exit 0
    fi
fi

echo "Generando archivo .env con llaves de seguridad aleatorias..."

APP_KEY_1=$(openssl rand -base64 24)
APP_KEY_2=$(openssl rand -base64 24)
APP_KEY_3=$(openssl rand -base64 24)
APP_KEY_4=$(openssl rand -base64 24)
API_TOKEN_SALT=$(openssl rand -base64 24)
ADMIN_JWT_SECRET=$(openssl rand -base64 24)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 24)
ENCRYPTION_KEY=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 24)

cat <<EOF > .env
# Server
HOST=0.0.0.0
PORT=1337

# Secrets
APP_KEYS=${APP_KEY_1},${APP_KEY_2},${APP_KEY_3},${APP_KEY_4}
API_TOKEN_SALT=${API_TOKEN_SALT}
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
JWT_SECRET=${JWT_SECRET}

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi_secure_password_$(openssl rand -hex 6)
DATABASE_SSL=false
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_FILENAME=
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=5

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-correo@gmail.com
SMTP_PASSWORD=tu-contrasena-de-aplicacion
EMAIL_DEFAULT_FROM=tu-correo@gmail.com
EMAIL_DEFAULT_REPLY_TO=tu-correo@gmail.com

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Telemetry
STRAPI_TELEMETRY_DISABLED=true
EOF

echo "Archivo .env creado exitosamente con llaves y secretos seguros."
