import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { Investment } from '@/types'
import { fmtBRL, fmtPct, isoToBR, investmentTypeLabel, investmentTypeIcon } from '@/lib/utils'

interface Props {
  item: Investment
  onEdit?: (item: Investment) => void
  onDelete?: (item: Investment) => void
}

export default function InvestmentItem({ item, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  const gain = item.current_value - item.amount_invested
  const pct = item.amount_invested > 0 ? (gain / item.amount_invested) * 100 : 0
  const isPositive = gain >= 0
  const gainColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)'

  const displayDate = item.invested_at ? isoToBR(item.invested_at) : '-'

  return (
    <div className={`tx-item${expanded ? ' expanded' : ''}`}>
      <div
        className="tx-item-header"
        onClick={e => {
          if ((e.target as HTMLElement).closest('.tx-actions')) return
          setExpanded(p => !p)
        }}
      >
        <div className="tx-icon">{investmentTypeIcon(item.type)}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3 }}>
            {item.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{investmentTypeLabel(item.type)}</span>
            {item.broker && <><span className="dot" />{item.broker}</>}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            {fmtBRL(item.current_value)}
          </div>
          <div style={{ fontSize: 12, color: gainColor, marginTop: 3, fontWeight: 700 }}>
            {fmtPct(pct)}
          </div>
        </div>

        <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }} />
      </div>

      {expanded && (
        <div className="tx-item-detail">
          {[
            ['Tipo',            investmentTypeLabel(item.type)],
            ['Corretora',       item.broker || '—'],
            ['Data do aporte',  displayDate],
            ['Valor investido', fmtBRL(item.amount_invested)],
            ['Valor atual',     fmtBRL(item.current_value)],
            ['Rentabilidade',   `${isPositive ? '+' : ''}${fmtBRL(gain)} (${fmtPct(pct)})`],
            ...(item.notes ? [['Observações', item.notes]] : []),
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: label === 'Rentabilidade' ? gainColor : 'var(--text-secondary)', fontWeight: label === 'Valor atual' || label === 'Rentabilidade' ? 700 : 500, textAlign: 'right' }}>{val}</span>
            </div>
          ))}

          {/* Actions */}
          <div className="tx-actions" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {onEdit && (
              <button
                className="btn btn-ghost"
                style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
                onClick={e => { e.stopPropagation(); onEdit(item) }}
              >
                <Pencil size={13} /> Editar
              </button>
            )}
            {onDelete && (
              <button
                className="btn btn-danger"
                style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
                onClick={e => { e.stopPropagation(); onDelete(item) }}
              >
                <Trash2 size={13} /> Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
