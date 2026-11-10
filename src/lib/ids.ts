// Sin 0/O ni 1/I/L para que el código se pueda dictar y escribir sin confusiones.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const EVENT_CODE_LENGTH = 6;

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateEventCode(): string {
  let code = '';
  for (let i = 0; i < EVENT_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeEventCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidEventCode(code: string): boolean {
  if (code.length !== EVENT_CODE_LENGTH) return false;
  return [...code].every((char) => CODE_ALPHABET.includes(char));
}
