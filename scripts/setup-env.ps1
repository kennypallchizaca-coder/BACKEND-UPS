# Script de configuracion automatica de .env para el Backend Strapi (PowerShell)
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Resolve-Path "$ScriptDir\.."
Set-Location $ProjectDir

if (Test-Path ".env") {
    $Confirm = Read-Host "El archivo .env ya existe. Desea sobrescribirlo? (s/N)"
    if ($Confirm -ne "s" -and $Confirm -ne "S") {
        Write-Host "Operacion cancelada."
        exit 0
    }
}

Write-Host "Generando archivo .env con llaves de seguridad aleatorias..." -ForegroundColor Cyan

function New-Base64Key {
    $bytes = New-Object byte[] 24
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function New-HexPass {
    $bytes = New-Object byte[] 6
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return [System.BitConverter]::ToString($bytes).Replace("-","").ToLower()
}

$Key1 = New-Base64Key
$Key2 = New-Base64Key
$Key3 = New-Base64Key
$Key4 = New-Base64Key
$ApiSalt = New-Base64Key
$AdminJwt = New-Base64Key
$TransferSalt = New-Base64Key
$EncKey = New-Base64Key
$JwtSecret = New-Base64Key
$DbPass = "strapi_secure_password_" + (New-HexPass)

$EnvContent = @"
# Server
HOST=0.0.0.0
PORT=1337

# Secrets
APP_KEYS=${Key1},${Key2},${Key3},${Key4}
API_TOKEN_SALT=${ApiSalt}
ADMIN_JWT_SECRET=${AdminJwt}
TRANSFER_TOKEN_SALT=${TransferSalt}
ENCRYPTION_KEY=${EncKey}
JWT_SECRET=${JwtSecret}

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=${DbPass}
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
"@

Set-Content -Path ".env" -Value $EnvContent -Encoding UTF8
Write-Host "Archivo .env creado exitosamente con llaves y secretos seguros." -ForegroundColor Green
