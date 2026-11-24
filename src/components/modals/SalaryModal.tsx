import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import Modal from './Modal'
import { fmtBRL } from '@/lib/utils'
import { Callout, parseMoney } from '@/components/ui'

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

  useEffect(() => { if (open) setMonthYear(`${currentYear}-${pad(currentMonth)}`) }, [open, currentMonth, currentYear])

  const handleClose = () => { setAmount(''); setSaving(false); onClose() }

  const v = parseMoney(amount)
  const handleSubmit = async () => {
    if (isNaN(v) || v < 0 || !monthYear) return
    const [y, m] = monthYear.split('-').map(Number)
    setSaving(true)
    try {
      await onSave(v, m, y)
      handleClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-salary" open={open} onClose={handleClose} title="Salário base">
      <div className="list" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--label-2)', fontSize: 15 }}>Salário atual</span>
        <strong className="num" style={{ fontSize: 18, color: 'var(--green)' }}>{fmtBRL(currentSalary)}</strong>
      </div>

      <div className="field-row">
        <div className="field">
          <label className="form-label">Novo salário</label>
          <input type="text" inputMode="decimal" className="form-control num" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="R$ 0,00" autoFocus />
        </div>
        <div className="field">
          <label className="form-label">A partir de</label>
          <input type="month" className="form-control" value={monthYear} onChange={e => setMonthYear(e.target.value)} />
        </div>
      </div>

      <Callout icon={<Info size={16} />}>
        O valor vale a partir do mês escolhido. Os meses anteriores mantêm o histórico.
      </Callout>

      <button className="btn btn-success" onClick={handleSubmit} disabled={saving || isNaN(v)}>
        {saving ? 'Aplicando…' : 'Aplicar reajuste'}
      </button>
    </Modal>
  )
}
