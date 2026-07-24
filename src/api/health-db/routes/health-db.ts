// Ruta pública para verificar el estado de la base de datos.
// No requiere autenticación — solo devuelve estado operativo sin datos sensibles.

export default {
  routes: [
    {
      method: 'GET',
      path: '/health-db',
      handler: 'health-db.check',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
