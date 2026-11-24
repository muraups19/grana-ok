import { useState } from 'react'
import { ChevronRight, Pencil, Trash2, Repeat } from 'lucide-react'
import type { Transaction } from '@/types'
import { fmtBRL, isoToBR } from '@/lib/utils'
import { getCategory, type CategoryHistory } from '@/lib/categories'
import { CategoryIcon } from '@/components/ui'
import { effectiveCategory } from '@/components/CategoryBreakdown'

interface Props {
  item: Transaction
  type: 'expense' | 'extra'
  history?: CategoryHistory
  onEdit?: (item: Transaction) => void
  onDelete?: (item: Transaction) => void
}

export default function TransactionItem({ item, type, history, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  const isFixo    = item.installment.toLowerCase() === 'fixo'
  const isParcela = /^\d+\/\d+$/.test(item.installment)
  const isExtra   = type === 'extra'
  const catId = effectiveCategory(item, history)
  const cat = getCategory(catId, type)

  const displayDate = item.transaction_date ? isoToBR(item.transaction_date) : '-'
  const bank = item.bank && item.bank !== '-' ? item.bank : null

  return (
    <div className="row-wrap">
      <button className="row" onClick={() => setExpanded(p => !p)} aria-expanded={expanded}>
        <CategoryIcon id={catId} kind={type} />
        <div className="row-body">
          <div className="row-title">{item.description}</div>
          <div className="row-sub">
            <span>{cat.label}</span>
            {bank && <><span className="dot" />{bank}</>}
            {isFixo    && <span className="badge"><Repeat size={10} /> Fixa</span>}
            {isParcela && <span className="badge num">{item.installment}</span>}
          </div>
        </div>
        <div className="row-end">
          <div className="row-amount num" style={{ color: isExtra ? 'var(--green)' : 'var(--label)' }}>
            {isExtra ? '+' : '−'}{fmtBRL(item.amount)}
          </div>
          <div className="row-meta num">{displayDate.slice(0, 5)}</div>
        </div>
        <ChevronRight size={16} className="row-chevron" style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none' }} />
      </button>

      {expanded && (
        <div className="row-detail">
          <dl className="detail-grid">
            <dt>Data</dt><dd className="num">{displayDate}</dd>
            {bank && <><dt>Cartão / método</dt><dd>{bank}</dd></>}
            <dt>Categoria</dt><dd>{cat.label}{!item.category && <span className="badge tint" style={{ marginLeft: 6 }}>sugerida</span>}</dd>
            {isParcela && <><dt>Parcela</dt><dd className="num">{item.installment}</dd></>}
            {isFixo && <><dt>Recorrência</dt><dd>Todo mês</dd></>}
          </dl>
          <div className="row-actions">
            {onEdit && (
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onEdit(item)}>
                <Pencil size={14} /> Editar
              </button>
            )}
            {onDelete && (
              <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => onDelete(item)}>
                <Trash2 size={14} /> Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
