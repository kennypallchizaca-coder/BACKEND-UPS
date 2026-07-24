// Configura middlewares globales, seguridad HTTP y CORS del backend.
import type { Core } from '@strapi/strapi';

function parseCorsOrigins(rawOrigins: string | string[] | undefined, fallbackOrigins: string[]): string[] {
  const origins = Array.isArray(rawOrigins)
    ? rawOrigins
    : (rawOrigins ?? '').split(',');

  const normalizedOrigins = origins
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return normalizedOrigins.length > 0 ? normalizedOrigins : fallbackOrigins;
}

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  const localOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
  const allowedOrigins = parseCorsOrigins(env('CORS_ORIGINS'), localOrigins);

  return [
  'strapi::logger',
  'strapi::errors',
  'global::public-form-rate-limit',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          upgradeInsecureRequests: null,
        },
      },
      frameguard: {
        action: 'deny',
      },
      hsts: env.bool('ENABLE_HSTS', env('NODE_ENV') === 'production')
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      noSniff: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: allowedOrigins,
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'X-Requested-With',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      credentials: true,
      keepHeaderOnError: true,
    },
  },
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  ];
};

export default config;
