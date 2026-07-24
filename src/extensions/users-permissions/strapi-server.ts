// Mantiene el plugin solo para permisos publicos/admin y retira el login publico.
type ContentApiRoute = {
  path?: string;
};

type UsersPermissionsPlugin = {
  routes?: {
    'content-api'?: {
      routes?: ContentApiRoute[];
    };
  };
};

const disabledPublicRoutePrefixes = ['/auth', '/connect', '/users', '/roles', '/permissions'];

function isDisabledPublicRoute(route: ContentApiRoute): boolean {
  const path = route.path ?? '';
  return disabledPublicRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export default (plugin: UsersPermissionsPlugin) => {
  const contentApiRoutes = plugin.routes?.['content-api'];

  if (contentApiRoutes?.routes) {
    contentApiRoutes.routes = contentApiRoutes.routes.filter((route) => !isDisabledPublicRoute(route));
  }

  return plugin;
};
