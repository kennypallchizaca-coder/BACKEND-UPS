// Servicio que arma y envía correos automáticos del sistema para leads y solicitudes de empresa.

import type { Core } from '@strapi/strapi';
import { ACTIVITY_LEVEL, CONTENT_TYPES, EMAIL_STATUS } from '../../../shared/constants/content-types';
import { renderString } from '../../../shared/utils/render';
import { buildFromHeader } from '../../../shared/utils/email';

// ── Plantillas de fallback ────────────────────────────────────────────────────
// Solo se usan si la colección de plantillas en Strapi está vacía.

const FALLBACK_COMPANY_CONFIRMATION = {
  subject: 'Hemos recibido su solicitud de vinculación institucional',
  body: 'Estimado/a {{contacto}},\n\nHemos recibido la solicitud de vinculación de {{empresa}} correctamente. Nuestro equipo revisará la información y se pondrá en contacto pronto.\n\nAtentamente,\nDirección de Vinculación con la Sociedad',
};

const FALLBACK_COMPANY_ADMIN_NOTIFICATION = {
  subject: 'Nueva solicitud de vinculación empresarial: {{empresa}}',
  body: 'Se ha recibido una nueva solicitud de vinculación empresarial.\n\nEmpresa: {{empresa}}\nContacto: {{contacto}}\nCorreo: {{correo}}\nTeléfono: {{telefono}}\nTipo de colaboración: {{tipo_colaboracion}}\nMensaje: {{mensaje}}\n\nPor favor revisar la solicitud desde el panel de administración.',
};

// ── Servicio ──────────────────────────────────────────────────────────────────

export default ({ strapi }: { strapi: Core.Strapi }) => ({

  /**
   * Envía los correos automáticos cuando se registra una nueva solicitud de empresa:
   * 1. Confirmación a la empresa
   * 2. Notificación al responsable de vinculación (si las alertas están activas)
   */
  async sendCompanyRequestNotifications(companyRequest: Record<string, any>) {
    const settings = await strapi.service(CONTENT_TYPES.companyEmailSetting).find();

    if (!settings) {
      strapi.log.warn('sendCompanyRequestNotifications: No hay configuración de correo para empresas.');
      return;
    }

    const fromHeader    = buildFromHeader(
      settings.nombre_del_sistema_que_envia,
      process.env.SMTP_USERNAME
    );
    const replyToHeader = settings.correo_para_recibir_respuestas;
    const refId         = String(companyRequest.documentId || companyRequest.id);

    // 1. Correo de confirmación a la empresa
    const confirmTemplate =
      (await strapi.documents(CONTENT_TYPES.companyEmailTemplate).findFirst({
        filters: { code: 'company_confirmation' },
      })) ?? FALLBACK_COMPANY_CONFIRMATION;

    const confirmSubject = renderString(confirmTemplate.subject, companyRequest);
    const confirmBody    = renderString(confirmTemplate.body, companyRequest);
    let confirmationSent = false;

    try {
      await strapi.plugin('email').service('email').send({
        to: companyRequest.correo,
        from: fromHeader,
        replyTo: replyToHeader || undefined,
        subject: confirmSubject,
        text: confirmBody,
        html: confirmBody.replace(/\n/g, '<br/>'),
      });
      confirmationSent = true;
    } catch (err: any) {
      strapi.log.error('Error al enviar confirmación a empresa:', err);

      try {
        await strapi.documents(CONTENT_TYPES.emailLog).create({
          data: {
            destinatario: companyRequest.correo,
            asunto: confirmSubject,
            cuerpo_texto: confirmBody,
            estado: EMAIL_STATUS.failed,
            tipo: 'Empresa',
            mensaje_error: err.message,
            referencia_modelo: CONTENT_TYPES.companyRequest,
            referencia_id: refId,
          },
        });
      } catch (logErr) {
        strapi.log.error('No se pudo registrar email-log fallido de confirmación a empresa:', logErr);
      }

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Fallo al enviar confirmación a empresa',
        modulo: 'Empresas',
        descripcion: `No se pudo enviar confirmación de recepción a ${companyRequest.empresa} (${companyRequest.correo}). Error: ${err.message}`,
        nivel: ACTIVITY_LEVEL.error,
        refModel: CONTENT_TYPES.companyRequest,
        refId,
      });

    }

    if (confirmationSent) {
      try {
        await strapi.documents(CONTENT_TYPES.emailLog).create({
          data: {
            destinatario: companyRequest.correo,
            asunto: confirmSubject,
            cuerpo_texto: confirmBody,
            cuerpo_html: confirmBody.replace(/\n/g, '<br/>'),
            estado: EMAIL_STATUS.sent,
            tipo: 'Empresa',
            fecha_envio: new Date(),
            referencia_modelo: CONTENT_TYPES.companyRequest,
            referencia_id: refId,
          },
        });
      } catch (logErr) {
        strapi.log.error('No se pudo registrar email-log enviado de confirmación a empresa:', logErr);
      }

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Confirmación enviada a empresa',
        modulo: 'Empresas',
        descripcion: `Se envió confirmación de recepción a ${companyRequest.empresa} (${companyRequest.correo}).`,
        nivel: ACTIVITY_LEVEL.info,
        refModel: CONTENT_TYPES.companyRequest,
        refId,
      });
    }

    // 2. Notificación al responsable de empresas
    if (!settings.encender_alertas_automaticas) {
      return;
    }

    const adminTo = settings.correo_del_responsable_para_alertas;
    const adminCc = settings.correo_del_responsable_copia || undefined;

    if (!adminTo) {
      strapi.log.warn('sendCompanyRequestNotifications: No hay correo del responsable configurado.');
      return;
    }

    const adminTemplate =
      (await strapi.documents(CONTENT_TYPES.companyEmailTemplate).findFirst({
        filters: { code: 'company_admin_notification' },
      })) ?? FALLBACK_COMPANY_ADMIN_NOTIFICATION;

    const adminSubject = renderString(adminTemplate.subject, companyRequest);
    const adminBody    = renderString(adminTemplate.body, companyRequest);

    try {
      await strapi.plugin('email').service('email').send({
        to: adminTo,
        cc: adminCc,
        from: fromHeader,
        replyTo: replyToHeader || undefined,
        subject: adminSubject,
        text: adminBody,
        html: adminBody.replace(/\n/g, '<br/>'),
      });
    } catch (err: any) {
      strapi.log.error('Error al enviar notificación de empresa al responsable:', err);

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Fallo al notificar solicitud empresarial',
        modulo: 'Empresas',
        descripcion: `No se pudo notificar al responsable sobre la solicitud de ${companyRequest.empresa}. Error: ${err.message}`,
        nivel: ACTIVITY_LEVEL.error,
        refModel: CONTENT_TYPES.companyRequest,
        refId,
      });

      return;
    }

    try {
      await strapi.documents(CONTENT_TYPES.emailLog).create({
        data: {
          destinatario: adminTo,
          cc: adminCc,
          asunto: adminSubject,
          cuerpo_texto: adminBody,
          cuerpo_html: adminBody.replace(/\n/g, '<br/>'),
          estado: EMAIL_STATUS.sent,
          tipo: 'Administración',
          fecha_envio: new Date(),
          referencia_modelo: CONTENT_TYPES.companyRequest,
          referencia_id: refId,
        },
      });
    } catch (logErr) {
      strapi.log.error('No se pudo registrar email-log de notificación empresarial:', logErr);
    }

    await strapi.service(CONTENT_TYPES.activityLog).safeLog({
      accion: 'Notificación enviada a responsable empresarial',
      modulo: 'Empresas',
      descripcion: `Se notificó al responsable sobre la solicitud de ${companyRequest.empresa}.`,
      nivel: ACTIVITY_LEVEL.info,
      refModel: CONTENT_TYPES.companyRequest,
      refId,
    });
  },
});
