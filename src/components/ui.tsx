import { ReactNode, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { categoriesFor, getCategory, type CategoryKind } from '@/lib/categories'
import { DIRECT_METHODS } from '@/lib/billing'
import type { Card } from '@/types'

// ── Segmented control (estilo iOS) ─────────────────────────────
export function Segmented<T extends string>({ value, onChange, options, layoutId }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; sub?: string }[]
  layoutId: string
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map(o => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} type="button">
          {value === o.value && (
            <motion.span layoutId={layoutId} className="seg-thumb" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
          )}
          {o.label}
          {o.sub && <small>{o.sub}</small>}
        </button>
      ))}
    </div>
  )
}

// ── Ícone de categoria ─────────────────────────────────────────
export function CategoryIcon({ id, kind = 'expense', size = 38, radius }: { id: string | null | undefined; kind?: CategoryKind; size?: number; radius?: number }) {
  const c = getCategory(id, kind)
  const Icon = c.icon
  return (
    <div className="row-icon" style={{ background: c.color, width: size, height: size, borderRadius: radius ?? Math.round(size * 0.32) }}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </div>
  )
}

// ── Seletor de categoria com sugestão automática ───────────────
export function CategoryPicker({ kind, value, onChange, auto }: {
  kind: CategoryKind
  value: string
  onChange: (id: string) => void
  /** true quando o valor atual veio da categorização automática */
  auto: boolean
}) {
  const cats = categoriesFor(kind)
  const ref = useRef<HTMLDivElement>(null)
  // Mantém a categoria escolhida visível na faixa rolável
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('.chip.active')
    const box = ref.current
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [value])
  return (
    <div className="field">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Categoria
        {auto && (
          <span className="badge tint"><Sparkles size={11} /> automática</span>
        )}
      </label>
      <div className="chips" ref={ref} style={{ position: 'relative' }}>
        {cats.map(c => {
          const Icon = c.icon
          const active = value === c.id
          return (
            <button type="button" key={c.id} className={`chip${active ? ' active' : ''}`} onClick={() => onChange(c.id)}>
              <span className="chip-icon" style={{ background: c.color }}><Icon size={12} strokeWidth={2.4} /></span>
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Seletor de cartão / método ─────────────────────────────────
export function MethodPicker({ cards, value, onChange, onManageCards }: {
  cards: Card[]
  value: string
  onChange: (v: string) => void
  onManageCards?: () => void
}) {
  const names = [...cards.map(c => c.name), ...DIRECT_METHODS.filter(m => !cards.some(c => c.name.toLowerCase() === m.toLowerCase()))]
  const isCustom = !!value && !names.some(n => n.toLowerCase() === value.toLowerCase())
  const [typing, setTyping] = useState(isCustom)
  useEffect(() => { if (isCustom) setTyping(true) }, [isCustom])

  return (
    <div className="field">
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        Cartão / Método
        {onManageCards && <button type="button" className="link-btn" style={{ fontSize: 13 }} onClick={onManageCards}>Gerenciar cartões</button>}
      </label>
      <div className="chips">
        {cards.map(c => (
          <button type="button" key={c.id} className={`chip${value.toLowerCase() === c.name.toLowerCase() ? ' active' : ''}`}
            onClick={() => { setTyping(false); onChange(c.name) }}>
            <span className="swatch" style={{ background: c.color }} />{c.name}
          </button>
        ))}
        {DIRECT_METHODS.filter(m => !cards.some(c => c.name.toLowerCase() === m.toLowerCase())).map(m => (
          <button type="button" key={m} className={`chip${value.toLowerCase() === m.toLowerCase() ? ' active' : ''}`}
            onClick={() => { setTyping(false); onChange(m) }}>
            {m}
          </button>
        ))}
        <button type="button" className={`chip${typing ? ' active' : ''}`} onClick={() => { setTyping(true); if (!isCustom) onChange('') }}>
          Outro…
        </button>
      </div>
      {typing && (
        <input className="form-control" style={{ marginTop: 6 }} value={value} autoFocus
          onChange={e => onChange(e.target.value)} placeholder="Nome do banco ou método" />
      )}
    </div>
  )
}

export function Callout({ icon, tone, children }: { icon?: ReactNode; tone?: 'tint' | 'warn'; children: ReactNode }) {
  return <div className={`callout${tone ? ' ' + tone : ''}`}>{icon}<div>{children}</div></div>
}

/** Converte "1.234,56" / "1234.56" / "12,5" em número */
export function parseMoney(s: string): number {
  const t = s.trim().replace(/[R$\s]/g, '')
  if (!t) return NaN
  const normalized = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  return parseFloat(normalized)
}
