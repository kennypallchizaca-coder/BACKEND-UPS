import React from 'react';

// Ícono SVG de pastel para el menú lateral
const PieIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1.8em"
    height="1.8em"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 0 1 7.94 7H13V4.06A8.07 8.07 0 0 1 12 4zm-1 .06V11H4.06A8 8 0 0 1 11 4.06zM4.06 13H11v6.94A8 8 0 0 1 4.06 13zm8.94 6.94V13h6.94A8 8 0 0 1 13 19.94z"/>
  </svg>
);

export default {
  config: {
    locales: [],
  },

  bootstrap(app: any) {
    app.addMenuLink({
      to: '/crm-dashboard',
      icon: PieIcon,
      intlLabel: {
        id: 'crm-dashboard.plugin.name',
        defaultMessage: 'Métricas',
      },
      Component: () =>
        import('./pages/Metricas').then((mod) => ({ default: mod.default })),
    });
  },
};
