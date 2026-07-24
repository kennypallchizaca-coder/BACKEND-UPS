// Controlador que expone el endpoint de health check de la base de datos.
import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * GET /health-db
   * Ejecuta una verificación en tiempo real de la conexión con la base de datos
   * y devuelve el resultado con el código HTTP apropiado (200 o 503).
   */
  async check(ctx) {
    try {
      const result = await strapi.service('api::health-db.health-db').checkDatabase();

      ctx.status = result.status === 'healthy' ? 200 : 503;
      ctx.body = result;
    } catch (err) {
      strapi.log.error('[HealthDB] Error en el controlador:', err);
      ctx.status = 503;
      ctx.body = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTimeMs: 0,
        error: 'Error interno al verificar la base de datos',
      };
    }
  },
});
