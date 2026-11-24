import { useState, useEffect, useMemo } from 'react'
import { Layers, CalendarClock } from 'lucide-react'
import Modal from './Modal'
import type { Transaction, EditPayload, GroupScope, Card } from '@/types'
import { MONTHS_FULL } from '@/lib/utils'
import { autoCategorize, type CategoryHistory } from '@/lib/categories'
import { billingFor, findCard } from '@/lib/billing'
import { Segmented, CategoryPicker, MethodPicker, Callout, parseMoney } from '@/components/ui'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (item: Transaction, payload: EditPayload, scope: GroupScope) => Promise<void>
  item: Transaction | null
  cards: Card[]
  history: CategoryHistory
}

export default function EditModal({ open, onClose, onSave, item, cards, history }: Props) {
  const [desc,   setDesc  ] = useState('')
  const [amount, setAmount] = useState('')
  const [bank,   setBank  ] = useState('')
  const [date,   setDate  ] = useState('')
  const [category, setCategory] = useState('outros')
  const [scope,  setScope ] = useState<GroupScope>('all')
  const [saving, setSaving] = useState(false)

  const kind = item?.type ?? 'expense'
  const isFixo    = !!item && item.installment.toLowerCase() === 'fixo'
  const isParcela = !!item && /^\d+\/\d+$/.test(item.installment)
  const isGroup   = !!item?.group_id && (isFixo || isParcela)

  useEffect(() => {
    if (item && open) {
      setDesc(item.description)
      setAmount(String(item.amount).replace('.', ','))
      setBank(item.bank && item.bank !== '-' ? item.bank : '')
      setDate(item.transaction_date ?? '')
      setCategory(item.category ?? autoCategorize(item.description, item.type, history))
      // Parcelado: por padrão altera todas; Fixo: este mês e os próximos
      setScope(isFixo ? 'future' : 'all')
      setSaving(false)
    }
  }, [item, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const card = findCard(cards, bank)
  const reschedulePreview = useMemo(() => {
    if (!item || kind !== 'expense' || !date || isFixo) return null
    if (isParcela && scope !== 'all') return null
    const changed = date !== (item.transaction_date ?? '') || bank.trim().toLowerCase() !== (item.bank || '').trim().toLowerCase()
    if (!changed) return null
    const b = billingFor(date, card)
    const [cur, tot] = isParcela ? item.installment.split('/').map(Number) : [1, 1]
    // Mês atual da 1ª parcela (ou do lançamento avulso)
    const firstNow = new Date(item.year, item.month - 1 - (cur - 1), 1)
    if (firstNow.getMonth() + 1 === b.month && firstNow.getFullYear() === b.year) return null
    return { ...b, tot }
  }, [item, kind, date, bank, card, isFixo, isParcela, scope])

  const handleClose = () => { setSaving(false); onClose() }

  const v = parseMoney(amount)
  const canSave = !!item && !!desc.trim() && v > 0

  const handleSubmit = async () => {
    if (!item || !canSave) return
    setSaving(true)
    try {
      await onSave(item, {
        description: desc.trim(),
        amount: v,
        ...(kind === 'expense' ? { bank: bank.trim() } : {}),
        transaction_date: date || null,
        category,
      }, isGroup ? scope : 'one')
      handleClose()
    } catch {
      setSaving(false)
    }
  }

  const parcelInfo = isParcela ? item!.installment.split('/').map(Number) : null

  return (
    <Modal id="modal-edit" open={open} onClose={handleClose} title={kind === 'extra' ? 'Editar entrada' : 'Editar despesa'}>
      {isGroup && (
        <div className="field">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={13} /> Aplicar alterações em
          </label>
          <Segmented
            layoutId="edit-scope"
            value={scope}
            onChange={setScope}
            options={isParcela ? [
              { value: 'one',    label: 'Só esta',  sub: `parcela ${item!.installment}` },
              { value: 'future', label: 'Esta e próximas', sub: `${parcelInfo![0]} a ${parcelInfo![1]}` },
              { value: 'all',    label: 'Todas',    sub: `${parcelInfo![1]} parcelas` },
            ] : [
              { value: 'one',    label: 'Só este mês' },
              { value: 'future', label: 'Daqui em diante' },
              { value: 'all',    label: 'Todos os meses' },
            ]}
          />
          <p className="hint">
            {scope === 'one' && 'Somente este registro será alterado.'}
            {scope === 'future' && (isParcela ? 'Esta parcela e as seguintes serão alteradas; as anteriores ficam como estão.' : 'Este mês e os próximos serão alterados (ex.: reajuste de assinatura).')}
            {scope === 'all' && (isParcela ? 'Todas as parcelas do grupo serão alteradas.' : 'Todos os meses desta conta fixa serão alterados.')}
          </p>
        </div>
      )}

      <div className="field">
        <label className="form-label">Descrição</label>
        <input className="form-control" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <CategoryPicker kind={kind} value={category} auto={false} onChange={setCategory} />

      <div className="field-row">
        <div className="field">
          <label className="form-label">{isParcela ? 'Valor da parcela' : isFixo ? 'Valor mensal' : 'Valor'}</label>
          <input type="text" inputMode="decimal" className="form-control num" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label className="form-label">Data</label>
          <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {kind === 'expense' && <MethodPicker cards={cards} value={bank} onChange={setBank} />}

      {reschedulePreview && (
        <Callout tone="warn" icon={<CalendarClock size={16} />}>
          {reschedulePreview.tot > 1
            ? <>As parcelas serão reorganizadas a partir de <strong>{MONTHS_FULL[reschedulePreview.month - 1]}/{reschedulePreview.year}</strong>.</>
            : <>O lançamento será movido para <strong>{MONTHS_FULL[reschedulePreview.month - 1]}/{reschedulePreview.year}</strong>.</>}
        </Callout>
      )}

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !canSave} style={{ marginTop: 6 }}>
        {saving ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </Modal>
  )
}
