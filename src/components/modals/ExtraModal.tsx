import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { AddExtraPayload } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (payload: AddExtraPayload) => Promise<void>
  defaultDate: string
}

export default function ExtraModal({ open, onClose, onSave, defaultDate }: Props) {
  const [desc,  setDesc ] = useState('')
  const [amount, setAmount] = useState('')
  const [date,  setDate ] = useState(defaultDate)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setDate(defaultDate) }, [open, defaultDate])

  const reset = () => { setDesc(''); setAmount(''); setSaving(false) }
  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async () => {
    const v = parseFloat(amount)
    if (!desc.trim() || isNaN(v) || v <= 0 || !date) return
    setSaving(true)
    try {
      await onSave({ description: desc.trim(), amount: v, date })
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-extra" open={open} onClose={handleClose} title="Entrada Extra">
      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Descrição</label>
        <input
          className="form-control" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Ex: Freelance, bônus, venda..." autoFocus={open}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Valor (R$)</label>
        <input
          type="number" step="0.01" inputMode="decimal"
          className="form-control" value={amount}
          onChange={e => setAmount(e.target.value)} placeholder="0,00"
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Data</label>
        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
        {saving ? '⏳ Salvando...' : '💰 Salvar Entrada'}
      </button>
      <button className="btn-cancel" onClick={handleClose}>Cancelar</button>
    </Modal>
  )
}
