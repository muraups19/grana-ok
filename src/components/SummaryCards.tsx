import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { fmtBRL, clamp } from '@/lib/utils'

function AnimatedValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf  = useRef<number>()

  useEffect(() => {
    const start = prev.current
    const end = value
    const duration = 500
    const startTime = performance.now()

    const animate = (now: number) => {
      const t = clamp((now - startTime) / duration, 0, 1)
      const ease = 1 - Math.pow(1 - t, 3)  // easeOutCubic
      setDisplay(start + (end - start) * ease)
      if (t < 1) raf.current = requestAnimationFrame(animate)
      else { setDisplay(end); prev.current = end }
    }
    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value])

  return <>{fmtBRL(display)}</>
}

interface Props {
  monthLabel: string
  salary: number
  expenses: number
  extras: number
}

export default function SummaryCards({ monthLabel, salary, expenses, extras }: Props) {
  const [expanded, setExpanded] = useState(false)
  const totalIncome = salary + extras
  const balance     = totalIncome - expenses
  const pct         = totalIncome > 0 ? clamp((expenses / totalIncome) * 100, 0, 100) : 0

  const fillClass = pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : ''

  return (
    <div style={{ padding: '10px 16px 0' }}>
      {/* Disponível — hero card */}
      <div style={{
        background: 'linear-gradient(155deg, #17171C 0%, #0A0A0D 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 22px 20px',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(17,17,20,0.18)',
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50,
          width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(47,196,130,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-on-dark-muted)', fontWeight: 600 }}>Disponível</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-on-dark-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            background: 'rgba(255,255,255,0.08)', padding: '3px 9px', borderRadius: 99,
          }}>
            {monthLabel}
          </span>
        </div>

        <div className="font-display" style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 14 }}>
          <AnimatedValue value={balance} />
        </div>

        <div className="progress-track">
          <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-on-dark-muted)', fontWeight: 600, marginBottom: 3 }}>Entradas</div>
            <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              <AnimatedValue value={totalIncome} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-on-dark-muted)', fontWeight: 600, marginBottom: 3 }}>Saídas</div>
            <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              <AnimatedValue value={expenses} />
            </div>
          </div>
        </div>
      </div>

      {/* Ver detalhes — floating pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -16, position: 'relative', zIndex: 2 }}>
        <button
          onClick={() => setExpanded(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid var(--border-sub)',
            borderRadius: 99, padding: '9px 18px',
            fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(20,20,27,0.10)',
          }}
        >
          {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: 6 }}>Receitas</div>
            <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-green)' }}>
              <AnimatedValue value={totalIncome} />
            </div>
            {extras > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>+{fmtBRL(extras)} extras</div>}
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: 6 }}>Despesas</div>
            <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-red)' }}>
              <AnimatedValue value={expenses} />
            </div>
            {expenses > 0 && totalIncome > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{Math.round(pct)}% da receita</div>}
          </div>
        </div>
      )}
    </div>
  )
}
