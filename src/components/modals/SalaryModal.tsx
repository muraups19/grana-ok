import { useState } from 'react'
import Modal from './Modal'
import { fmtBRL } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (amount: number, month: number, year: number) => Promise<void>
  currentSalary: number
  currentMonth: number
  currentYear: number
}

export default function SalaryModal({ open, onClose, onSave, currentSalary, currentMonth, currentYear }: Props) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const [amount, setAmount] = useState('')
  const [monthYear, setMonthYear] = useState(`${currentYear}-${pad(currentMonth)}`)
  const [saving, setSaving] = useState(false)

  const handleClose = () => { setAmount(''); setSaving(false); onClose() }

  const handleSubmit = async () => {
    const v = parseFloat(amount)
    if (isNaN(v) || v < 0 || !monthYear) return
    const [y, m] = monthYear.split('-').map(Number)
    setSaving(true)
    try {
      await onSave(v, m, y)
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-salary" open={open} onClose={handleClose} title="Reajuste Salarial">
      {/* Current salary display */}
      <div style={{
        padding: '14px 16px', marginBottom: 20,
        background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-med)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Salário atual</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--accent-green)', fontSize: 16 }}>
          {fmtBRL(currentSalary)}
        </span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Novo salário base (R$)</label>
        <input
          type="number" step="0.01" inputMode="decimal"
          className="form-control" value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0,00" autoFocus={open}
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Aplicar a partir de</label>
        <input
          type="month" className="form-control"
          value={monthYear} onChange={e => setMonthYear(e.target.value)}
        />
      </div>

      <div style={{
        padding: '10px 12px', marginBottom: 16,
        background: 'var(--accent-amber-dim)',
        border: '1px solid rgba(240,165,0,0.25)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12, color: 'var(--accent-amber)', lineHeight: 1.5,
      }}>
        ⚠️ Este valor será aplicado a partir do mês selecionado e manterá o histórico anterior.
      </div>

      <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
        {saving ? '⏳ Aplicando...' : '🏦 Aplicar Reajuste'}
      </button>
      <button className="btn-cancel" onClick={handleClose}>Cancelar</button>
    </Modal>
  )
}
