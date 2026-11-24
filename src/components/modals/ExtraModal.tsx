import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { AddExtraPayload } from '@/types'
import { autoCategorize, type CategoryHistory } from '@/lib/categories'
import { CategoryPicker, parseMoney } from '@/components/ui'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (payload: AddExtraPayload) => Promise<void>
  defaultDate: string
  history: CategoryHistory
}

export default function ExtraModal({ open, onClose, onSave, defaultDate, history }: Props) {
  const [desc,   setDesc  ] = useState('')
  const [amount, setAmount] = useState('')
  const [date,   setDate  ] = useState(defaultDate)
  const [category, setCategory] = useState('outros_in')
  const [manualCat, setManualCat] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setDate(defaultDate) }, [open, defaultDate])
  useEffect(() => {
    if (!manualCat) setCategory(autoCategorize(desc, 'extra', history))
  }, [desc, manualCat, history])

  const reset = () => { setDesc(''); setAmount(''); setSaving(false); setManualCat(false); setCategory('outros_in') }
  const handleClose = () => { reset(); onClose() }

  const v = parseMoney(amount)
  const canSave = !!desc.trim() && v > 0 && !!date

  const handleSubmit = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ description: desc.trim(), amount: v, date, category })
      handleClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-extra" open={open} onClose={handleClose} title="Nova entrada">
      <div className="field">
        <label className="form-label">Descrição</label>
        <input className="form-control" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Ex: Freelance, bônus, venda…" autoFocus />
      </div>

      <CategoryPicker kind="extra" value={category} auto={!manualCat && !!desc.trim()}
        onChange={id => { setCategory(id); setManualCat(true) }} />

      <div className="field-row">
        <div className="field">
          <label className="form-label">Valor</label>
          <input type="text" inputMode="decimal" className="form-control num" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="R$ 0,00" />
        </div>
        <div className="field">
          <label className="form-label">Data</label>
          <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <button className="btn btn-success" onClick={handleSubmit} disabled={saving || !canSave} style={{ marginTop: 6 }}>
        {saving ? 'Salvando…' : 'Salvar entrada'}
      </button>
    </Modal>
  )
}
