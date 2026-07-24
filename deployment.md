# Guia de Despliegue e Instalacion Completa -- Backend CRM (Strapi v5 + PostgreSQL + Docker)

Esta guia contiene el procedimiento paso a paso, detallado y libre de fallos para instalar los requisitos previos, clonar el repositorio, configurar las variables de entorno (.env), construir las imagenes de Docker, desplegar el backend CMS (Strapi v5.48 + Node.js 22 + PostgreSQL 16 + Nodemailer SMTP), crear el usuario administrador y configurar los permisos de la API publica en la interfaz grafica de Strapi.

---

## Tabla de Contenidos

1. Paso 1: Clonacion del Repositorio desde Git
2. Paso 2: Instalacion de Requisitos Previos del Sistema
3. Paso 3: Configuracion del Archivo de Variables de Entorno (.env)
   - Metodo A: Configuracion Manual a Mano (Recomendado)
   - Metodo B: Configuracion Automatica via Script
4. Paso 4: Explicacion Detallada de Cada Variable de Entorno (.env)
5. Paso 5: Compilacion y Despliegue con Docker Compose (Strapi + PostgreSQL)
6. Paso 6: Registro del Administrador y Configuracion de Permisos en la GUI de Strapi
7. Paso 7: Verificacion de Conectividad y Pruebas de la API REST
8. Paso 8: Respaldos y Restauracion de Base de Datos PostgreSQL
9. Paso 9: Despliegue en Entornos de Produccion (Servidor VPS / Nube)
10. Paso 10: Ejecucion Manual en Modo Desarrollo sin Docker (pnpm run develop)
11. Paso 11: Compilacion y Ejecucion de Contenedor Individual (Docker CLI)
12. Referencia de Comandos Utiles de Docker
13. Guia de Diagnostico y Solucion de Fallos Frecuentes

---

## 1. Paso 1: Clonacion del Repositorio desde Git

Abra una terminal (PowerShell, CMD, Git Bash o Terminal de Linux) y ejecute los siguientes comandos:

```bash
# 1. Clonar el repositorio del backend
git clone https://github.com/Computacion-UPS/icc-pp-landing-back.git sitemacrmbackend

# 2. Entrar a la carpeta del proyecto
cd sitemacrmbackend
```

---

## 2. Paso 2: Instalacion de Requisitos Previos del Sistema

### 2.1 Requisitos de Hardware y Sistema Operativo
* **Sistema Operativo**: Linux (Ubuntu 20.04/22.04+, Debian), Windows 10/11 (con WSL2 habilitado) o macOS.
* **Procesador (CPU)**: 2 Cores como minimo (4 Cores recomendados para produccion).
* **Memoria RAM**: 2 GB como minimo (4 GB recomendados debido a que la compilacion de Strapi consume memoria).
* **Almacenamiento**: 10 GB de espacio libre en disco.

### 2.2 Requisitos de Software y Versiones Minimnas
Asegurese de contar con las siguientes herramientas instaladas con las versiones correctas:

* **Node.js**: Requerido version `18.x`, `20.x` o `22.x` (Estrictamente LTS). Versiones impares (19.x, 21.x) o muy antiguas (16.x) causaran fallos criticos en Strapi v5.
* **Administrador de Paquetes (pnpm)**: Altamente recomendado sobre npm. (Verificacion: `pnpm -v`, instalacion: `npm install -g pnpm`).
* **Git**: Version `2.x` o superior. (Verificacion: `git --version`).
* **Docker Engine**: Version `24.x` o superior. (Verificacion: `docker --version`).
* **Docker Compose**: Version `2.x` o superior. (Verificacion: `docker compose version`).

### 2.3 Detalles de Instalacion por Herramienta

#### Git
* **Descripcion**: Control de versiones necesario para clonar el proyecto.
* **Instalacion**:
  * **Windows**: Descargar desde https://git-scm.com/download/win
  * **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install -y git`
  * **macOS**: `brew install git`

#### Node.js y pnpm
* **Descripcion**: Entorno de ejecucion para javascript y su gestor de paquetes ultra rapido.
* **Instalacion**:
  * Descargue el instalador oficial de Node.js LTS desde https://nodejs.org/
  * Tras instalar Node, abra la terminal y ejecute `npm install -g pnpm`

#### Docker Engine y Docker Desktop
* **Descripcion**: Motor de contenedores requerido para ejecutar Strapi y PostgreSQL sin instalar bases de datos manuales.
* **Instalacion**:
  * **Windows**: Descargar e instalar Docker Desktop desde https://docs.docker.com/desktop/install/windows-install/ asegurandose de tener WSL 2 habilitado.
  * **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin`
  * **macOS**: Descargar Docker Desktop desde https://docs.docker.com/desktop/install/mac-install/

---

## 3. Paso 3: Configuracion del Archivo de Variables de Entorno (.env)

El archivo `.env` almacena la configuracion del servidor, las llaves secretas en base64 de Strapi v5, la conexion a PostgreSQL y las credenciales SMTP para envio de correos.

### Metodo A: Configuracion Manual a Mano (Recomendado)

#### Sub-paso 3.1: Copiar el Archivo de Ejemplo

En la raiz de `sitemacrmbackend`, copie el archivo `.env.example` para crear el archivo `.env`:

* **En Linux / macOS:**
  ```bash
  cp .env.example .env
  ```
* **En Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```

#### Sub-paso 3.2: Generar las 6 Llaves Secretas en Base64

Strapi v5 requiere 6 llaves criptograficas unicas en formato base64. Puede generarlas con cualquiera de estos metodos:

* **Usando openssl en Linux / macOS / Git Bash:**
  Ejecute el comando 6 veces (una por cada secreto):
  ```bash
  openssl rand -base64 24
  ```

* **Usando PowerShell en Windows:**
  Ejecute el comando 6 veces:
  ```powershell
  [Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
  ```

#### Sub-paso 3.3: Editar el Archivo .env a Mano

Abra `.env` en su editor de texto (VS Code, Notepad, Nano) y pegue las llaves generadas en los campos correspondientes:

```env
# ---------------------------------------------------------------------------
# Servidor
# ---------------------------------------------------------------------------
HOST=0.0.0.0
PORT=1337

# ---------------------------------------------------------------------------
# Secretos de Strapi (Reemplazar con las llaves base64 generadas en el sub-paso 3.2)
# ---------------------------------------------------------------------------
APP_KEYS=llavebase64uno==,llavebase64dos==,llavebase64tres==,llavebase64cuatro==
API_TOKEN_SALT=salt-api-token-base64==
ADMIN_JWT_SECRET=jwt-admin-secret-base64==
TRANSFER_TOKEN_SALT=transfer-token-salt-base64==
ENCRYPTION_KEY=encryption-key-base64==
JWT_SECRET=jwt-user-secret-base64==

# ---------------------------------------------------------------------------
# Base de Datos PostgreSQL (Docker Compose crea la BD automaticamente)
# ---------------------------------------------------------------------------
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi_dev_password
DATABASE_SSL=false
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=5

# ---------------------------------------------------------------------------
# SMTP -- Envio de Correos Electronicos
# ---------------------------------------------------------------------------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-correo@gmail.com
SMTP_PASSWORD=tu-contrasena-de-aplicacion
EMAIL_DEFAULT_FROM=tu-correo@gmail.com
EMAIL_DEFAULT_REPLY_TO=tu-correo@gmail.com

# ---------------------------------------------------------------------------
# CORS -- Origenes Permitidos para el Frontend
# ---------------------------------------------------------------------------
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ---------------------------------------------------------------------------
# Telemetria
# ---------------------------------------------------------------------------
STRAPI_TELEMETRY_DISABLED=true
```

### Metodo B: Configuracion Automatica via Script (Opcional)

Si prefiere que un script cree `.env` e inyecte los secretos base64 de forma automatica:

* **En Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\setup-env.ps1
  ```
* **En Linux / macOS (Bash):**
  ```bash
  bash scripts/setup-env.sh
  ```

---

## 4. Paso 4: Explicacion Detallada de Cada Variable de Entorno (.env)

### 4.1 Servidor y Entorno

| Variable | Descripcion | Valor Recomendado | Impacto si no se configura |
|---|---|---|---|
| `HOST` | IP de escucha dentro del contenedor | `0.0.0.0` | Obligatorio. Strapi no acepta conexiones externas sin este valor. |
| `PORT` | Puerto interno del servidor Strapi | `1337` | Define en que puerto escucha el backend. |
| `NODE_ENV` | Entorno de ejecucion | `production` | Activa optimizaciones, seguridad y validaciones. |

### 4.2 Secretos Criptograficos (Base64)

| Variable | Descripcion | Impacto si no se configura |
|---|---|---|
| `APP_KEYS` | 4 llaves base64 separadas por coma para firmar cookies de sesion | **Strapi no inicia**. Error critico. |
| `API_TOKEN_SALT` | Salt para generar tokens de API REST | Falla la emision de API tokens. |
| `ADMIN_JWT_SECRET` | Secreto para firmar tokens JWT del panel admin | Invalida todos los inicios de sesion del administrador. |
| `TRANSFER_TOKEN_SALT` | Salt para token de migracion de datos | Falla el comando `strapi transfer`. |
| `ENCRYPTION_KEY` | Clave de encriptacion de datos sensibles en BD | Falla la encriptacion de secretos almacenados. |
| `JWT_SECRET` | Secreto JWT para la API publica de usuarios | Invalida login de usuarios finales. |

### 4.3 Base de Datos PostgreSQL

| Variable | Descripcion | Valor Recomendado | Impacto si no se configura |
|---|---|---|---|
| `DATABASE_CLIENT` | Tipo de base de datos | `postgres` | Strapi intentara usar SQLite (no apto para produccion). |
| `DATABASE_HOST` | Host del servidor de base de datos | `postgres` (Docker) | Debe coincidir con el nombre del servicio en docker-compose.yml. |
| `DATABASE_PORT` | Puerto de PostgreSQL | `5432` | Puerto estandar. |
| `DATABASE_NAME` | Nombre de la base de datos | `strapi` | Se crea automaticamente al iniciar el contenedor de PostgreSQL. |
| `DATABASE_USERNAME` | Usuario de PostgreSQL | `strapi` | Credencial de acceso a la BD. |
| `DATABASE_PASSWORD` | Contrasena de PostgreSQL | Contrasena segura | Credencial de acceso a la BD. |
| `DATABASE_SSL` | Conexion SSL a la BD | `false` (local) / `true` (remoto) | Si la BD remota exige SSL y esta en `false`, falla la conexion. |
| `DATABASE_POOL_MIN` | Conexiones minimas en el pool | `1` | Afecta rendimiento bajo carga. |
| `DATABASE_POOL_MAX` | Conexiones maximas en el pool | `5` | Limita la concurrencia de consultas. |

### 4.4 SMTP (Envio de Correos)

| Variable | Descripcion | Valor Recomendado | Impacto si no se configura |
|---|---|---|---|
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` | Sin correos, los formularios no envian notificaciones. |
| `SMTP_PORT` | Puerto SMTP | `587` | Puerto STARTTLS. |
| `SMTP_USERNAME` | Correo remitente SMTP | `tu-correo@gmail.com` | Usuario de autenticacion SMTP. |
| `SMTP_PASSWORD` | Contrasena de aplicacion SMTP | App Password de Google | Requiere App Password de 16 caracteres. La contrasena personal de Gmail no funciona. |
| `EMAIL_DEFAULT_FROM` | Remitente predeterminado | `tu-correo@gmail.com` | Correo que aparece como remitente. |
| `EMAIL_DEFAULT_REPLY_TO` | Correo de respuesta | `tu-correo@gmail.com` | Correo al que responderan los destinatarios. |

### 4.5 CORS y Telemetria

| Variable | Descripcion | Valor Recomendado | Impacto si no se configura |
|---|---|---|---|
| `CORS_ORIGINS` | Dominios autorizados para cross-origin | `http://localhost:3000,http://localhost:5173` | El navegador bloquea las solicitudes del frontend. |
| `STRAPI_TELEMETRY_DISABLED` | Desactiva telemetria de Strapi | `true` | Si es `false`, Strapi envia datos anonimos a sus servidores. |

---

## 5. Paso 5: Compilacion y Despliegue con Docker Compose (Strapi + PostgreSQL)

Una vez preparado el archivo `.env`, inicie los servicios en la raiz de `sitemacrmbackend`:

```bash
docker compose up --build -d
```

### Que sucede internamente al ejecutar este comando:
1. **Creacion Automatica de la Base de Datos**: Docker descarga e inicia la imagen `postgres:16-alpine`. PostgreSQL lee las variables `POSTGRES_DB` y `POSTGRES_USER` del `.env` y **crea automaticamente la base de datos `strapi` y el usuario sin necesidad de ningun comando SQL manual**.
2. **Volumen Persistente**: Crea el volumen `postgres-data` para resguardar los datos aun si el contenedor se elimina.
3. **Verificacion de Salud (Healthcheck)**: Ejecuta `pg_isready` para confirmar que PostgreSQL esta listo para aceptar conexiones.
4. **Creacion Automatica de Tablas**: Strapi v5 se conecta a PostgreSQL y **crea automaticamente todas las tablas relacionales** (usuarios, leads, empresas, grupos de investigacion, noticias, plantillas de correo) y ejecuta la funcion `bootstrap` que siembra los datos iniciales.
5. **Exposicion del Servicio**: Levanta el contenedor `backend-strapi` exponiendo el puerto `1337`.

### Verificar el Estado de los Contenedores
```bash
docker compose ps
```
Debe observar los contenedores `backend-postgres` y `backend-strapi` con estado `healthy`.

### Si algo falla, consulte los logs
```bash
docker compose logs -f
```

---

## 6. Paso 6: Registro del Administrador y Configuracion de Permisos en la GUI de Strapi

### 6.1 Registro del Primer Usuario Administrador
1. Abra su navegador de internet e ingrese a `http://localhost:1337/admin`.
2. En la pantalla de bienvenida, complete el formulario de registro del superadministrador:
   * **Nombre**: Nombre del administrador (ejemplo: `Admin`).
   * **Apellido**: Apellido del administrador (ejemplo: `CRM`).
   * **Correo Electronico**: Correo de acceso al panel (ejemplo: `admin@ups.edu.ec`).
   * **Contrasena**: Asigne una contrasena fuerte (minimo 8 caracteres, incluyendo mayusculas, numeros y simbolos).
3. Haga clic en el boton **Empezar** o **Let's start**.
4. Al ingresar por primera vez, Strapi ejecuta la funcion `bootstrap` que siembra las plantillas de correo para Admisiones y Empresas.

### 6.2 Configuracion de Permisos de la API Publica (Roles & Permissions)

Para que el sitio web Frontend pueda consumir el contenido dinamico y enviar formularios publicos sin requerir token de autenticacion, debe activar los permisos en la GUI de Strapi:

1. En el menu lateral izquierdo, haga clic en **Ajustes** (icono de engranaje) o **Settings**.
2. En la seccion **USERS & PERMISSIONS PLUGIN**, seleccione **Roles**.
3. Haga clic en el rol **Public** para editar sus permisos.
4. Configure los permisos de cada Content-Type segun la tabla siguiente:

#### A. Formularios Publicos -- Marcar unicamente `create`:

| Content-Type | Permiso | Descripcion |
|---|---|---|
| **Lead** | `create` | Permite registrar solicitudes de interesados / admisiones desde la web. |
| **Company Request** | `create` | Permite enviar solicitudes de convenios y practicas empresariales desde la web. |

#### B. Contenido Publico del Portal Web -- Marcar `find` y `findOne`:

| Content-Type | Permisos | Descripcion |
|---|---|---|
| **Hero Slide** | `find`, `findOne` | Diapositivas del carrusel principal de la pagina de inicio. |
| **Landing Content** | `find`, `findOne` | Secciones y textos dinamicos de la pagina de inicio. |
| **Alliance** | `find`, `findOne` | Alianzas institucionales (convenios con universidades, empresas). |
| **ASU Group** | `find`, `findOne` | Grupos asociativos salesianos. |
| **Research Group** | `find`, `findOne` | Grupos de investigacion de la carrera. |
| **Success Case** | `find`, `findOne` | Casos de exito de graduados y egresados. |
| **Publication** | `find`, `findOne` | Publicaciones de noticias, eventos y avisos. |
| **Company** | `find`, `findOne` | Directorio de empresas aliadas y colaboradoras. |

#### C. Modulos Internos de Administracion -- NO marcar nada (dejar desmarcados):

Los siguientes modulos deben permanecer **sin permisos publicos** por motivos de seguridad:
`activity-log`, `company-email-setting`, `company-email-template`, `dashboard`, `email-log`, `email-notification`, `email-setting`, `email-template`, `health-db`.

5. Haga clic en el boton **Guardar** (**Save**) en la esquina superior derecha de la pantalla.

---

## 7. Paso 7: Verificacion de Conectividad y Pruebas de la API REST

### 7.1 Verificar el Content Manager
1. En el menu lateral izquierdo de Strapi, haga clic en **Content Manager**.
2. Verifique que aparezcan las colecciones: Lead, Company Request, Hero Slide, Landing Content, Alliance, ASU Group, Research Group, Success Case, Publication, Company, Email Template, Activity Log, etc.
3. Haga clic en la coleccion **Email Template** y confirme que existan los registros `formulario-admisiones` y `formulario-empresas`.

### 7.2 Probar los Endpoints de la API REST
Abra las siguientes URLs en su navegador o con `curl`. Todas deben responder con estado HTTP `200 OK` y un objeto JSON:

| Endpoint | Resultado Esperado |
|---|---|
| `http://localhost:1337/_health` | `{"status":"ok"}` o Estado HTTP `200 OK`. |
| `http://localhost:1337/api/leads` | Objeto JSON con datos de leads (puede estar vacio si no hay registros). |
| `http://localhost:1337/api/hero-slides` | Objeto JSON con diapositivas del carrusel. |
| `http://localhost:1337/api/landing-contents` | Objeto JSON con secciones de la pagina de inicio. |
| `http://localhost:1337/api/alliances` | Objeto JSON con alianzas institucionales. |
| `http://localhost:1337/api/research-groups` | Objeto JSON con grupos de investigacion. |
| `http://localhost:1337/api/success-cases` | Objeto JSON con casos de exito. |
| `http://localhost:1337/api/publications` | Objeto JSON con publicaciones y noticias. |

Si alguno de estos endpoints responde con error `403 Forbidden`, regrese al Paso 6.2 y verifique que los permisos `find` y `findOne` esten marcados para ese Content-Type en el rol **Public**.

---

## 8. Paso 8: Respaldos y Restauracion de Base de Datos PostgreSQL

### Crear un Respaldo de la Base de Datos (Dump)

* **En Linux / macOS:**
  ```bash
  docker compose exec -T postgres pg_dump -U strapi -d strapi | gzip > backup_backend_$(date +%Y%m%d_%H%M%S).sql.gz
  ```
* **En Windows (PowerShell):**
  ```powershell
  docker compose exec -T postgres pg_dump -U strapi -d strapi > backup_backend.sql
  ```

### Restaurar un Respaldo de la Base de Datos

* **En Linux / macOS:**
  ```bash
  docker compose stop backend
  gunzip -c backup_backend.sql.gz | docker compose exec -T postgres psql -U strapi -d strapi
  docker compose start backend
  ```
* **En Windows (PowerShell):**
  ```powershell
  docker compose stop backend
  Get-Content backup_backend.sql | docker compose exec -T postgres psql -U strapi -d strapi
  docker compose start backend
  ```

---

## 9. Paso 9: Despliegue en Entornos de Produccion (Servidor VPS / Nube)

Para publicar el backend en un servidor de produccion Linux:

1. Clonar el repositorio en el servidor:
   ```bash
   git clone https://github.com/Computacion-UPS/icc-pp-landing-back.git sitemacrmbackend
   cd sitemacrmbackend
   ```
2. Crear el archivo `.env` a mano o con el script:
   ```bash
   cp .env.example .env
   ```
3. Editar el archivo `.env` con los valores reales de produccion. Asegurese de cambiar:
   * `DATABASE_PASSWORD`: Una contrasena fuerte y unica.
   * `DATABASE_SSL=true`: Si la base de datos esta en un servidor remoto (Supabase, RDS, etc.).
   * `CORS_ORIGINS`: El dominio real del frontend en produccion (ejemplo: `https://www.tu-dominio.com`).
   * `SMTP_USERNAME` y `SMTP_PASSWORD`: Las credenciales reales de envio de correo.
   * Todos los secretos base64 (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, etc.) deben ser unicos y diferentes a los de desarrollo.
4. Ejecutar Docker Compose con el archivo de sobrescritura de produccion:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

---

## 10. Paso 10: Ejecucion Manual en Modo Desarrollo sin Docker (pnpm run develop)

Si un desarrollador desea trabajar directamente en el backend sin usar Docker:

1. Instalar Node.js v20+ y pnpm.
2. Instalar dependencias del proyecto:
   ```bash
   pnpm install
   ```
3. Crear el archivo `.env` con los campos necesarios:
   ```bash
   cp .env.example .env
   ```
4. Editar el archivo `.env`. Para desarrollo rapido local con SQLite (sin PostgreSQL), modifique:
   ```env
   DATABASE_CLIENT=sqlite
   DATABASE_FILENAME=.tmp/data.db
   ```
   El resto de variables (secretos base64, SMTP, CORS) deben permanecer configuradas.
5. Iniciar el servidor de desarrollo con recarga automatica:
   ```bash
   pnpm run develop
   ```
6. Acceder al panel de administracion en `http://localhost:1337/admin`.

---

## 11. Paso 11: Compilacion y Ejecucion de Contenedor Individual (Docker CLI)

Si requiere construir y probar la imagen del backend usando la CLI de Docker sin Docker Compose:

```bash
# 1. Construir la imagen del backend
docker build -t crm-backend:latest .

# 2. Ejecutar contenedor con archivo .env
docker run -d --name crm-backend -p 1337:1337 --env-file .env crm-backend:latest
```

---

## 12. Referencia de Comandos Utiles de Docker

* **Ver logs del backend en tiempo real**:
  ```bash
  docker compose logs -f backend
  ```
* **Ver logs de PostgreSQL**:
  ```bash
  docker compose logs -f postgres
  ```
* **Ver logs de todos los servicios**:
  ```bash
  docker compose logs -f
  ```
* **Detener todos los servicios**:
  ```bash
  docker compose down
  ```
* **Reiniciar unicamente el backend**:
  ```bash
  docker compose restart backend
  ```
* **Ver uso de recursos (RAM y CPU)**:
  ```bash
  docker stats
  ```
* **Reconstruir la imagen sin cache de Docker**:
  ```bash
  docker compose build --no-cache
  docker compose up -d
  ```

---

## 13. Guia de Diagnostico y Solucion de Fallos Frecuentes

### Fallo 1: Strapi falla al conectar con PostgreSQL (`connect ECONNREFUSED`)
* **Sintoma**: Los logs de Strapi indican error de conexion a la base de datos.
* **Solucion**: Verifique que el contenedor `postgres` este activo ejecutando `docker compose ps`. Compruebe que la variable `DATABASE_HOST` en `.env` sea exactamente `postgres` (el nombre del servicio en docker-compose.yml).

### Fallo 2: Error de bloqueo por CORS al consumir la API desde el Frontend
* **Sintoma**: El navegador bloquea las solicitudes desde `http://localhost:3000`.
* **Solucion**: Asegurese de que en el `.env` del backend la variable `CORS_ORIGINS` incluya explicitamente `http://localhost:3000` (con protocolo HTTP). Reinicie con `docker compose restart backend`.

### Fallo 3: Error en el envio de correos SMTP (`Invalid login` o `Timeout`)
* **Sintoma**: Los formularios publicos devuelven error 500 al enviar correos.
* **Solucion**: En Gmail, asegurese de utilizar una **Contrasena de Aplicacion** (App Password de 16 caracteres) generada desde la configuracion de seguridad de la cuenta de Google, no la contrasena personal de inicio de sesion.

### Fallo 4: El puerto 1337 esta en uso por otra aplicacion
* **Sintoma**: Error `bind: address already in use`.
* **Solucion**: Cambie la variable `PORT=1338` en su `.env` o detenga el proceso que ocupa el puerto `1337`.

### Fallo 5: Docker Desktop no esta ejecutandose (en Windows / macOS)
* **Sintoma**: Error `Cannot connect to the Docker daemon`.
* **Solucion**: Abra la aplicacion Docker Desktop en su sistema operativo y espere a que la barra de estado indique que el motor esta activo (`Docker Engine is running`).

### Fallo 6: Error 403 Forbidden al consultar un endpoint de la API
* **Sintoma**: Al abrir `http://localhost:1337/api/leads` el navegador devuelve `Forbidden`.
* **Solucion**: Regrese al Paso 6.2 y verifique que los permisos `find`, `findOne` o `create` esten marcados para el Content-Type correspondiente en **Settings > Roles > Public**.
