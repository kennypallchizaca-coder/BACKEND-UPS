// Controlador que expone resumenes, actividad reciente y metricas del dashboard.
import type { Core } from '@strapi/strapi';
import { sendControllerResponse } from '../../../shared/utils/controller';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getSummary(ctx) {
    await sendControllerResponse({
      strapi,
      ctx,
      action: () => strapi.service('api::dashboard.dashboard').getSummary(),
      logMessage: 'Dashboard summary fetch failed',
      clientMessage: 'Dashboard summary fetch failed',
    });
  },

  async getRecentLeads(ctx) {
    await sendControllerResponse({
      strapi,
      ctx,
      action: () => strapi.service('api::dashboard.dashboard').getRecentLeads(),
      logMessage: 'Dashboard recent leads fetch failed',
      clientMessage: 'Recent leads fetch failed',
    });
  },

  async getRecentCompanyRequests(ctx) {
    await sendControllerResponse({
      strapi,
      ctx,
      action: () => strapi.service('api::dashboard.dashboard').getRecentCompanyRequests(),
      logMessage: 'Dashboard recent company requests fetch failed',
      clientMessage: 'Recent company requests fetch failed',
    });
  },

  async getEmailStats(ctx) {
    await sendControllerResponse({
      strapi,
      ctx,
      action: () => strapi.service('api::dashboard.dashboard').getEmailStats(),
      logMessage: 'Dashboard email stats fetch failed',
      clientMessage: 'Email stats fetch failed',
    });
  },

  async getRecentActivity(ctx) {
    await sendControllerResponse({
      strapi,
      ctx,
      action: () => strapi.service('api::dashboard.dashboard').getRecentActivity(),
      logMessage: 'Dashboard recent activity fetch failed',
      clientMessage: 'Recent activity fetch failed',
    });
  },
});
