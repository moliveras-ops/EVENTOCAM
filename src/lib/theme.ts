export const colors = {
  primary: '#6D28D9',
  primaryDark: '#4C1D95',
  primarySoft: '#EDE9FE',
  background: '#FAFAFC',
  surface: '#FFFFFF',
  text: '#18181B',
  textMuted: '#71717A',
  border: '#E4E4E7',
  danger: '#DC2626',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
