/**
 * Contact Configuration
 *
 * Centralized contact channels. Update here when channels change.
 * Do not hardcode contact info elsewhere - import from this module.
 */

export const CONTACT_CONFIG = {
  whatsapp: {
    number: "+56993495075",
    displayNumber: "+56 9 9349 5075",
    url: "https://wa.me/56993495075",
  },
  email: "contacto@arbor.school",
} as const;

/**
 * Builds a WhatsApp URL with an optional pre-filled message.
 * @param message - Optional message to pre-fill
 * @returns WhatsApp URL
 */
export function buildWhatsAppUrl(message?: string): string {
  const baseUrl = CONTACT_CONFIG.whatsapp.url;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}
