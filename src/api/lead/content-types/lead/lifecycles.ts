import { CONTENT_TYPES } from '../../../../shared/constants/content-types';

export default {
  async afterUpdate(event: any) {
    const { result } = event;

    // Si el usuario marcó 'enviarRespuestaPersonalizada' como true en esta actualización
    if (result.enviarRespuestaPersonalizada === true) {
      // Cargamos el lead completo incluyendo los archivos adjuntos
      const lead = await strapi.documents(CONTENT_TYPES.interestedLead).findOne({
        documentId: result.documentId,
        populate: ['archivosRespuesta']
      });

      if (!lead) return;

      const subject = lead.asuntoRespuesta || 'Información solicitada';
      const message = lead.mensajeRespuesta;

      if (!message) {
        // Apagamos el interruptor en la base de datos
        await strapi.documents(CONTENT_TYPES.interestedLead).update({
          documentId: lead.documentId,
          data: {
            enviarRespuestaPersonalizada: false
          }
        });
        throw new Error('Debe escribir un "mensajeRespuesta" antes de activar el envío.');
      }

      try {
        // 1. Enviar el correo (servicio maneja attachments y logs)
        await strapi.service(CONTENT_TYPES.interestedLead).sendCustomResponseEmailOnly(lead, subject, message);

        // 2. Apagar el interruptor y actualizar el estado
        await strapi.documents(CONTENT_TYPES.interestedLead).update({
          documentId: lead.documentId,
          data: {
            enviarRespuestaPersonalizada: false,
            estado: 'Respuesta enviada'
          }
        });
      } catch (err) {
        // En caso de error, apagamos el interruptor para evitar bucles si hay reintentos
        try {
          await strapi.documents(CONTENT_TYPES.interestedLead).update({
            documentId: lead.documentId,
            data: {
              enviarRespuestaPersonalizada: false
            }
          });
        } catch (updateErr) {
          strapi.log.error('No se pudo apagar el interruptor de envío tras error:', updateErr);
        }
        throw err;
      }
    }
  }
};
