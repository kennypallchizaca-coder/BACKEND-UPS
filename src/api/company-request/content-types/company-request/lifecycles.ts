// Automatiza sanitización, notificaciones y orquestación del ciclo de vida de solicitudes empresariales.

import { ACTIVITY_LEVEL, CONTENT_TYPES } from '../../../../shared/constants/content-types';
import { sanitizeText } from '../../../../shared/utils/sanitize';

export default {
  async beforeCreate(event) {
    const data = event.params.data;

    delete data.asuntoRespuesta;
    delete data.mensajeRespuesta;
    delete data.archivosRespuesta;
    delete data.enviarRespuestaPersonalizada;

    data.empresa        = sanitizeText(data.empresa, 160);
    data.contacto       = sanitizeText(data.contacto, 120);
    data.correo         = sanitizeText(data.correo, 254).toLowerCase();
    data.telefono       = sanitizeText(data.telefono, 20).replace(/[^\d+()\-\s]/g, '');
    data.mensaje        = sanitizeText(data.mensaje, 1500);
    data.estado         = 'Nueva';
  },

  async afterCreate(event) {
    const { result } = event;

    try {
      await strapi
        .service('api::email-notification.email-notification')
        .sendCompanyRequestNotifications(result);

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Registro de nueva solicitud empresarial',
        modulo: 'Empresas',
        descripcion: `Se recibió una nueva solicitud de vinculación empresarial de ${result.empresa}.`,
        refModel: CONTENT_TYPES.companyRequest,
        refId: String(result.id),
        nivel: ACTIVITY_LEVEL.info,
      });
    } catch (error) {
      strapi.log.error(
        'No se pudo completar el flujo posterior al registro de la solicitud empresarial.',
        error
      );
    }
  },

  async beforeUpdate(event) {
    const { params } = event;
    const { data, where } = params;

    if (data.enviarRespuestaPersonalizada !== true) return;

    // Cargar registro completo con archivos adjuntos
    const current = await strapi.db
      .query('api::company-request.company-request')
      .findOne({ where, populate: ['archivosRespuesta'] });

    if (!current) return;

    const subject = data.asuntoRespuesta ?? current.asuntoRespuesta;
    const message = data.mensajeRespuesta ?? current.mensajeRespuesta;

    if (!subject || !message) {
      strapi.log.warn(
        'company-request: Falta asuntoRespuesta o mensajeRespuesta para enviar respuesta personalizada.'
      );
      data.enviarRespuestaPersonalizada = false;
      return;
    }

    // Delegar envío al servicio — la lógica de correo, logs y errores vive allá
    const sent = await strapi
      .service(CONTENT_TYPES.companyRequest)
      .sendCustomResponse(current, subject, message);

    // Actualizar estado según resultado
    data.estado = sent ? 'Contactada' : current.estado;
    data.enviarRespuestaPersonalizada = false;
  },

  async afterUpdate(event) {
    const { result, params } = event;

    // Solo registrar si fue un cambio de estado (no un envío de respuesta)
    if (params.data.estado && !params.data.enviarRespuestaPersonalizada) {
      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Actualización de estado de solicitud empresarial',
        modulo: 'Empresas',
        descripcion: `El estado de la solicitud de ${result.empresa} fue actualizado a "${result.estado}".`,
        refModel: CONTENT_TYPES.companyRequest,
        refId: String(result.id),
        nivel: ACTIVITY_LEVEL.info,
      });
    }
  },
};
