# -- Etapa 1: Dependencias -------------------------------------------------- #
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# -- Etapa 2: Compilacion --------------------------------------------------- #
FROM deps AS build
WORKDIR /app
COPY . .
ENV NODE_ENV=production
RUN npm run build

# -- Etapa 3: Dependencias de produccion ------------------------------------ #
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# -- Etapa 4: Runtime ------------------------------------------------------- #
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Crear usuario no-root para ejecutar Strapi
RUN useradd --create-home --shell /usr/sbin/nologin strapi

# Copiar dependencias de produccion desde la etapa prod-deps
COPY --from=prod-deps --chown=strapi:strapi /app/node_modules ./node_modules

# Copiar archivos de configuracion del proyecto
COPY --chown=strapi:strapi package.json ./
COPY --chown=strapi:strapi favicon.png ./

# Copiar el build compilado
COPY --from=build --chown=strapi:strapi /app/dist ./dist

# Copiar configuracion, source y tipos necesarios para Strapi en runtime
COPY --chown=strapi:strapi config ./config
COPY --chown=strapi:strapi src ./src
COPY --chown=strapi:strapi types ./types
COPY --chown=strapi:strapi tsconfig.json ./
COPY --chown=strapi:strapi database ./database

# Crear directorio de uploads con permisos correctos
RUN mkdir -p public/uploads && chown -R strapi:strapi public

USER strapi

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:1337/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
