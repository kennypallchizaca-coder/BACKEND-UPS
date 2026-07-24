/**
 * Reemplaza variables de plantilla {{variable}} con valores reales.
 * Usado en plantillas de correo tanto de leads como de empresas.
 */
export function renderString(template: string, variables: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}
