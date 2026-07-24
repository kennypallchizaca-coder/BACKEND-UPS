// Servicio HealthDB: verifica la conexión con la base de datos periódicamente
// y registra cada resultado en el log de actividad del sistema.

import type { Core } from '@strapi/strapi';
import { ACTIVITY_LEVEL } from '../../../shared/constants/content-types';

/** Intervalo de verificación: 2 horas en milisegundos. */
const CHECK_INTERVAL_MS = 2 * 60 * 60 * 1000;

type HealthCheckResult = {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  responseTimeMs: number;
  error?: string;
};

export default ({ strapi }: { strapi: Core.Strapi }) => {
  /** Referencia al intervalo activo para poder detenerlo en el cierre. */
  let intervalId: ReturnType<typeof setInterval> | null = null;

  return {
    /**
     * Ejecuta una consulta liviana (`SELECT 1`) contra la base de datos
     * y registra el resultado en el activity-log.
     */
    async checkDatabase(): Promise<HealthCheckResult> {
      const timestamp = new Date().toISOString();
      const start = Date.now();

      try {
        await strapi.db.connection.raw('SELECT 1');
        const responseTimeMs = Date.now() - start;

        const result: HealthCheckResult = {
          status: 'healthy',
          timestamp,
          responseTimeMs,
        };

        strapi.log.info(
          `[HealthDB] Conexión exitosa (${responseTimeMs}ms)`
        );

        // Registrar verificación exitosa en activity-log.
        await strapi.service('api::activity-log.activity-log').safeLog({
          accion: 'Verificación de base de datos',
          modulo: 'HealthDB',
          descripcion: `Conexión exitosa — Tiempo de respuesta: ${responseTimeMs}ms — ${timestamp}`,
          nivel: ACTIVITY_LEVEL.info,
        });

        return result;
      } catch (err) {
        const responseTimeMs = Date.now() - start;
        const errorMessage = err instanceof Error ? err.message : String(err);

        const result: HealthCheckResult = {
          status: 'unhealthy',
          timestamp,
          responseTimeMs,
          error: errorMessage,
        };

        strapi.log.error(
          `[HealthDB] Conexión fallida (${responseTimeMs}ms): ${errorMessage}`
        );

        // Registrar fallo en activity-log.
        await strapi.service('api::activity-log.activity-log').safeLog({
          accion: 'Verificación de base de datos',
          modulo: 'HealthDB',
          descripcion: `Conexión fallida — Error: ${errorMessage} — Tiempo: ${responseTimeMs}ms — ${timestamp}`,
          nivel: ACTIVITY_LEVEL.error,
        });

        return result;
      }
    },

    /**
     * Inicia la verificación periódica cada 2 horas.
     * Ejecuta una primera comprobación inmediata al arrancar.
     */
    async startScheduler(): Promise<void> {
      // Verificación inicial al arrancar el servidor.
      await this.checkDatabase();

      intervalId = setInterval(async () => {
        try {
          await this.checkDatabase();
        } catch (err) {
          strapi.log.error('[HealthDB] Error inesperado en el scheduler:', err);
        }
      }, CHECK_INTERVAL_MS);

      strapi.log.info(
        `[HealthDB] Scheduler iniciado — verificación cada ${CHECK_INTERVAL_MS / 3_600_000}h`
      );
    },

    /**
     * Detiene el scheduler para un cierre limpio del servidor.
     */
    stopScheduler(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        strapi.log.info('[HealthDB] Scheduler detenido');
      }
    },
  };
};
