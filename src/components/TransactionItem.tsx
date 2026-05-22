import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '@/types'
import { fmtBRL, isoToBR } from '@/lib/utils'

interface Props {
  item: Transaction
  type: 'expense' | 'extra'
  onEdit?: (item: Transaction) => void
  onDelete?: (item: Transaction) => void
}

export default function TransactionItem({ item, type, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  const isFixo    = item.installment.toLowerCase() === 'fixo'
  const isParcela = /^\d+\/\d+$/.test(item.installment)
  const isExtra   = type === 'extra'

  const valColor = isExtra ? 'var(--accent-green)' : 'var(--accent-red)'
  const prefix   = isExtra ? '+' : ''

  const displayDate = item.transaction_date ? isoToBR(item.transaction_date) : '-'

  return (
    <div className={`tx-item${expanded ? ' expanded' : ''}`}>
      <div
        className="tx-item-header"
        onClick={e => {
          if ((e.target as HTMLElement).closest('.tx-actions')) return
          setExpanded(p => !p)
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{item.description}</span>
            {isFixo    && <span className="badge badge-fixo">FIXO</span>}
            {isParcela && <span className="badge badge-parcela">{item.installment}</span>}
            {isExtra   && <span className="badge badge-extra">EXTRA</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>{item.bank || '—'}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-med)', display: 'inline-block' }} />
            <span>{displayDate}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            fontSize: 14, color: valColor,
          }}>
            {prefix}{fmtBRL(item.amount)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            <ChevronDown size={12} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="tx-item-detail">
          {[
            ['Descrição',   item.description],
            ['Banco/Método',item.bank || '—'],
            ['Data',        displayDate],
            ['Valor',       `${prefix}${fmtBRL(item.amount)}`],
            ...(item.installment && item.installment !== '-' ? [['Parcela', item.installment]] : []),
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: label === 'Valor' ? 700 : 500 }}>{val}</span>
            </div>
          ))}

          {/* Actions */}
          <div className="tx-actions" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!isExtra && onEdit && (
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
