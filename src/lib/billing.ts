import type { Card } from '@/types'

export interface BillingInfo {
  /** Mês/ano em que a compra será PAGA (mês exibido no app) */
  month: number
  year: number
  /** Datas da fatura, quando o método é um cartão com fechamento */
  closing?: Date
  due?: Date
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

/** Cria a data, ajustando dias inexistentes (ex.: 31 em fevereiro → 28/29). */
function safeDate(year: number, month: number, day: number) {
  const d = new Date(year, month - 1, 1)
  const y = d.getFullYear(), m = d.getMonth() + 1
  return new Date(y, m - 1, Math.min(day, daysInMonth(y, m)))
}

/**
 * Calcula em qual mês uma compra cai, de acordo com o fechamento do cartão.
 *
 * - Compra ANTES do dia de fechamento → entra na fatura que fecha neste mês.
 * - Compra NO dia de fechamento ou depois → entra na fatura do mês seguinte
 *   (o dia do fechamento é o "melhor dia de compra").
 * - Se o vencimento é depois do fechamento (ex.: fecha 18, vence 25), paga‑se
 *   no mesmo mês do fechamento; se for antes (ex.: fecha 28, vence 5), no mês seguinte.
 *
 * Exemplos (compra em 05/12):
 *   Nubank (fecha 18, vence 25)       → paga em dezembro
 *   Mercado Pago (fecha 3, vence 10)  → paga em janeiro
 */
export function billingFor(dateISO: string, card?: Pick<Card, 'closing_day' | 'due_day'> | null): BillingInfo {
  const [y, m, d] = dateISO.split('-').map(Number)
  if (!y || !m) {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  }
  if (!card || !card.closing_day) return { month: m, year: y }

  const closingDay = card.closing_day
  const effectiveClosing = Math.min(closingDay, daysInMonth(y, m))
  const closing = safeDate(y, d >= effectiveClosing ? m + 1 : m, closingDay)

  const dueDay = card.due_day ?? Math.min(closingDay + 7, 28)
  const dueSameMonth = dueDay > closingDay
  const due = safeDate(closing.getFullYear(), closing.getMonth() + 1 + (dueSameMonth ? 0 : 1), dueDay)

  return { month: due.getMonth() + 1, year: due.getFullYear(), closing, due }
}

/** Soma `offset` meses a um mês/ano. */
export function addMonths(month: number, year: number, offset: number) {
  const d = new Date(year, month - 1 + offset, 1)
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

/** Encontra o cartão pelo nome digitado no campo "Banco / Método". */
export function findCard(cards: Card[], bank: string | null | undefined): Card | undefined {
  if (!bank) return undefined
  const n = bank.trim().toLowerCase()
  return cards.find(c => c.name.trim().toLowerCase() === n)
}

/** Presets com cores para facilitar o cadastro. Fechamento/vencimento variam por cliente. */
export const CARD_PRESETS: { name: string; color: string }[] = [
  { name: 'Nubank',        color: '#820AD1' },
  { name: 'Inter',         color: '#FF7A00' },
  { name: 'Mercado Pago',  color: '#00B1EA' },
  { name: 'Itaú',          color: '#EC7000' },
  { name: 'C6',            color: '#2C2C2E' },
  { name: 'Bradesco',      color: '#CC092F' },
  { name: 'Santander',     color: '#EC0000' },
  { name: 'Banco do Brasil', color: '#F8D117' },
  { name: 'Caixa',         color: '#005CA9' },
  { name: 'PicPay',        color: '#21C25E' },
  { name: 'XP',            color: '#1C1C1E' },
  { name: 'BTG',           color: '#0B2D5B' },
]

export const CARD_COLORS = ['#820AD1', '#FF7A00', '#00B1EA', '#34C759', '#FF3B30', '#007AFF', '#FF2D55', '#F8D117', '#2C2C2E', '#8E8E93']

/** Métodos sem fatura sempre disponíveis */
export const DIRECT_METHODS = ['Pix', 'Débito', 'Dinheiro', 'Boleto']
