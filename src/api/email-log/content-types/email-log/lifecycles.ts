import { CONTENT_TYPES } from '../../../../shared/constants/content-types';

export default {
  async beforeCreate(event) {
    const { params } = event;
    const { data } = params;

    // Si se crea directamente como "Aprobado", procedemos a enviar
    if (data.estado === 'Aprobado') {
      try {
        if (!data.destinatario || !data.asunto || (!data.cuerpo_html && !data.cuerpo_texto)) {
          strapi.log.warn('Faltan datos obligatorios para enviar el correo (destinatario, asunto o cuerpo).');
          data.estado = 'Fallido';
          data.mensaje_error = 'Faltan datos obligatorios para el envío.';
          return;
        }

        const isEmpresa = data.tipo === 'Empresa';
        const settings = await strapi.service(
          isEmpresa ? CONTENT_TYPES.companyEmailSetting : CONTENT_TYPES.emailSetting
        ).find();
        const fromName = settings?.nombre_del_sistema_que_envia;
        const fromEmail = process.env.SMTP_USERNAME;
        const from = fromName && fromEmail ? `"${fromName}" <${fromEmail}>` : fromEmail;

        // Enviar usando el plugin de correo nativo de Strapi
        await strapi.plugin('email').service('email').send({
          to: data.destinatario,
          cc: data.cc || undefined,
          from: from || undefined,
          replyTo: settings?.correo_para_recibir_respuestas || undefined,
          subject: data.asunto,
          text: data.cuerpo_texto || '',
          html: data.cuerpo_html || data.cuerpo_texto,
        });

        // Si se envía correctamente, cambiamos el estado antes de guardar en DB
        data.estado = 'Enviado';
        data.fecha_envio = new Date();
        data.mensaje_error = null;

        // Registrar en activity-log
        strapi.service(CONTENT_TYPES.activityLog).safeLog({
          accion: 'Correo enviado',
          modulo: 'Emails',
          descripcion: `El correo con asunto "${data.asunto}" fue enviado a ${data.destinatario} al crearse como Aprobado.`,
          nivel: 'Info',
          refModel: data.referencia_modelo || 'email-log',
          refId: data.referencia_id || 'direct-creation'
        });

      } catch (error) {
        strapi.log.error('Error al intentar enviar el correo tras creación:', error);

        data.estado = 'Fallido';
        data.mensaje_error = error.message || 'Error desconocido al enviar el correo.';

        // Registrar el fallo en activity-log
        strapi.service(CONTENT_TYPES.activityLog).safeLog({
          accion: 'Fallo al enviar correo',
          modulo: 'Emails',
          descripcion: `No se pudo enviar el correo con asunto "${data.asunto}" a ${data.destinatario}. Error: ${error.message}`,
          nivel: 'Error',
          refModel: data.referencia_modelo || 'email-log',
          refId: data.referencia_id || 'direct-creation'
        });
      }
    }
  },

  async beforeUpdate(event) {
    const { params } = event;
    const { data, where } = params;

    // Si el estado está siendo actualizado a "Aprobado", procedemos a enviar
    if (data.estado === 'Aprobado') {
      try {
        // Necesitamos obtener los datos completos del correo si no están todos en el payload de actualización
        const currentEmailLog = await strapi.db.query('api::email-log.email-log').findOne({
          where,
        });

        if (!currentEmailLog) {
          throw new Error('No se encontró el registro de correo a actualizar.');
        }

        // Combinar datos actuales con los datos actualizados
        const emailData = {
          ...currentEmailLog,
          ...data,
        };

        if (!emailData.destinatario || !emailData.asunto || (!emailData.cuerpo_html && !emailData.cuerpo_texto)) {
          strapi.log.warn('Faltan datos obligatorios para enviar el correo (destinatario, asunto o cuerpo).');
          data.estado = 'Fallido';
          data.mensaje_error = 'Faltan datos obligatorios para el envío.';
          return;
        }

        const isEmpresa = emailData.tipo === 'Empresa';
        const settings = await strapi.service(
          isEmpresa ? CONTENT_TYPES.companyEmailSetting : CONTENT_TYPES.emailSetting
        ).find();
        const fromName = settings?.nombre_del_sistema_que_envia;
        const fromEmail = process.env.SMTP_USERNAME;
        const from = fromName && fromEmail ? `"${fromName}" <${fromEmail}>` : fromEmail;

        // Enviar usando el plugin de correo nativo de Strapi
        await strapi.plugin('email').service('email').send({
          to: emailData.destinatario,
          cc: emailData.cc || undefined,
          from: from || undefined,
          replyTo: settings?.correo_para_recibir_respuestas || undefined,
          subject: emailData.asunto,
          text: emailData.cuerpo_texto || '',
          html: emailData.cuerpo_html || emailData.cuerpo_texto,
        });

        // Si se envía correctamente, cambiamos el estado antes de guardar en DB
        data.estado = 'Enviado';
        data.fecha_envio = new Date();
        data.mensaje_error = null;

        // Registrar en activity-log
        strapi.service(CONTENT_TYPES.activityLog).safeLog({
          accion: 'Correo aprobado y enviado',
          modulo: 'Emails',
          descripcion: `El correo con asunto "${emailData.asunto}" fue aprobado manualmente y enviado a ${emailData.destinatario}.`,
          nivel: 'Info',
          refModel: emailData.referencia_modelo || 'email-log',
          refId: emailData.referencia_id || String(currentEmailLog.id)
        });

      } catch (error) {
        strapi.log.error('Error al intentar enviar el correo tras aprobación:', error);

        data.estado = 'Fallido';
        data.mensaje_error = error.message || 'Error desconocido al enviar el correo.';

        // Registrar el fallo en activity-log
        strapi.service(CONTENT_TYPES.activityLog).safeLog({
          accion: 'Fallo al aprobar correo',
          modulo: 'Emails',
          descripcion: `No se pudo enviar el correo aprobado manualmente con asunto "${data.asunto}". Error: ${error.message}`,
          nivel: 'Error',
          refModel: data.referencia_modelo || 'email-log',
          refId: data.referencia_id || 'unknown'
        });
      }
    }
  }
};
