import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { Transaction, EditPayload } from '@/types'
import { brToISO } from '@/lib/utils'

const BANKS = ['Nubank', 'Inter', 'Pix', 'Itaú', 'Bradesco', 'C6', 'Santander', 'Caixa', 'BB']

interface Props {
  open: boolean
  onClose: () => void
  onSave: (id: string, payload: EditPayload) => Promise<void>
  item: Transaction | null
}

export default function EditModal({ open, onClose, onSave, item }: Props) {
  const [desc,  setDesc ] = useState('')
  const [amount, setAmount] = useState('')
  const [bank,  setBank ] = useState('')
  const [date,  setDate ] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item && open) {
      setDesc(item.description)
      setAmount(String(item.amount))
      setBank(item.bank || '')
      setDate(item.transaction_date ?? brToISO(item.transaction_date ?? '') ?? '')
    }
  }, [item, open])

  const isSpecial = item
    ? (item.installment.toLowerCase() === 'fixo' || /^\d+\/\d+$/.test(item.installment))
    : false

  const handleClose = () => { setSaving(false); onClose() }

  const handleSubmit = async () => {
    if (!item || !desc.trim()) return
    const v = parseFloat(amount)
    if (isNaN(v) || v <= 0) return
    setSaving(true)
    try {
      await onSave(item.id, {
        description: desc.trim(),
        amount: v,
        bank: bank.trim(),
        transaction_date: date || null,
      })
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-edit" open={open} onClose={handleClose} title="Editar Lançamento">
      {isSpecial && (
        <div style={{
          padding: '9px 12px', marginBottom: 16,
          background: 'var(--accent-amber-dim)',
          border: '1px solid rgba(240,165,0,0.25)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--accent-amber)',
        }}>
          ⚠️ Edição altera apenas este registro — os demais meses não serão alterados.
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Descrição</label>
        <input className="form-control" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label className="form-label">Valor (R$)</label>
          <input
            type="number" step="0.01" inputMode="decimal"
            className="form-control" value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Banco / Método</label>
          <input
            className="form-control" list="banks-edit" value={bank}
            onChange={e => setBank(e.target.value)}
          />
          <datalist id="banks-edit">{BANKS.map(b => <option key={b} value={b} />)}</datalist>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Data</label>
        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
        {saving ? '⏳ Salvando...' : '✅ Salvar Alterações'}
      </button>
      <button className="btn-cancel" onClick={handleClose}>Cancelar</button>
    </Modal>
  )
}
