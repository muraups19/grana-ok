import { CreditCard, Plus } from 'lucide-react'
import type { Card, Transaction } from '@/types'
import { findCard, DIRECT_METHODS } from '@/lib/billing'
import { fmtBRL } from '@/lib/utils'

interface Props {
  expenses: Transaction[]
  cards: Card[]
  month: number
  year: number
  onManage: () => void
  onSelect?: (bank: string) => void
}

/** Total de cada fatura/método no mês selecionado */
export default function CardBills({ expenses, cards, month, year, onManage, onSelect }: Props) {
  const map = new Map<string, number>()
  for (const t of expenses) {
    const key = (t.bank || '').trim() || 'Sem método'
    const card = findCard(cards, key)
    const k = card?.name ?? key
    map.set(k, (map.get(k) ?? 0) + t.amount)
  }
  const rows = [...map.entries()].sort((a, b) => b[1] - a[1])

  return (
    <section className="card">
      <div className="card-title">
        Faturas e métodos
        <button className="link-btn" onClick={onManage} style={{ fontSize: 14 }}>{cards.length ? 'Cartões' : <><Plus size={13} /> Cartão</>}</button>
      </div>
      {rows.length === 0 ? (
        <p className="hint" style={{ margin: 0 }}>Nenhuma despesa neste mês.</p>
      ) : (
        <div className="list" style={{ boxShadow: 'none', background: 'transparent', border: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none', margin: '0 -16px -10px' }}>
          {rows.map(([name, total]) => {
            const card = findCard(cards, name)
            const due = card?.due_day ? new Date(year, month - 1, Math.min(card.due_day, new Date(year, month, 0).getDate())) : null
            return (
              <button key={name} className="row" style={{ minHeight: 54, padding: '9px 16px' }} onClick={() => onSelect?.(name)}>
                <div className="row-icon" style={{ background: card?.color ?? 'var(--fill-2)', width: 32, height: 32, borderRadius: 10, color: card ? '#fff' : 'var(--label-2)' }}>
                  <CreditCard size={16} />
                </div>
                <div className="row-body">
                  <div className="row-title" style={{ fontSize: 15 }}>{name}</div>
                  <div className="row-sub" style={{ fontSize: 12 }}>
                    {card?.closing_day
                      ? <>Fecha dia {card.closing_day}{due && <> · vence {String(due.getDate()).padStart(2, '0')}/{String(month).padStart(2, '0')}</>}</>
                      : card || DIRECT_METHODS.some(m => m.toLowerCase() === name.toLowerCase()) ? 'Sem fatura' : 'Cadastre o cartão para controlar o fechamento'}
                  </div>
                </div>
                <div className="row-amount num" style={{ fontSize: 15 }}>{fmtBRL(total)}</div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
