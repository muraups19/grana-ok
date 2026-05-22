/** Formata número como BRL: R$ 1.234,56 */
export function fmtBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function isoToBR(iso: string | null | undefined): string {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** DD/MM/YYYY → YYYY-MM-DD */
export function brToISO(br: string | null | undefined): string {
  if (!br || !br.includes('/')) return br ?? ''
  const [d, m, y] = br.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/** Retorna YYYYMM numérico */
export function dateNum(month: number, year: number): number {
  return year * 100 + month
}

/** Nomes abreviados dos meses em PT-BR */
export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

/** Nomes completos dos meses */
export const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Gera um ID único com prefixo */
export function genId(prefix = 'T'): string {
  return `${prefix}${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`
}

/** Clamp de valor numérico */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

/** Capitalize first letter */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Returns initials from name (up to 2 chars) */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}
