import { PieChart } from 'lucide-react'
import type { Transaction } from '@/types'
import { getCategory, autoCategorize, type CategoryHistory, type CategoryKind } from '@/lib/categories'
import { fmtBRL } from '@/lib/utils'
import { CategoryIcon } from '@/components/ui'

interface Props {
  title?: string
  items: Transaction[]
  kind?: CategoryKind
  history?: CategoryHistory
  limit?: number
  active?: string | null
  onSelect?: (id: string | null) => void
}

/** Categoria efetiva: a salva ou, para registros antigos, a sugerida automaticamente */
export function effectiveCategory(t: Transaction, history?: CategoryHistory) {
  return t.category ?? autoCategorize(t.description, t.type, history)
}

export function groupByCategory(items: Transaction[], history?: CategoryHistory) {
  const map = new Map<string, number>()
  for (const t of items) {
    const c = effectiveCategory(t, history)
    map.set(c, (map.get(c) ?? 0) + t.amount)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

/** Gastos por categoria — barras horizontais ordenadas por valor */
export default function CategoryBreakdown({ title = 'Por categoria', items, kind = 'expense', history, limit = 8, active, onSelect }: Props) {
  const rows = groupByCategory(items, history)
  const total = rows.reduce((s, [, v]) => s + v, 0)
  const max = rows[0]?.[1] ?? 0
  const shown = rows.slice(0, limit)
  const rest = rows.slice(limit).reduce((s, [, v]) => s + v, 0)

  return (
    <section className="card">
      <div className="card-title">{title}<small className="num">{fmtBRL(total)}</small></div>
      {rows.length === 0 ? (
        <div className="empty-state" style={{ padding: '18px 0' }}>
          <div className="empty-icon"><PieChart size={24} /></div>
          Sem lançamentos neste mês
        </div>
      ) : (
        <div>
          {shown.map(([id, value]) => {
            const c = getCategory(id, kind)
            const pct = total > 0 ? (value / total) * 100 : 0
            const isActive = active === id
            return (
              <button key={id} className="cat-row" onClick={() => onSelect?.(isActive ? null : id)}
                title={`${c.label}: ${fmtBRL(value)} (${pct.toFixed(1).replace('.', ',')}%)`}
                style={isActive ? { background: 'var(--fill)' } : undefined} aria-pressed={isActive}>
                <CategoryIcon id={id} kind={kind} size={32} />
                <span className="cat-name">{c.label}</span>
                <span className="cat-val num">{fmtBRL(value)}</span>
                <span className="cat-bar"><i style={{ width: `${max ? (value / max) * 100 : 0}%`, background: c.color }} /></span>
                <span className="cat-pct num">{Math.round(pct)}%</span>
              </button>
            )
          })}
          {rest > 0 && <p className="hint" style={{ textAlign: 'right' }}>+ {fmtBRL(rest)} em outras categorias</p>}
        </div>
      )}
    </section>
  )
}
