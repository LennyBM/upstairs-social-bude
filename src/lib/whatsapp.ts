import { site } from '../config/site';

/**
 * Digits-only WhatsApp number, or null when none is configured.
 * Shared by `<WhatsAppButton>` (desktop float) and `<ActionBar>` (`.act-chat`).
 * Lives in `lib/` so neither component file exports a non-component.
 */
export function whatsappNumber(): string | null {
  const digits = site.whatsapp?.replace(/[^0-9]/g, '') ?? '';
  return digits || null;
}
