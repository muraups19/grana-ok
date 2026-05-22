import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { AddExpensePayload, ExpenseInputType } from '@/types'
import { fmtBRL } from '@/lib/utils'

const BANKS = ['Nubank', 'Inter', 'Pix', 'Itaú', 'Bradesco', 'C6', 'Santander', 'Caixa', 'BB']

interface Props {
  open: boolean
  onClose: () => void
  onSave: (payload: AddExpensePayload) => Promise<void>
  defaultDate: string
}

export default function ExpenseModal({ open, onClose, onSave, defaultDate }: Props) {
  const [inputType, setInputType] = useState<ExpenseInputType>('total')
  const [desc,  setDesc ] = useState('')
  const [amount, setAmount] = useState('')
  const [qty,   setQty  ] = useState('1')
  const [date,  setDate ] = useState(defaultDate)
  const [bank,  setBank ] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setDate(defaultDate) }, [open, defaultDate])

  const reset = () => {
    setDesc(''); setAmount(''); setQty('1'); setBank(''); setSaving(false)
    setInputType('total')
  }
  const handleClose = () => { reset(); onClose() }

  const perParcel = (() => {
    const v = parseFloat(amount) || 0
    const q = parseInt(qty) || 1
    if (inputType === 'total' && v > 0 && q > 1) return v / q
    return null
  })()

  const handleSubmit = async () => {
    if (!desc.trim() || !amount || !date) return
    const v = parseFloat(amount)
    if (isNaN(v) || v <= 0) return
    setSaving(true)
    try {
      await onSave({ description: desc.trim(), amount: v, qty: parseInt(qty)||1, date, bank: bank.trim(), inputType })
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-expense" open={open} onClose={handleClose} title="Lançar Despesa">
      {/* Tipo */}
      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Tipo de lançamento</label>
        <div className="tipo-pills">
          {([
            ['total',  '📦', 'Total', 'App divide'],
            ['parcela','📋', 'Parcela', 'Valor fixo'],
            ['fixo',   '🔄', 'Fixo', 'Todo mês'],
          ] as [ExpenseInputType, string, string, string][]).map(([t, icon, label, sub]) => (
            <div
              key={t}
              className={`tipo-pill${inputType === t ? ' active' : ''}`}
              onClick={() => setInputType(t)}
            >
              {icon}<br /><span style={{ fontWeight: 700 }}>{label}</span><br />
              <span style={{ fontSize: 10, opacity: 0.7 }}>{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Descrição</label>
        <input
          className="form-control" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Ex: Netflix, Luz, Celular..."
          autoFocus={open}
        />
      </div>

      {/* Valor + Parcelas */}
      <div style={{ display: 'grid', gridTemplateColumns: inputType === 'fixo' ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label className="form-label">
            {inputType === 'total' ? 'Valor total (R$)' : inputType === 'fixo' ? 'Valor mensal (R$)' : 'Valor por parcela (R$)'}
          </label>
          <input
            type="number" step="0.01" inputMode="decimal"
            className="form-control" value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </div>
        {inputType !== 'fixo' && (
          <div>
            <label className="form-label">Qtd. parcelas</label>
            <input
              type="number" min="1" inputMode="numeric"
              className="form-control" value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Preview parcela */}
      {perParcel !== null && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 12px', marginBottom: 14, borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-green-dim)', border: '1px solid rgba(0,214,143,0.2)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Valor por parcela</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--accent-green)', fontSize: 14 }}>
            {fmtBRL(perParcel)} × {qty}
          </span>
        </div>
      )}

      {/* Data + Banco */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div>
          <label className="form-label">Data</label>
          <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Banco / Método</label>
          <input
            className="form-control" list="banks-list" value={bank}
            onChange={e => setBank(e.target.value)} placeholder="Ex: Nubank"
          />
          <datalist id="banks-list">{BANKS.map(b => <option key={b} value={b} />)}</datalist>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
        {saving ? '⏳ Salvando...' : '✅ Salvar Lançamento'}
      </button>
      <button className="btn-cancel" onClick={handleClose}>Cancelar</button>
    </Modal>
  )
}
