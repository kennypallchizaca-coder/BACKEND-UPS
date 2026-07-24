// Servicio que calcula metricas y listados recientes para el dashboard.
import type { Core } from '@strapi/strapi';
import { CONTENT_TYPES, EMAIL_STATUS } from '../../../shared/constants/content-types';
import { DASHBOARD_LIMITS } from '../constants/dashboard';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getSummary() {
    const [publicationsCount, leadsCount, companiesCount, emailsCount, failedEmailsCount] =
      await Promise.all([
        strapi.documents(CONTENT_TYPES.publication).count({}),
        strapi.documents(CONTENT_TYPES.interestedLead).count({}),
        strapi.documents(CONTENT_TYPES.companyRequest).count({}),
        strapi.documents(CONTENT_TYPES.emailLog).count({
          filters: { estado: EMAIL_STATUS.sent },
        }),
        strapi.documents(CONTENT_TYPES.emailLog).count({
          filters: { estado: EMAIL_STATUS.failed },
        }),
      ]);

    return {
      publicationsCount,
      leadsCount,
      companiesCount,
      emailsCount,
      failedEmailsCount,
    };
  },

  getRecentLeads() {
    return strapi.documents(CONTENT_TYPES.interestedLead).findMany({
      sort: 'createdAt:desc',
      limit: DASHBOARD_LIMITS.recentLeads,
    });
  },

  getRecentCompanyRequests() {
    return strapi.documents(CONTENT_TYPES.companyRequest).findMany({
      sort: 'createdAt:desc',
      limit: DASHBOARD_LIMITS.recentCompanyRequests,
    });
  },

  getEmailStats() {
    return strapi.documents(CONTENT_TYPES.emailLog).findMany({
      sort: 'fecha_envio:desc',
      limit: DASHBOARD_LIMITS.emailStats,
    });
  },

  getRecentActivity() {
    return strapi.documents(CONTENT_TYPES.activityLog).findMany({
      sort: 'fecha:desc',
      limit: DASHBOARD_LIMITS.recentActivity,
    });
  },
});
