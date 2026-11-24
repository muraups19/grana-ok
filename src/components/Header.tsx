import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Plus, RefreshCw } from 'lucide-react'
import { MONTHS, MONTHS_FULL } from '@/lib/utils'
import Modal from './modals/Modal'

interface Props {
  title: string
  eyebrow?: string
  month: number
  year: number
  onChangeMonth: (delta: number) => void
  onSelectMonth: (m: number, y: number) => void
  onSync: () => void
  onAdd: () => void
  syncing: boolean
  showMonth?: boolean
}

export default function Header({ title, eyebrow, month, year, onChangeMonth, onSelectMonth, onSync, onAdd, syncing, showMonth = true }: Props) {
  const [pickerYear, setPickerYear] = useState(year)
  const [showPicker, setShowPicker] = useState(false)
  const now = new Date()
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear()

  return (
    <>
      <header className="page-head">
        <div style={{ minWidth: 0 }}>
          {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
          <h1 className="page-title">{title}</h1>
        </div>

        <div className="page-actions">
          {showMonth && (
            <div className="month-pill glass">
              <button className="arrow" onClick={() => onChangeMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
              <button className="label" onClick={() => { setPickerYear(year); setShowPicker(true) }}>
                {MONTHS[month - 1]}{year !== now.getFullYear() && <span style={{ color: 'var(--label-2)', fontWeight: 500 }}>&nbsp;{String(year).slice(2)}</span>}
                <ChevronDown size={14} style={{ color: 'var(--label-2)' }} />
              </button>
              <button className="arrow" onClick={() => onChangeMonth(1)} aria-label="Próximo mês"><ChevronRight size={18} /></button>
            </div>
          )}
          <button className="icon-btn only-wide" onClick={onSync} title="Sincronizar fixos e parcelas" aria-label="Sincronizar">
            <RefreshCw size={17} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="icon-btn tint only-narrow" onClick={onAdd} aria-label="Nova despesa">
            <Plus size={21} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <Modal id="modal-month" open={showPicker} onClose={() => setShowPicker(false)} title="Escolher mês">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button className="icon-btn" onClick={() => setPickerYear(p => p - 1)} aria-label="Ano anterior"><ChevronLeft size={18} /></button>
          <span className="num" style={{ fontWeight: 750, fontSize: 22 }}>{pickerYear}</span>
          <button className="icon-btn" onClick={() => setPickerYear(p => p + 1)} aria-label="Próximo ano"><ChevronRight size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
          {MONTHS_FULL.map((name, i) => {
            const active = i + 1 === month && pickerYear === year
            const today = i === now.getMonth() && pickerYear === now.getFullYear()
            return (
              <button key={name} className={`chip${active ? ' active' : ''}`}
                style={{ justifyContent: 'center', padding: '12px 4px', borderRadius: 14, color: !active && today ? 'var(--tint)' : undefined }}
                onClick={() => { onSelectMonth(i + 1, pickerYear); setShowPicker(false) }}>
                {MONTHS[i]}
              </button>
            )
          })}
        </div>
        {!isCurrent && (
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { onSelectMonth(now.getMonth() + 1, now.getFullYear()); setShowPicker(false) }}>
            Voltar para o mês atual
          </button>
        )}
      </Modal>
    </>
  )
}
