# Sistema CRM -- Backend Strapi v5

> **GUIA DE DESPLIEGUE PASO A PASO:**
> Consulta la [Guia de Despliegue Completa (deployment.md)](deployment.md) para publicar la Base de Datos PostgreSQL, el Backend Strapi en Docker/VPS y conectar el Frontend sin omitir ningun paso.

Backend de produccion construido con **Strapi v5** y **TypeScript** para administrar contenido institucional, solicitudes de interesados, solicitudes de empresas, notificaciones por correo, logs de actividad y datos consumidos por el sitio web de la Carrera de Computacion de la UPS.

---

## Tabla de Contenido


| Seccion | Contenido |
|---|---|
| [Resumen de Produccion](#resumen-de-produccion) | Objetivo, ambiente y accesos esperados |
| [Stack Tecnologico](#stack-tecnologico) | Tecnologias usadas por el backend |
| [Arquitectura y Escalabilidad](#arquitectura-y-escalabilidad) | Diseño del sistema y capacidad de crecimiento |
| [Buenas Practicas Implementadas](#buenas-practicas-implementadas) | Patrones, principios y estándares aplicados |
| [Requisitos de Produccion](#requisitos-de-produccion) | Infraestructura minima requerida |
| [Variables de Entorno](#variables-de-entorno) | Configuracion obligatoria por ambiente |
| [Despliegue](#despliegue) | Ejecucion con Docker o Node.js |
| [Verificacion Post-Despliegue](#verificacion-post-despliegue) | Pruebas minimas despues de publicar |
| [Scripts Disponibles](#scripts-disponibles) | Comandos npm relevantes |
| [Modulos del Sistema](#modulos-del-sistema) | APIs, content-types y responsabilidades |
| [Flujos Principales](#flujos-principales) | Leads, empresas y correos automaticos |
| [Plantillas de Correo](#plantillas-de-correo) | Codigos reales usados por la base de datos |
| [Endpoints Principales](#endpoints-principales) | Rutas funcionales clave |
| [Estructura del Proyecto](#estructura-del-proyecto) | Carpetas principales |
| [Seguridad](#seguridad) | Controles activos del backend |
| [Checklist de Produccion](#checklist-de-produccion) | Lista final antes de entregar |
| [Desarrollo Local Opcional](#desarrollo-local-opcional) | Uso local para mantenimiento |

---

## Resumen de Produccion

| Dato | Valor esperado |
|---|---|
| Proyecto | Sistema CRM Backend |
| Institucion | UPS - Carrera de Computacion |
| Framework principal | Strapi 5 |
| Lenguaje | TypeScript |
| Ambiente objetivo | `production` |
| API publica | `https://api.tu-dominio.com/api` |
| Panel admin | `https://api.tu-dominio.com/admin` |
| Healthcheck | `https://api.tu-dominio.com/_health` |
| Base de datos | PostgreSQL (Supabase) |
| SMTP | Gmail SMTP con App Password |
| SQLite | No permitido en produccion |

### Alcance funcional

| Area | Responsabilidad |
|---|---|
| Contenido institucional | Administra landing, publicaciones, grupos, alianzas, empresas y casos de exito |
| Interesados | Recibe formularios de admision, confirma recepcion y notifica al equipo responsable |
| Empresas | Recibe solicitudes de vinculacion empresarial, confirma recepcion y notifica al responsable |
| Correos | Envia confirmaciones, alertas internas y respuestas personalizadas con adjuntos |
| Auditoria | Guarda historial de correos y eventos importantes del sistema |
| Dashboard | Expone datos de resumen, actividad reciente y estadisticas de correo |
| Seguridad | Valida variables criticas, CORS, CSP, HSTS, rate limit y sanitizacion de entradas |

---

## Stack Tecnologico

| Tecnologia | Version / Rango | Uso en produccion |
|---|---:|---|
| Node.js | `>=20.0.0 <=24.x.x` | Runtime del backend |
| npm | `>=6.0.0` | Instalacion y scripts |
| Strapi | `5.48.0` | CMS headless, API REST y panel admin |
| TypeScript | `5.4.5` | Tipado estatico y validacion de codigo |
| React | `18.3.1` | Panel admin de Strapi |
| PostgreSQL | `pg 8.21.0` | Base de datos de produccion |
| Nodemailer | Via `@strapi/provider-email-nodemailer 5.48.0` | Envio SMTP |
| Docker | Dockerfile incluido | Empaquetado y ejecucion aislada |

---

## Arquitectura y Escalabilidad

### Diseño modular

El backend esta diseñado con una **arquitectura modular por dominio** donde cada modulo (lead, company-request, email-log, etc.) encapsula su propia logica de negocio, esquema de datos, rutas, controladores y lifecycles de manera independiente. Esto permite:

- **Agregar nuevos modulos** sin modificar los existentes (ej. agregar un modulo de `encuestas` o `eventos`).
- **Modificar flujos individuales** sin afectar el resto del sistema (ej. cambiar la plantilla de correo de empresas sin tocar la de interesados).
- **Reutilizar utilidades compartidas** a traves del directorio `src/shared/` (sanitizacion, renderizado de plantillas, construccion de headers de correo).

### Escalabilidad horizontal

| Aspecto | Estrategia implementada |
|---|---|
| Base de datos | PostgreSQL externo (Supabase), desacoplado del servidor de aplicacion |
| Pool de conexiones | Configurable via `DATABASE_POOL_MIN` y `DATABASE_POOL_MAX` |
| Contenedorizacion | Dockerfile multi-stage listo para orquestar con Docker Compose o Kubernetes |
| Healthcheck | Endpoint `/_health` integrado para balanceadores de carga y monitores |
| Variables de entorno | Toda configuracion es externa, permitiendo multiples instancias con diferentes configs |
| Sin estado en servidor | No hay sesiones locales ni archivos temporales criticos en el runtime |

### Escalabilidad vertical

| Aspecto | Capacidad |
|---|---|
| Nuevos content-types | Se agregan creando una nueva carpeta en `src/api/` con el esquema JSON de Strapi |
| Nuevos flujos de correo | Se agregan nuevos templates a las colecciones existentes sin tocar codigo |
| Nuevos endpoints | Se crean rutas custom dentro de cada modulo o se usan las rutas CRUD auto-generadas |
| Panel admin personalizable | Se extiende via `src/admin/` con paginas React custom (ej. Metricas) |
| Plantillas dinamicas | Soportan variables con sintaxis `{{variable}}`, renderizadas en tiempo de ejecucion |

---

## Buenas Practicas Implementadas

### Principios de ingenieria

| Practica | Implementacion |
|---|---|
| **Separacion de responsabilidades** | Controllers manejan HTTP, Services manejan logica de negocio, Lifecycles manejan eventos del ORM |
| **DRY (Don't Repeat Yourself)** | Funciones compartidas en `src/shared/utils/` (`buildFromHeader`, `buildAttachments`, `renderString`, `sanitizeText`) |
| **Constantes centralizadas** | UIDs de content-types en `src/shared/constants/content-types.ts`, evitando strings magicos dispersos |
| **Tipado estatico** | TypeScript en todo el proyecto con verificacion via `tsc --noEmit` |
| **Fail-safe por defecto** | Plantillas de correo con fallback en codigo si la base de datos aun no tiene plantillas sembradas |

### Seguridad

| Practica | Implementacion |
|---|---|
| **Sanitizacion de entradas** | Todos los datos de formularios publicos se sanitizan antes de guardar (`sanitizeText`, `sanitizeEmail`, `sanitizePhone`) |
| **Proteccion contra inyeccion** | Los lifecycles `beforeCreate` eliminan campos administrativos del payload publico (`notas_internas`, `asuntoRespuesta`, etc.) |
| **Rate limiting** | Middleware custom `public-form-rate-limit` protege los endpoints publicos contra abuso |
| **CORS estricto** | Origenes permitidos configurados via variable de entorno, sin wildcards |
| **CSP (Content Security Policy)** | Configurado con directivas restrictivas |
| **HSTS** | Activable para produccion via variable de entorno |
| **Frameguard** | `frame-ancestors: 'none'` previene clickjacking |
| **Validacion de arranque** | En `NODE_ENV=production`, el backend verifica que no haya secretos por defecto, SQLite, ni localhost en CORS |
| **Docker sin privilegios** | El contenedor ejecuta Strapi con usuario `strapi` sin acceso root |

### Observabilidad y auditoria

| Practica | Implementacion |
|---|---|
| **Logs de correo** | Cada correo enviado o fallido se registra en `email-log` con destinatario, asunto, estado y error |
| **Logs de actividad** | Eventos importantes del sistema se registran en `activity-log` con accion, modulo, descripcion y nivel |
| **Trazabilidad** | Cada log referencia el modelo y ID del registro que lo origino |
| **Niveles de severidad** | Info, Advertencia, Error y Seguridad para clasificar eventos |

### Calidad de codigo

| Practica | Implementacion |
|---|---|
| **Cero warnings de TypeScript** | El proyecto compila con `tsc --noEmit` sin errores ni advertencias |
| **Build completo verificado** | `npm run build` compila TypeScript y construye el panel admin sin fallos |
| **Script de calidad** | `npm run quality` ejecuta typecheck + build en secuencia como gate de despliegue |
| **EditorConfig** | Configurado para mantener formato consistente (UTF-8, LF, 2 espacios, trim trailing) |
| **Comentarios descriptivos** | Cada archivo de servicio y utilidad tiene comentarios que explican su responsabilidad |
| **`.env.example` documentado** | Plantilla completa con todos los valores necesarios y comentarios explicativos |

### Mantenibilidad

| Practica | Implementacion |
|---|---|
| **Configuracion por entorno** | `config/env/production/plugins.ts` permite overrides especificos de produccion |
| **Sin secretos hardcodeados** | Todas las credenciales vienen de variables de entorno |
| **Fallbacks controlados** | Funciones como `buildFromHeader` manejan gracefully valores `null` o `undefined` |
| **Esquemas JSON declarativos** | Los content-types se definen en JSON puro, facilitando lectura y migracion |
| **Nombres semanticos en español** | Los campos de la base de datos usan nombres claros y consistentes en español (ej. `correo_para_recibir_respuestas`) |

---

## Requisitos de Produccion

| Requisito | Valor recomendado |
|---|---|
| Sistema operativo | Linux server o contenedor Linux |
| Node.js | Version 20 a 24 |
| Base de datos | PostgreSQL administrado (Supabase, RDS, etc.) |
| HTTPS | Obligatorio mediante proxy, balanceador o plataforma cloud |
| Dominio API | Dominio real, sin localhost |
| SMTP | Cuenta Gmail con App Password o relay transaccional |
| Variables secretas | Generadas con valores aleatorios fuertes |
| Logs | Acceso a logs de aplicacion y plataforma |

---

## Variables de Entorno

En produccion no se deben usar valores de ejemplo como `change-with-*`, `tobemodified` ni dominios `example.com`. El arranque en `NODE_ENV=production` falla si detecta secretos inseguros, SQLite o localhost en CORS.

### Servidor y ambiente

| Variable | Valor de produccion | Requerida | Descripcion |
|---|---|---|---|
| `HOST` | `0.0.0.0` | Si | Host donde escucha Strapi dentro del servidor o contenedor |
| `PORT` | `1337` | Si | Puerto interno del backend |
| `NODE_ENV` | `production` | Si | Activa validaciones y modo productivo |
| `CORS_ORIGINS` | `https://tu-frontend.com` | Si | Dominios autorizados para consumir la API |
| `ENABLE_HSTS` | `true` | Si | Activa HSTS cuando el servicio se publica con HTTPS |

### Secretos obligatorios

| Variable | Requerida | Recomendacion |
|---|---|---|
| `APP_KEYS` | Si | 4 llaves aleatorias separadas por coma |
| `API_TOKEN_SALT` | Si | Valor aleatorio fuerte |
| `ADMIN_JWT_SECRET` | Si | Valor aleatorio fuerte |
| `TRANSFER_TOKEN_SALT` | Si | Valor aleatorio fuerte |
| `JWT_SECRET` | Si | Valor aleatorio fuerte |
| `ENCRYPTION_KEY` | Si | Llave aleatoria de 32 bytes |

### Base de datos

| Variable | PostgreSQL | Descripcion |
|---|---|---|
| `DATABASE_CLIENT` | `postgres` | Cliente de base de datos |
| `DATABASE_URL` | Opcional | Cadena completa de conexion si el proveedor la entrega |
| `DATABASE_HOST` | Requerido | Host de la base |
| `DATABASE_PORT` | `5432` | Puerto de conexion |
| `DATABASE_NAME` | Requerido | Nombre de la base |
| `DATABASE_USERNAME` | Requerido | Usuario de base |
| `DATABASE_PASSWORD` | Requerido | Password de base |
| `DATABASE_SSL` | `true` | Activa SSL para conexiones seguras |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` | Requerido para algunos proveedores cloud |
| `DATABASE_SCHEMA` | `public` | Schema por defecto |
| `DATABASE_POOL_MIN` | `1` | Conexiones minimas en el pool |
| `DATABASE_POOL_MAX` | `5` | Conexiones maximas en el pool |
| `DATABASE_CONNECTION_TIMEOUT` | `60000` | Tiempo maximo de conexion en ms |

### Correo SMTP

| Variable | Requerida | Descripcion |
|---|---|---|
| `SMTP_HOST` | Si | Host SMTP (ej. `smtp.gmail.com`) |
| `SMTP_PORT` | Si | Puerto SMTP (`587`) |
| `SMTP_USERNAME` | Si | Correo SMTP autenticado. Este correo es el remitente real de todos los envios |
| `SMTP_PASSWORD` | Si | App Password de Google o credencial SMTP |
| `EMAIL_DEFAULT_FROM` | Si | Remitente por defecto |
| `EMAIL_DEFAULT_REPLY_TO` | Si | Reply-To por defecto |

> **Nota importante:** El nombre visible del remitente (ej. "Carrera de Computación UPS") se configura desde el panel de Strapi en la coleccion de configuracion de correo (`nombre_del_sistema_que_envia`). La direccion de correo real se toma siempre de `SMTP_USERNAME` para evitar rechazos de autenticacion SMTP.

---

## Despliegue

### Opcion A: Docker

El Dockerfile esta preparado para produccion con build multi-stage, usuario sin privilegios, puerto `1337` y healthcheck en `/_health`.

| Paso | Comando |
|---:|---|
| 1 | `docker build -t crm-backend:production .` |
| 2 | `docker run -p 1337:1337 --env-file .env.production crm-backend:production` |
| 3 | `curl https://api.tu-dominio.com/_health` |

### Opcion B: Node.js directo

| Paso | Comando |
|---:|---|
| 1 | `npm ci` |
| 2 | `npm run quality` |
| 3 | `npm run start` |

### Opcion C: Strapi Cloud

El proyecto incluye la configuracion `config/env/production/plugins.ts` que fuerza Nodemailer SMTP como proveedor de correo, anulando el proveedor por defecto de Strapi Cloud.

| Paso | Accion |
|---:|---|
| 1 | Conectar repositorio Git a Strapi Cloud |
| 2 | Configurar todas las variables de entorno en el panel de Strapi Cloud |
| 3 | Desplegar y verificar `/_health` |

---

## Verificacion Post-Despliegue

| Verificacion | Resultado esperado |
|---|---|
| `GET /_health` | Respuesta HTTP exitosa |
| `GET /admin` | Carga del panel de Strapi |
| `GET /api` | API disponible |
| Login admin | Acceso al panel con usuario administrador |
| CORS desde frontend real | El frontend puede consumir la API |
| SMTP | Correos de confirmacion y alertas se envian correctamente |
| Base de datos | Registros persisten despues de reiniciar |
| Logs | Fallos quedan visibles en logs de plataforma y `email-log` |

---

## Scripts Disponibles

| Script | Comando | Uso en produccion |
|---|---|---|
| Build | `npm run build` | Compila TypeScript y el admin de Strapi |
| Inicio | `npm run start` | Ejecuta Strapi en runtime productivo |
| Typecheck | `npm run typecheck` | Valida TypeScript sin emitir archivos |
| Calidad | `npm run quality` | Ejecuta typecheck y build antes de publicar |
| Consola | `npm run console` | Diagnostico controlado en servidor |
| Deploy Strapi | `npm run deploy` | Despliegue usando comando de Strapi |
| Desarrollo | `npm run develop` | Solo para desarrollo local |

---

## Modulos del Sistema

### Modulos operativos

| Modulo | Tipo | Responsabilidad |
|---|---|---|
| `lead` | Collection Type + custom route | Registra interesados y maneja respuestas personalizadas |
| `company-request` | Collection Type + lifecycles | Registra solicitudes empresariales y respuestas personalizadas |
| `email-notification` | Service | Envia correos automaticos del flujo de empresas |
| `email-log` | Collection Type + lifecycles | Guarda historial de correos enviados y fallidos. Soporta reenvio manual via estado "Aprobado" |
| `activity-log` | Collection Type + service | Guarda eventos importantes del sistema |
| `dashboard` | Custom API | Entrega metricas y actividad reciente |

### Configuracion de correo

| Modulo | Tipo | Flujo | Responsabilidad |
|---|---|---|---|
| `email-setting` | Single Type | Interesados | Nombre del remitente, reply-to y destinatarios de alertas |
| `email-template` | Collection Type | Interesados | Plantillas de confirmacion, alerta y respuesta |
| `company-email-setting` | Single Type | Empresas | Nombre del remitente, reply-to, responsable y copias |
| `company-email-template` | Collection Type | Empresas | Plantillas de confirmacion, alerta y respuesta |

### Contenido administrable

| Modulo | Uso principal |
|---|---|
| `landing-content` | Contenido general de la landing |
| `hero-slide` | Diapositivas del banner principal |
| `publication` | Publicaciones academicas |
| `research-group` | Grupos de investigacion |
| `asu-group` | Grupos ASU |
| `alliance` | Alianzas institucionales |
| `company` | Directorio de empresas colaboradoras |
| `success-case` | Casos de exito |

---

## Flujos Principales

### Flujo de interesados

| Paso | Accion | Resultado |
|---:|---|---|
| 1 | El frontend envia `POST /api/leads/submit` | Se crea el lead con estado `Nuevo` |
| 2 | El servicio busca `lead_confirmation` | Se envia confirmacion al interesado |
| 3 | El servicio busca `admissions_notification` | Se notifica al equipo de admisiones |
| 4 | Se registra `email-log` y `activity-log` | Queda evidencia del envio y del registro |
| 5 | Si el correo al interesado se envia correctamente | El estado cambia a `Confirmacion enviada` |

### Respuesta personalizada a interesados

| Paso | Accion | Resultado |
|---:|---|---|
| 1 | El admin envia asunto, mensaje y opcionalmente adjuntos | Se actualiza el lead |
| 2 | El lifecycle detecta la respuesta | Se envia el correo al interesado |
| 3 | Se registra el envio | Queda historial en `email-log` y `activity-log` |
| 4 | El envio termina correctamente | El estado cambia a `Respuesta enviada` |

### Flujo de empresas

| Paso | Accion | Resultado |
|---:|---|---|
| 1 | Se crea una solicitud empresarial | `beforeCreate` sanitiza los campos y elimina campos administrativos |
| 2 | `afterCreate` llama a `sendCompanyRequestNotifications` | Se inicia el flujo de correo |
| 3 | El servicio busca `company_confirmation` | Se envia confirmacion a la empresa |
| 4 | Si las alertas estan activas | Se envia `company_admin_notification` al responsable |
| 5 | Se registra actividad y correos | Queda trazabilidad del flujo |

### Respuesta personalizada a empresas

| Paso | Accion | Resultado |
|---:|---|---|
| 1 | El admin activa `enviarRespuestaPersonalizada` | El lifecycle prepara el envio |
| 2 | Se usa asunto, mensaje y adjuntos del registro | Se envia correo a la empresa |
| 3 | El envio termina correctamente | El estado cambia a `Contactada` |
| 4 | El flujo termina | Se apaga `enviarRespuestaPersonalizada` para evitar reenvios |

---

## Plantillas de Correo

Las plantillas se siembran automaticamente en el `bootstrap` de Strapi si no existen. Estos son los codigos reales que deben mantenerse en la base de datos.

### Interesados

| Codigo | Collection | Uso |
|---|---|---|
| `lead_confirmation` | `email-template` | Confirmacion enviada al interesado |
| `admissions_notification` | `email-template` | Alerta enviada al equipo de admisiones |
| `admissions_custom_response` | `email-template` | Referencia para respuestas personalizadas |

### Empresas

| Codigo | Collection | Uso |
|---|---|---|
| `company_confirmation` | `company-email-template` | Confirmacion enviada a la empresa |
| `company_admin_notification` | `company-email-template` | Alerta enviada al responsable de vinculacion |
| `company_custom_response` | `company-email-template` | Referencia para respuestas personalizadas |

### Variables de plantilla

| Flujo | Variables habituales |
|---|---|
| Interesados | `{{nombre}}`, `{{apellido}}`, `{{email}}`, `{{telefono}}`, `{{programaInteres}}`, `{{mensaje}}`, `{{source}}` |
| Empresas | `{{empresa}}`, `{{contacto}}`, `{{correo}}`, `{{telefono}}`, `{{tipo_colaboracion}}`, `{{mensaje}}` |

---

## Endpoints Principales

### Leads

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `POST` | `/api/leads/submit` | Publico (CORS + rate limit) | Registra un interesado desde el formulario |
| `POST` | `/api/leads/:id/send-custom-response` | Admin | Envia una respuesta personalizada al interesado |

### Dashboard

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Publico sin datos personales | Totales de leads, empresas, publicaciones y correos |
| `GET` | `/api/dashboard/recent-leads` | Admin | Ultimos interesados |
| `GET` | `/api/dashboard/recent-company-requests` | Admin | Ultimas solicitudes empresariales |
| `GET` | `/api/dashboard/email-stats` | Admin | Estadisticas recientes del log de correos |
| `GET` | `/api/dashboard/recent-activity` | Admin | Ultimos eventos de actividad |

### CRUD administrado por Strapi

| Grupo | Ruta base |
|---|---|
| Solicitudes de empresa | `/api/company-requests` |
| Plantillas de interesados | `/api/email-templates` |
| Plantillas de empresas | `/api/company-email-templates` |
| Contenido publico | Rutas generadas por cada content-type |

---

## Estructura del Proyecto

```
sitemacrmbackend/
├── config/                          # Configuracion de Strapi
│   ├── admin.ts                     # Panel de administracion
│   ├── api.ts                       # Opciones globales de API
│   ├── database.ts                  # Conexion a base de datos
│   ├── middlewares.ts               # CORS, CSP, HSTS, rate limit
│   ├── plugins.ts                   # Plugin de email (Nodemailer)
│   ├── server.ts                    # Host y puerto
│   └── env/
│       └── production/
│           └── plugins.ts           # Override de email para produccion
├── public/                          # Archivos estaticos
│   ├── robots.txt
│   └── uploads/                     # Media subida desde Strapi
├── src/
│   ├── index.ts                     # Bootstrap, validacion de produccion y seeders
│   ├── admin/                       # Personalizacion del panel admin
│   │   ├── app.tsx
│   │   └── pages/Metricas.tsx       # Pagina custom de metricas
│   ├── api/                         # Modulos de la API
│   │   ├── lead/                    # Interesados
│   │   ├── company-request/         # Solicitudes de empresa
│   │   ├── email-notification/      # Servicio de notificaciones
│   │   ├── email-log/               # Historial de correos
│   │   ├── activity-log/            # Eventos del sistema
│   │   ├── dashboard/               # Metricas y resumen
│   │   ├── email-setting/           # Config correo interesados
│   │   ├── email-template/          # Plantillas interesados
│   │   ├── company-email-setting/   # Config correo empresas
│   │   ├── company-email-template/  # Plantillas empresas
│   │   ├── landing-content/         # Contenido landing
│   │   ├── hero-slide/              # Slides del banner
│   │   ├── publication/             # Publicaciones
│   │   ├── research-group/          # Grupos de investigacion
│   │   ├── asu-group/               # Grupos ASU
│   │   ├── alliance/                # Alianzas
│   │   ├── company/                 # Directorio empresas
│   │   └── success-case/            # Casos de exito
│   ├── components/shared/           # Componentes reutilizables de Strapi
│   ├── extensions/                  # Extensiones de plugins
│   ├── middlewares/                 # Middlewares custom
│   │   └── public-form-rate-limit.ts
│   └── shared/                      # Codigo compartido
│       ├── constants/content-types.ts   # UIDs centralizados
│       └── utils/
│           ├── controller.ts        # Helper de controladores
│           ├── email.ts             # buildFromHeader, buildAttachments
│           ├── render.ts            # renderString para plantillas
│           └── sanitize.ts          # sanitizeText para entradas
├── types/generated/                 # Tipos auto-generados por Strapi
├── .dockerignore                    # Exclusiones para Docker
├── .editorconfig                    # Formato de codigo
├── .env.example                     # Plantilla de variables de entorno
├── .gitignore                       # Exclusiones de Git
├── Dockerfile                       # Build multi-stage para produccion
├── favicon.png                      # Icono del panel admin
├── package.json                     # Dependencias y scripts
├── package-lock.json                # Lock de dependencias
└── tsconfig.json                    # Configuracion TypeScript
```

---

## Seguridad

| Control | Estado | Descripcion |
|---|---|---|
| Validacion de produccion | Activa | Bloquea arranque con secretos inseguros, SQLite o localhost en CORS |
| CORS | Configurable | Usa `CORS_ORIGINS` para permitir solo dominios reales |
| CSP | Activo | Restringe carga de recursos y evita usos inseguros |
| HSTS | Configurable | Se habilita con `ENABLE_HSTS` en produccion |
| Frameguard | Activo | `frame-ancestors: 'none'` para prevenir clickjacking |
| noSniff | Activo | Evita interpretacion incorrecta de contenido |
| Referrer Policy | Activo | Usa `strict-origin-when-cross-origin` |
| Rate limit | Activo | Limita envios de formularios publicos contra abuso |
| Sanitizacion | Activa | Limpia campos de formularios publicos antes de guardar |
| Proteccion de campos admin | Activa | Los lifecycles eliminan campos administrativos del payload publico |
| Remitente SMTP fijo | Activo | El correo remitente se toma de `SMTP_USERNAME`, no de campos editables |
| Logs de auditoria | Activos | Registra actividad importante y fallos de correo |
| Docker sin privilegios | Activo | El contenedor ejecuta Strapi con usuario `strapi` |

---

## Checklist de Produccion

| Paso | Verificacion |
|---:|---|
| 1 | `NODE_ENV=production` configurado |
| 2 | `APP_KEYS`, salts y secretos reemplazados por valores fuertes |
| 3 | `CORS_ORIGINS` usa dominios reales y no contiene localhost |
| 4 | `DATABASE_CLIENT` es `postgres` |
| 5 | Conexion a base de datos verificada |
| 6 | `SMTP_USERNAME` y `SMTP_PASSWORD` configurados con credenciales reales |
| 7 | `ENABLE_HSTS=true` cuando el servicio esta detras de HTTPS |
| 8 | `npm run quality` ejecutado antes de publicar |
| 9 | Imagen Docker construida si el despliegue usa contenedor |
| 10 | `/_health` responde correctamente despues del despliegue |
| 11 | Panel admin y API revisados en el dominio final |
| 12 | Correos de prueba enviados y recibidos correctamente |

---

## Desarrollo Local Opcional

Esta seccion es solo para mantenimiento o pruebas locales. No representa la configuracion de produccion.

| Paso | Comando |
|---:|---|
| 1 | `npm install` |
| 2 | `Copy-Item .env.example .env` |
| 3 | Editar `.env` con las credenciales locales |
| 4 | `npm run develop` |

| Recurso local | URL |
|---|---|
| Panel de Strapi | `http://localhost:1337/admin` |
| API REST | `http://localhost:1337/api` |
| Healthcheck | `http://localhost:1337/_health` |
