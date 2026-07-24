// Rate limit local para formularios publicos. Protege contra spam basico sin tocar rutas internas.

type LimitRule = {
  max: number;
  windowMs: number;
};

type ClientHits = {
  count: number;
  resetAt: number;
};

const rules = new Map<string, LimitRule>([
  ['POST /api/leads/submit', { max: 8, windowMs: 15 * 60 * 1000 }],
  ['POST /api/company-requests', { max: 8, windowMs: 15 * 60 * 1000 }],
]);

const hits = new Map<string, ClientHits>();
let lastCleanupAt = Date.now();

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

function cleanupExpired(now: number) {
  if (now - lastCleanupAt < 60 * 1000) return;

  for (const [key, value] of hits.entries()) {
    if (value.resetAt <= now) {
      hits.delete(key);
    }
  }

  lastCleanupAt = now;
}

export default () => {
  return async (ctx, next) => {
    const routeKey = `${ctx.method.toUpperCase()} ${normalizePath(ctx.path)}`;
    const rule = rules.get(routeKey);

    if (!rule) {
      return next();
    }

    const now = Date.now();
    cleanupExpired(now);

    const clientIp = ctx.ip || ctx.request.ip || 'unknown';
    const hitKey = `${routeKey}:${clientIp}`;
    const current = hits.get(hitKey);

    if (!current || current.resetAt <= now) {
      hits.set(hitKey, { count: 1, resetAt: now + rule.windowMs });
      return next();
    }

    current.count += 1;

    if (current.count <= rule.max) {
      return next();
    }

    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);

    ctx.set('Retry-After', String(retryAfterSeconds));
    ctx.status = 429;
    ctx.body = {
      error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.',
    };
  };
};
