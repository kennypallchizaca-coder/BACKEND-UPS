import { factories } from '@strapi/strapi';

const REQUIRED_FIELDS_ERROR_PREFIX = 'Faltan campos obligatorios';
const PUBLIC_SUBMIT_ERROR = 'No se pudo procesar la solicitud. Intenta nuevamente más tarde.';

export default factories.createCoreController('api::lead.lead', ({ strapi }) => ({
  async submit(ctx) {
    try {
      const data = ctx.request.body;
      const result = await strapi.service('api::lead.lead').submitLead(data);
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Error in leads.submit:', error);
      const message = error instanceof Error && error.message.startsWith(REQUIRED_FIELDS_ERROR_PREFIX)
        ? error.message
        : PUBLIC_SUBMIT_ERROR;

      return ctx.badRequest(message);
    }
  },

  async sendCustomResponse(ctx) {
    try {
      const { id } = ctx.params;
      const { subject, message } = ctx.request.body;

      const result = await strapi.service('api::lead.lead').sendCustomResponse(id, {
        subject,
        message
      });
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Error in leads.sendCustomResponse:', error);
      return ctx.badRequest(error instanceof Error ? error.message : 'Error desconocido al enviar respuesta');
    }
  }
}));
