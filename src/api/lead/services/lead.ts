// Servicio de lógica de negocio para leads: creación, notificaciones por correo y respuestas personalizadas.

import { factories } from '@strapi/strapi';
import { ACTIVITY_LEVEL, CONTENT_TYPES } from '../../../shared/constants/content-types';
import { renderString } from '../../../shared/utils/render';
import { buildFromHeader, buildAttachments } from '../../../shared/utils/email';
import { sanitizeText } from '../../../shared/utils/sanitize';

// ── Plantillas de fallback ─────────────────────────────────────────────────────
// Se usan solo si la colección de plantillas en Strapi está vacía (primer arranque).

const FALLBACK_CONFIRMATION = {
  subject: 'Solicitud recibida',
  body: 'Hola {{nombre}},\n\nHemos recibido tu solicitud correctamente. Nuestro equipo de admisiones revisará la información enviada y te contactará pronto con una respuesta personalizada.\n\nGracias por comunicarte con nosotros.',
};

const FALLBACK_ADMIN_NOTIFICATION = {
  subject: 'Nueva solicitud de información recibida',
  body: 'Se ha recibido una nueva solicitud de información.\n\nDatos del interesado:\n\nNombre: {{nombre}}\nApellido: {{apellido}}\nCorreo: {{email}}\nTeléfono: {{telefono}}\nPrograma de interés: {{programaInteres}}\nColegio/Institución: {{institucion}}\nMensaje: {{mensaje}}\nFuente: {{source}}\n\nPor favor revisar la solicitud desde el panel de administración.',
};

// ── Servicio ───────────────────────────────────────────────────────────────────

export default factories.createCoreService('api::lead.lead', ({ strapi }) => ({

  // ── Helpers internos ─────────────────────────────────────────────────────────

  /** Registra un correo enviado o fallido en el email-log. */
  async logEmail({
    destinatario,
    cc,
    asunto,
    cuerpo,
    estado,
    error,
    refId,
  }: {
    destinatario: string;
    cc?: string;
    asunto: string;
    cuerpo: string;
    estado: 'Enviado' | 'Fallido';
    error?: string;
    refId: string | number;
  }) {
    try {
      await strapi.documents(CONTENT_TYPES.emailLog).create({
        data: {
          destinatario,
          cc: cc || undefined,
          asunto,
          cuerpo_texto: cuerpo,
          cuerpo_html: cuerpo.includes('<') ? cuerpo : cuerpo.replace(/\n/g, '<br/>'),
          estado,
          mensaje_error: error || null,
          fecha_envio: estado === 'Enviado' ? new Date() : null,
          tipo: 'Confirmación',
          referencia_modelo: CONTENT_TYPES.interestedLead,
          referencia_id: String(refId),
        },
      });
    } catch (logErr) {
      strapi.log.error('Error al guardar log de correo:', logErr);
    }
  },

  // ── Métodos públicos ─────────────────────────────────────────────────────────

  /**
   * Procesa una nueva solicitud de interesado:
   * 1. Guarda en la BD con estado 'Nuevo'
   * 2. Envía confirmación al interesado
   * 3. Envía notificación al equipo de admisiones
   */
  async submitLead(data: Record<string, any>) {
    const leadData = {
      nombre: sanitizeText(data.nombre, 120),
      apellido: sanitizeText(data.apellido, 120),
      email: sanitizeText(data.email, 254).toLowerCase(),
      telefono: sanitizeText(data.telefono, 20).replace(/[^\d+()\-\s]/g, ''),
      programaInteres: sanitizeText(data.programaInteres, 160),
      mensaje: sanitizeText(data.mensaje, 1500),
      institucion: sanitizeText(data.institucion, 160),
      source: sanitizeText(data.source, 120),
    };

    const { nombre, email, telefono, programaInteres } = leadData;

    if (!nombre || !email || !telefono || !programaInteres) {
      throw new Error('Faltan campos obligatorios: nombre, email, telefono o programaInteres.');
    }

    // 1. Guardar con estado inicial
    const lead = await strapi.documents(CONTENT_TYPES.interestedLead).create({
      data: { ...leadData, estado: 'Nuevo' } as any,
    });

    // 2. Log de actividad
    await strapi.service(CONTENT_TYPES.activityLog).safeLog({
      accion: 'Registro de nuevo prospecto',
      modulo: 'Leads',
      descripcion: `Se registró una nueva solicitud de información por parte de ${lead.nombre} ${lead.apellido || ''}.`,
      refModel: CONTENT_TYPES.interestedLead,
      refId: String(lead.id),
      nivel: ACTIVITY_LEVEL.info,
    });

    // 3. Configuración de correo (sender)
    const settings = await strapi.service(CONTENT_TYPES.emailSetting).find();
    const fromHeader = buildFromHeader(
      settings?.nombre_del_sistema_que_envia,
      process.env.SMTP_USERNAME
    );
    const replyToHeader = settings?.correo_para_recibir_respuestas;

    // 4. Correo de confirmación al interesado
    let confirmationSent = false;

    const confirmTemplate =
      (await strapi.documents(CONTENT_TYPES.leadEmailTemplate).findFirst({
        filters: { code: 'lead_confirmation' },
      })) ?? FALLBACK_CONFIRMATION;

    const confirmSubject = renderString(confirmTemplate.subject, lead);
    const confirmBody    = renderString(confirmTemplate.body, lead);

    try {
      await strapi.plugin('email').service('email').send({
        to: lead.email,
        from: fromHeader,
        replyTo: replyToHeader || undefined,
        subject: confirmSubject,
        text: confirmBody,
        html: confirmBody.replace(/\n/g, '<br/>'),
      });
      confirmationSent = true;

      await this.logEmail({
        destinatario: lead.email,
        asunto: confirmSubject,
        cuerpo: confirmBody,
        estado: 'Enviado',
        refId: lead.documentId || lead.id,
      });

      await strapi.documents(CONTENT_TYPES.interestedLead).update({
        documentId: lead.documentId as string,
        data: { estado: 'Confirmación enviada' },
      });

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Confirmación enviada a interesado',
        modulo: 'Leads',
        descripcion: `Se envió confirmación de recepción a ${lead.nombre} ${lead.apellido || ''} (${lead.email}).`,
        refModel: CONTENT_TYPES.interestedLead,
        refId: String(lead.id),
        nivel: ACTIVITY_LEVEL.info,
      });
    } catch (err: any) {
      strapi.log.error('Error al enviar correo de confirmación al lead:', err);
      await this.logEmail({
        destinatario: lead.email,
        asunto: confirmSubject,
        cuerpo: confirmBody,
        estado: 'Fallido',
        error: err.message,
        refId: lead.documentId || lead.id,
      });

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Fallo al enviar confirmación a interesado',
        modulo: 'Leads',
        descripcion: `No se pudo enviar confirmación a ${lead.nombre} ${lead.apellido || ''} (${lead.email}). Error: ${err.message}`,
        refModel: CONTENT_TYPES.interestedLead,
        refId: String(lead.id),
        nivel: ACTIVITY_LEVEL.error,
      });
    }

    // 5. Notificación al equipo de admisiones
    let adminNotified = false;

    if (settings?.correo_del_administrador_para_alertas) {
      const adminTemplate =
        (await strapi.documents(CONTENT_TYPES.leadEmailTemplate).findFirst({
          filters: { code: 'admissions_notification' },
        })) ?? FALLBACK_ADMIN_NOTIFICATION;

      const adminSubject = renderString(adminTemplate.subject, lead);
      const adminBody    = renderString(adminTemplate.body, lead);

      try {
        await strapi.plugin('email').service('email').send({
          to: settings.correo_del_administrador_para_alertas,
          cc: settings.correo_del_administrador_copia || undefined,
          from: fromHeader,
          replyTo: replyToHeader || undefined,
          subject: adminSubject,
          text: adminBody,
          html: adminBody.replace(/\n/g, '<br/>'),
        });
        adminNotified = true;

        await this.logEmail({
          destinatario: settings.correo_del_administrador_para_alertas,
          cc: settings.correo_del_administrador_copia,
          asunto: adminSubject,
          cuerpo: adminBody,
          estado: 'Enviado',
          refId: lead.documentId || lead.id,
        });

        await strapi.service(CONTENT_TYPES.activityLog).safeLog({
          accion: 'Notificación enviada a admisiones',
          modulo: 'Leads',
          descripcion: `Se notificó al equipo de admisiones sobre la solicitud de ${lead.nombre} ${lead.apellido || ''}.`,
          refModel: CONTENT_TYPES.interestedLead,
          refId: String(lead.id),
          nivel: ACTIVITY_LEVEL.info,
        });
      } catch (err: any) {
        strapi.log.error('Error al enviar correo de notificación al administrador:', err);
        await this.logEmail({
          destinatario: settings.correo_del_administrador_para_alertas,
          cc: settings.correo_del_administrador_copia,
          asunto: adminSubject,
          cuerpo: adminBody,
          estado: 'Fallido',
          error: err.message,
          refId: lead.documentId || lead.id,
        });

        await strapi.service(CONTENT_TYPES.activityLog).safeLog({
          accion: 'Fallo al notificar a admisiones',
          modulo: 'Leads',
          descripcion: `No se pudo notificar al equipo de admisiones sobre la solicitud de ${lead.nombre} ${lead.apellido || ''}. Error: ${err.message}`,
          refModel: CONTENT_TYPES.interestedLead,
          refId: String(lead.id),
          nivel: ACTIVITY_LEVEL.error,
        });
      }
    }

    return {
      success: true,
      message: 'Solicitud recibida correctamente',
      data: {
        leadId: lead.id,
        confirmationEmailSent: confirmationSent,
        admissionsNotificationSent: adminNotified,
      },
    };
  },

  /**
   * Actualiza el lead con los datos de respuesta, lo que dispara el lifecycle
   * `afterUpdate` que ejecuta el envío del correo personalizado.
   */
  async sendCustomResponse(id: string, responseData: { subject: string; message: string }) {
    const { subject, message } = responseData;

    if (!subject || !message) {
      throw new Error('Faltan campos obligatorios: subject o message.');
    }

    const lead = await strapi.documents(CONTENT_TYPES.interestedLead).findOne({ documentId: id });

    if (!lead) {
      throw new Error('El prospecto no existe.');
    }

    await strapi.documents(CONTENT_TYPES.interestedLead).update({
      documentId: lead.documentId as string,
      data: {
        asuntoRespuesta: subject,
        mensajeRespuesta: message,
        enviarRespuestaPersonalizada: true,
      },
    });

    return {
      success: true,
      message: 'Correo personalizado enviado correctamente',
      data: { leadId: lead.id, emailSent: true },
    };
  },

  /**
   * Envía el correo de respuesta personalizada al interesado con adjuntos.
   * Llamado directamente desde el lifecycle afterUpdate.
   */
  async sendCustomResponseEmailOnly(lead: Record<string, any>, subject: string, message: string) {
    const settings = await strapi.service(CONTENT_TYPES.emailSetting).find();
    const fromHeader   = buildFromHeader(
      settings?.nombre_del_sistema_que_envia,
      process.env.SMTP_USERNAME
    );
    const replyToHeader = settings?.correo_para_recibir_respuestas;
    const attachments   = buildAttachments(lead.archivosRespuesta);
    const refId = lead.documentId || lead.id;

    try {
      await strapi.plugin('email').service('email').send({
        to: lead.email,
        from: fromHeader,
        replyTo: replyToHeader || undefined,
        subject,
        text: message,
        html: message.replace(/\n/g, '<br/>'),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      await this.logEmail({
        destinatario: lead.email,
        asunto: subject,
        cuerpo: message,
        estado: 'Enviado',
        refId,
      });

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Respuesta personalizada enviada',
        modulo: 'Leads',
        descripcion: `Se envió una respuesta personalizada a ${lead.nombre} ${lead.apellido || ''}. Asunto: "${subject}".`,
        refModel: CONTENT_TYPES.interestedLead,
        refId: String(lead.id),
        nivel: ACTIVITY_LEVEL.info,
      });
    } catch (err: any) {
      strapi.log.error('Error al enviar respuesta personalizada:', err);

      await this.logEmail({
        destinatario: lead.email,
        asunto: subject,
        cuerpo: message,
        estado: 'Fallido',
        error: err.message,
        refId,
      });

      await strapi.service(CONTENT_TYPES.activityLog).safeLog({
        accion: 'Fallo al enviar respuesta',
        modulo: 'Leads',
        descripcion: `No se pudo enviar la respuesta personalizada a ${lead.nombre} ${lead.apellido || ''}. Error: ${err.message}`,
        refModel: CONTENT_TYPES.interestedLead,
        refId: String(lead.id),
        nivel: ACTIVITY_LEVEL.error,
      });

      throw new Error(`Error al enviar el correo: ${err.message}`);
    }
  },
}));
