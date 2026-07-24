// Servicio para crear y consultar eventos importantes del sistema.

import { factories } from '@strapi/strapi';
import { ACTIVITY_LEVEL, CONTENT_TYPES } from '../../../shared/constants/content-types';
import { sanitizeText } from '../../../shared/utils/sanitize';

type ActivityLevel = 'Info' | 'Advertencia' | 'Error' | 'Seguridad';

type ActivityLogInput = {
  accion: string;
  modulo: string;
  descripcion: string;
  nivel?: ActivityLevel;
  refModel?: string;
  refId?: string;
};

const VALID_LEVELS = new Set<ActivityLevel>([
  ACTIVITY_LEVEL.info,
  ACTIVITY_LEVEL.warning,
  ACTIVITY_LEVEL.error,
  ACTIVITY_LEVEL.security,
]);

export default factories.createCoreService('api::activity-log.activity-log', ({ strapi }) => ({
  async log(data: ActivityLogInput) {
    const nivel = data.nivel && VALID_LEVELS.has(data.nivel)
      ? data.nivel
      : ACTIVITY_LEVEL.info;

    return await strapi.documents(CONTENT_TYPES.activityLog).create({
      data: {
        accion: sanitizeText(data.accion, 160) || 'Evento del sistema',
        modulo: sanitizeText(data.modulo, 80) || 'Sistema',
        descripcion: sanitizeText(data.descripcion, 2000),
        fecha: new Date(),
        nivel,
        referencia_modelo: data.refModel ? sanitizeText(data.refModel, 160) : null,
        referencia_id: data.refId ? sanitizeText(data.refId, 120) : null,
      }
    });
  },

  async safeLog(data: ActivityLogInput) {
    try {
      await this.log(data);
      return true;
    } catch (err) {
      strapi.log.error('No se pudo registrar en activity-log:', err);
      return false;
    }
  }
}));
