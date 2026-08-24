import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { Investment, InvestmentType, AddInvestmentPayload, EditInvestmentPayload } from '@/types'
import { INVESTMENT_TYPES } from '@/lib/utils'

const BROKERS = ['XP Investimentos', 'Nubank', 'Inter', 'Rico', 'Clear', 'BTG Pactual', 'C6 Bank', 'Itaú', 'Binance', 'Mercado Bitcoin']

interface Props {
  open: boolean
  onClose: () => void
  onSave: (payload: AddInvestmentPayload) => Promise<void>
  onSaveEdit?: (id: string, payload: EditInvestmentPayload) => Promise<void>
  defaultDate: string
  item?: Investment | null
}

export default function InvestmentModal({ open, onClose, onSave, onSaveEdit, defaultDate, item }: Props) {
  const isEdit = !!item

  const [name,     setName    ] = useState('')
  const [type,     setType    ] = useState<InvestmentType>('renda_fixa')
  const [broker,   setBroker  ] = useState('')
  const [invested, setInvested] = useState('')
  const [current,  setCurrent ] = useState('')
  const [date,     setDate    ] = useState(defaultDate)
  const [notes,    setNotes   ] = useState('')
  const [saving,   setSaving  ] = useState(false)

  useEffect(() => {
    if (!open) return
    if (item) {
      setName(item.name)
      setType(item.type)
      setBroker(item.broker || '')
      setInvested(String(item.amount_invested))
      setCurrent(String(item.current_value))
      setDate(item.invested_at || defaultDate)
      setNotes(item.notes || '')
    } else {
      setName(''); setType('renda_fixa'); setBroker('')
      setInvested(''); setCurrent(''); setDate(defaultDate); setNotes('')
    }
  }, [open, item, defaultDate])

  const reset = () => { setSaving(false) }
  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async () => {
    const vInvested = parseFloat(invested)
    const vCurrent = current.trim() === '' ? vInvested : parseFloat(current)
    if (!name.trim() || isNaN(vInvested) || vInvested <= 0 || isNaN(vCurrent) || vCurrent < 0 || !date) return

    setSaving(true)
    try {
      if (isEdit && item && onSaveEdit) {
        await onSaveEdit(item.id, {
          name: name.trim(),
          type,
          broker: broker.trim(),
          amount_invested: vInvested,
          current_value: vCurrent,
          invested_at: date,
          notes: notes.trim() || null,
        })
      } else {
        await onSave({
          name: name.trim(),
          type,
          broker: broker.trim(),
          amount_invested: vInvested,
          current_value: vCurrent,
          invested_at: date,
          notes: notes.trim(),
        })
      }
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-investment" open={open} onClose={handleClose} title={isEdit ? 'Editar Investimento' : 'Novo Investimento'}>
      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Nome do investimento</label>
        <input
          className="form-control" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ex: Tesouro Selic 2029, PETR4..." autoFocus={open}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Tipo</label>
        <select className="form-control" value={type} onChange={e => setType(e.target.value as InvestmentType)}>
          {INVESTMENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label className="form-label">Valor investido (R$)</label>
          <input
            type="text" step="0.01" inputMode="decimal"
            className="form-control" value={invested}
            onChange={e => setInvested(e.target.value)} placeholder="0,00"
          />
        </div>
        <div>
          <label className="form-label">Valor atual (R$)</label>
          <input
            type="text" step="0.01" inputMode="decimal"
            className="form-control" value={current}
            onChange={e => setCurrent(e.target.value)}
            placeholder={invested || '0,00'}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label className="form-label">Data do aporte</label>
          <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Corretora / Banco</label>
          <input
            className="form-control" list="brokers-list" value={broker}
            onChange={e => setBroker(e.target.value)} placeholder="Ex: XP"
          />
          <datalist id="brokers-list">{BROKERS.map(b => <option key={b} value={b} />)}</datalist>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Observações <span style={{ textTransform: 'none', fontWeight: 400 }}>(opcional)</span></label>
        <input
          className="form-control" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Ex: Reserva de emergência"
        />
      </div>

      <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
        {saving ? '⏳ Salvando...' : isEdit ? '✅ Salvar Alterações' : '📈 Salvar Investimento'}
      </button>
      <button className="btn-cancel" onClick={handleClose}>Cancelar</button>
    </Modal>
  )
}
