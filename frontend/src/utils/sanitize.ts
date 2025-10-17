/**
 * Échappe les caractères HTML dangereux pour prévenir XSS
 */
export function escapeHtml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return "";

  const str = String(unsafe);

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize URL pour éviter javascript: et data: URLs
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";

  const str = String(url).trim();

  // Bloquer les URLs dangereuses
  const dangerous = /^(javascript|data|vbscript|file):/i;
  if (dangerous.test(str)) {
    return "";
  }

  // Autoriser seulement http, https, et chemins relatifs
  if (!/^(https?:\/\/|\/|\.\/)/i.test(str)) {
    return "";
  }

  return str;
}

/**
 * Sanitize un attribut HTML
 */
export function escapeAttr(unsafe: string | number | null | undefined): string {
  return escapeHtml(unsafe);
}
