import { useState, useEffect, useMemo } from 'react'
import { CalendarClock } from 'lucide-react'
import Modal from './Modal'
import type { AddExpensePayload, ExpenseInputType, Card } from '@/types'
import { fmtBRL, MONTHS_FULL, dayMonth } from '@/lib/utils'
import { autoCategorize, type CategoryHistory } from '@/lib/categories'
import { billingFor, findCard } from '@/lib/billing'
import { Segmented, CategoryPicker, MethodPicker, Callout, parseMoney } from '@/components/ui'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (payload: AddExpensePayload) => Promise<void>
  defaultDate: string
  cards: Card[]
  history: CategoryHistory
  onManageCards: () => void
}

export default function ExpenseModal({ open, onClose, onSave, defaultDate, cards, history, onManageCards }: Props) {
  const [inputType, setInputType] = useState<ExpenseInputType>('total')
  const [desc,   setDesc  ] = useState('')
  const [amount, setAmount] = useState('')
  const [qty,    setQty   ] = useState('1')
  const [date,   setDate  ] = useState(defaultDate)
  const [bank,   setBank  ] = useState('')
  const [category, setCategory] = useState('outros')
  const [manualCat, setManualCat] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setDate(defaultDate) }, [open, defaultDate])

  // Categorização automática enquanto digita (até o usuário escolher manualmente)
  useEffect(() => {
    if (!manualCat) setCategory(autoCategorize(desc, 'expense', history))
  }, [desc, manualCat, history])

  const reset = () => {
    setDesc(''); setAmount(''); setQty('1'); setBank(''); setSaving(false)
    setInputType('total'); setCategory('outros'); setManualCat(false)
  }
  const handleClose = () => { reset(); onClose() }

  const v = parseMoney(amount)
  const q = Math.max(1, parseInt(qty) || 1)
  const perParcel = inputType === 'total' && v > 0 && q > 1 ? v / q : null

  const card = findCard(cards, bank)
  const billing = useMemo(() => (date ? billingFor(date, card) : null), [date, card])
  const [dy, dm] = date ? date.split('-').map(Number) : [0, 0]
  const shifted = billing && (billing.month !== dm || billing.year !== dy)

  const canSave = !!desc.trim() && v > 0 && !!date

  const handleSubmit = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ description: desc.trim(), amount: v, qty: inputType === 'fixo' ? 1 : q, date, bank: bank.trim(), inputType, category })
      handleClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <Modal id="modal-expense" open={open} onClose={handleClose} title="Nova despesa">
      <div className="field">
        <Segmented
          layoutId="exp-type"
          value={inputType}
          onChange={setInputType}
          options={[
            { value: 'total',   label: 'Valor total', sub: 'App divide' },
            { value: 'parcela', label: 'Por parcela', sub: 'Valor fixo' },
            { value: 'fixo',    label: 'Fixa',        sub: 'Todo mês' },
          ]}
        />
      </div>

      <div className="field">
        <label className="form-label">Descrição</label>
        <input
          className="form-control" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Ex: Netflix, iFood, Mercado…" autoFocus enterKeyHint="next"
        />
      </div>

      <CategoryPicker kind="expense" value={category} auto={!manualCat && !!desc.trim()}
        onChange={id => { setCategory(id); setManualCat(true) }} />

      <div className="field-row" style={inputType === 'fixo' ? { gridTemplateColumns: '1fr' } : undefined}>
        <div className="field">
          <label className="form-label">
            {inputType === 'total' ? 'Valor total' : inputType === 'fixo' ? 'Valor mensal' : 'Valor da parcela'}
          </label>
          <input
            type="text" inputMode="decimal" className="form-control num" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="R$ 0,00"
          />
        </div>
        {inputType !== 'fixo' && (
          <div className="field">
            <label className="form-label">Parcelas</label>
            <input type="number" min="1" max="72" inputMode="numeric" className="form-control num" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
        )}
      </div>

      {perParcel !== null && (
        <Callout tone="tint">
          <strong className="num">{q}× de {fmtBRL(perParcel)}</strong>
        </Callout>
      )}

      <MethodPicker cards={cards} value={bank} onChange={setBank} onManageCards={onManageCards} />

      <div className="field">
        <label className="form-label">Data da compra</label>
        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {billing && card?.closing_day && (
        <Callout tone={shifted ? 'warn' : 'tint'} icon={<CalendarClock size={16} />}>
          Entra na fatura de <strong>{MONTHS_FULL[billing.month - 1]}/{billing.year}</strong>
          {billing.closing && <> · fecha {dayMonth(billing.closing)}</>}
          {billing.due && <> · vence {dayMonth(billing.due)}</>}
          {inputType !== 'fixo' && q > 1 && <> · última parcela em {lastParcel(billing.month, billing.year, q)}</>}
        </Callout>
      )}

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !canSave} style={{ marginTop: 6 }}>
        {saving ? 'Salvando…' : 'Salvar despesa'}
      </button>
    </Modal>
  )
}

function lastParcel(month: number, year: number, q: number) {
  const d = new Date(year, month - 1 + q - 1, 1)
  return `${MONTHS_FULL[d.getMonth()].slice(0, 3).toLowerCase()}/${d.getFullYear()}`
}
