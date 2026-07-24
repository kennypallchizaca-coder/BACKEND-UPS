// Servicio para guardar, consultar y responder solicitudes empresariales.

import { factories } from '@strapi/strapi';
import { ACTIVITY_LEVEL, CONTENT_TYPES, EMAIL_STATUS } from '../../../shared/constants/content-types';
import { buildAttachments, buildFromHeader } from '../../../shared/utils/email';

export default factories.createCoreService('api::company-request.company-request', ({ strapi }) => ({

  /**
   * Envía un correo de respuesta personalizada a la empresa y registra el resultado
   * en email-log y activity-log. Retorna true si el envío fue exitoso.
   *
   * @param current - Registro actual de la solicitud (con archivosRespuesta populados)
   * @param subject - Asunto del correo a enviar
   * @param message - Cuerpo del mensaje
   */
  async sendCustomResponse(
    current: Record<string, any>,
    subject: string,
    message: string
  ): Promise<boolean> {
    const settings = await strapi.service(CONTENT_TYPES.companyEmailSetting).find();
    const fromHeader = buildFromHeader(
      settings?.nombre_del_sistema_que_envia,
      process.env.SMTP_USERNAME
    );
    const replyToHeader = settings?.correo_para_recibir_respuestas;
    const attachments = buildAttachments(current.archivosRespuesta);
    const refId = String(current.documentId || current.id);

    try {
      await strapi.plugin('email').service('email').send({
        to: current.correo,
        from: fromHeader,
        replyTo: replyToHeader || undefined,
        subject,
        text: message,
        html: message.replace(/\n/g, '<br/>'),
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    } catch (err: any) {
      strapi.log.error('Error al enviar respuesta personalizada a empresa:', err);

      try {
        await strapi.documents(CONTENT_TYPES.emailLog).create({
          data: {
            destinatario: current.correo,
            asunto: subject,
            cuerpo_texto: message,
            estado: EMAIL_STATUS.failed,
            tipo: 'Empresa',
            mensaje_error: err.message || 'Error al enviar correo',
            referencia_modelo: CONTENT_TYPES.companyRequest,
            referencia_id: refId,
          },
        });
      } catch (logErr) {
        strapi.log.error('No se pudo registrar email-log fallido para empresa:', logErr);
      }

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Fallo al enviar respuesta a empresa',
        modulo: 'Empresas',
        descripcion: `No se pudo enviar respuesta a ${current.empresa} (${current.correo}). Error: ${err.message}`,
        nivel: ACTIVITY_LEVEL.error,
        refModel: CONTENT_TYPES.companyRequest,
        refId,
      });

      return false;
    }

    try {
      await strapi.documents(CONTENT_TYPES.emailLog).create({
        data: {
          destinatario: current.correo,
          asunto: subject,
          cuerpo_texto: message,
          cuerpo_html: message.replace(/\n/g, '<br/>'),
          estado: EMAIL_STATUS.sent,
          tipo: 'Empresa',
          fecha_envio: new Date(),
          referencia_modelo: CONTENT_TYPES.companyRequest,
          referencia_id: refId,
        },
      });
    } catch (logErr) {
      strapi.log.error('No se pudo registrar email-log enviado para empresa:', logErr);
    }

    await strapi.service(CONTENT_TYPES.activityLog).safeLog({
      accion: 'Respuesta enviada a empresa',
      modulo: 'Empresas',
      descripcion: `Se envió una respuesta personalizada a ${current.empresa} (${current.correo}). Asunto: "${subject}".`,
      nivel: ACTIVITY_LEVEL.info,
      refModel: CONTENT_TYPES.companyRequest,
      refId,
    });

    return true;
  },
}));
