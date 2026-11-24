import { useState } from 'react'
import { ChevronLeft, CreditCard, Plus, Trash2, CalendarClock, AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import type { Card, CardPayload } from '@/types'
import { CARD_PRESETS, CARD_COLORS, billingFor } from '@/lib/billing'
import { MONTHS_FULL, dateToISO } from '@/lib/utils'
import { Callout } from '@/components/ui'

interface Props {
  open: boolean
  onClose: () => void
  cards: Card[]
  /** false quando a migração 003 ainda não foi executada */
  available: boolean
  onSave: (payload: CardPayload, id?: string) => Promise<void>
  onDelete: (card: Card) => Promise<void>
}

const EMPTY: CardPayload = { name: '', closing_day: null, due_day: null, color: CARD_COLORS[0] }

export default function CardsModal({ open, onClose, cards, available, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<{ id?: string; data: CardPayload } | null>(null)
  const [saving, setSaving] = useState(false)

  const close = () => { setEditing(null); onClose() }

  const startNew = () => setEditing({ data: { ...EMPTY } })
  const startEdit = (c: Card) => setEditing({ id: c.id, data: { name: c.name, closing_day: c.closing_day, due_day: c.due_day, color: c.color } })

  const set = (patch: Partial<CardPayload>) => setEditing(e => e && { ...e, data: { ...e.data, ...patch } })

  const save = async () => {
    if (!editing || !editing.data.name.trim()) return
    setSaving(true)
    try {
      await onSave({ ...editing.data, name: editing.data.name.trim() }, editing.id)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const d = editing?.data
  const today = dateToISO(new Date())
  const example = d?.closing_day ? billingFor(today, d) : null

  return (
    <Modal id="modal-cards" open={open} onClose={close} title={editing ? (editing.id ? 'Editar cartão' : 'Novo cartão') : 'Meus cartões'}>
      {!available && (
        <Callout tone="warn" icon={<AlertTriangle size={16} />}>
          Para cadastrar cartões, execute <strong>supabase/migrations/003_cards_categories.sql</strong> no SQL Editor do Supabase.
        </Callout>
      )}

      {!editing && (
        <>
          <p className="hint" style={{ margin: '0 4px 14px', fontSize: 14 }}>
            Informe o dia de <strong>fechamento</strong> de cada cartão. Assim, cada compra cai automaticamente no mês em que você realmente vai pagar.
          </p>
          {cards.length > 0 && (
            <div className="list" style={{ marginBottom: 14 }}>
              {cards.map(c => (
                <button key={c.id} className="row" onClick={() => startEdit(c)}>
                  <div className="row-icon" style={{ background: c.color }}><CreditCard size={19} /></div>
                  <div className="row-body">
                    <div className="row-title">{c.name}</div>
                    <div className="row-sub">
                      {c.closing_day
                        ? <>Fecha dia {c.closing_day}{c.due_day ? <> · vence dia {c.due_day}</> : null}</>
                        : 'Sem fatura (débito / pix)'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-primary" onClick={startNew} disabled={!available}><Plus size={18} /> Adicionar cartão</button>
        </>
      )}

      {editing && d && (
        <>
          <div className="field">
            <label className="form-label">Banco / Cartão</label>
            <input className="form-control" value={d.name} onChange={e => set({ name: e.target.value })} placeholder="Ex: Nubank" autoFocus />
            <div className="chips" style={{ marginTop: 8 }}>
              {CARD_PRESETS.map(p => (
                <button key={p.name} type="button" className={`chip${d.name === p.name ? ' active' : ''}`} onClick={() => set({ name: p.name, color: p.color })}>
                  <span className="swatch" style={{ background: p.color }} />{p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="form-label">Dia do fechamento</label>
              <input type="number" min={1} max={31} inputMode="numeric" className="form-control num"
                value={d.closing_day ?? ''} placeholder="Ex: 18"
                onChange={e => set({ closing_day: e.target.value ? clampDay(+e.target.value) : null })} />
            </div>
            <div className="field">
              <label className="form-label">Dia do vencimento</label>
              <input type="number" min={1} max={31} inputMode="numeric" className="form-control num"
                value={d.due_day ?? ''} placeholder="Ex: 25"
                onChange={e => set({ due_day: e.target.value ? clampDay(+e.target.value) : null })} />
            </div>
          </div>
          <p className="hint" style={{ marginTop: -6, marginBottom: 14 }}>Deixe o fechamento em branco para contas de débito / pix.</p>

          <div className="field">
            <label className="form-label">Cor</label>
            <div className="chips wrap">
              {CARD_COLORS.map(c => (
                <button key={c} type="button" aria-label={`Cor ${c}`} onClick={() => set({ color: c })}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: d.color === c ? '3px solid var(--bg-solid)' : 'none',
                    boxShadow: d.color === c ? `0 0 0 2px ${c}` : 'none' }} />
              ))}
            </div>
          </div>

          {example && (
            <Callout tone="tint" icon={<CalendarClock size={16} />}>
              Uma compra feita hoje entra na fatura de <strong>{MONTHS_FULL[example.month - 1]}/{example.year}</strong>.
            </Callout>
          )}

          <button className="btn btn-primary" onClick={save} disabled={saving || !d.name.trim()}>
            {saving ? 'Salvando…' : 'Salvar cartão'}
          </button>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}><ChevronLeft size={17} /> Voltar</button>
            {editing.id && (
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={async () => {
                const c = cards.find(x => x.id === editing.id)
                if (c) { await onDelete(c); setEditing(null) }
              }}><Trash2 size={16} /> Excluir</button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

function clampDay(n: number) { return Math.min(31, Math.max(1, Math.round(n) || 1)) }
