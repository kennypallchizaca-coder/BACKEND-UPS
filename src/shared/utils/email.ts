import path from 'path';

/**
 * Construye el header "From" para correos con formato: "Nombre" <email@dominio.com>
 * Si no hay nombre, retorna solo el email. Si no hay nada, retorna undefined.
 */
export function buildFromHeader(
  fromName: string | undefined | null,
  fromEmail: string | undefined | null
): string | undefined {
  if (!fromEmail) return undefined;
  return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
}

/**
 * Convierte el array de archivos adjuntos de Strapi (archivosRespuesta)
 * en el formato requerido por nodemailer para el envío de correos.
 * Los archivos con URL relativa (/uploads/...) se convierten a ruta absoluta.
 */
export function buildAttachments(files: any[] | null | undefined): any[] {
  if (!files || !Array.isArray(files)) return [];

  return files.map((file) => {
    let filePath = file.url;
    if (filePath?.startsWith('/')) {
      filePath = path.join(process.cwd(), 'public', filePath);
    }
    return {
      filename: file.name,
      path: filePath,
      contentType: file.mime,
    };
  });
}
