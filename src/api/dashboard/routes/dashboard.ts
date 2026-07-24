// Rutas personalizadas para consultar datos del dashboard.
// Solo /summary es auth:false — devuelve únicamente conteos agregados sin datos personales.
// El resto requiere autenticación admin porque expone registros con datos personales.

export default {
  routes: [
    {
      // Solo totales numéricos — sin datos personales. Usado por el panel Métricas.
      method: 'GET',
      path: '/dashboard/summary',
      handler: 'dashboard.getSummary',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      // Expone nombres, correos y teléfonos — requiere autenticación.
      method: 'GET',
      path: '/dashboard/recent-leads',
      handler: 'dashboard.getRecentLeads',
      config: { policies: [], middlewares: [] },
    },
    {
      // Expone contactos de empresas — requiere autenticación.
      method: 'GET',
      path: '/dashboard/recent-company-requests',
      handler: 'dashboard.getRecentCompanyRequests',
      config: { policies: [], middlewares: [] },
    },
    {
      // Expone direcciones de correo del log — requiere autenticación.
      method: 'GET',
      path: '/dashboard/email-stats',
      handler: 'dashboard.getEmailStats',
      config: { policies: [], middlewares: [] },
    },
    {
      // Expone actividad interna del sistema — requiere autenticación.
      method: 'GET',
      path: '/dashboard/recent-activity',
      handler: 'dashboard.getRecentActivity',
      config: { policies: [], middlewares: [] },
    },
  ],
};
