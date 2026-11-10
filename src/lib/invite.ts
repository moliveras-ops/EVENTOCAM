import * as Linking from 'expo-linking';

import { isValidEventCode, normalizeEventCode } from './ids';
import type { EventoCamEvent } from './types';

export interface InvitePayload {
  code: string;
  name?: string;
  date?: string;
}

/** Enlace que se codifica en el QR: eventocam://join?code=XXXXXX&name=...&date=... */
export function buildInviteUrl(event: EventoCamEvent): string {
  return Linking.createURL('join', {
    queryParams: { code: event.code, name: event.name, date: event.date },
  });
}

/**
 * Interpreta el contenido de un QR o de un texto pegado.
 * Acepta tanto un enlace de invitación como un código suelto.
 */
export function parseInvite(raw: string): InvitePayload | null {
  const text = raw.trim();
  if (!text) return null;

  if (text.includes('://') || text.includes('?')) {
    try {
      const { queryParams } = Linking.parse(text);
      const code = normalizeEventCode(String(queryParams?.code ?? ''));
      if (!isValidEventCode(code)) return null;
      const name = queryParams?.name;
      const date = queryParams?.date;
      return {
        code,
        name: typeof name === 'string' ? name : undefined,
        date: typeof date === 'string' ? date : undefined,
      };
    } catch {
      return null;
    }
  }

  const code = normalizeEventCode(text);
  return isValidEventCode(code) ? { code } : null;
}
