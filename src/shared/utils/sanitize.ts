/**
 * Elimina caracteres de control (ASCII < 32 y DEL) de un string.
 */
function stripControlChars(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : char;
    })
    .join('');
}

const HTML_TAGS = /<[^>]*>/g;

/**
 * Sanitiza texto de entrada del usuario: elimina HTML, caracteres de control,
 * espacios múltiples y limita la longitud. Retorna '' si el valor no es string.
 */
export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';

  return stripControlChars(value)
    .replace(HTML_TAGS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
