import { useEffect, useRef, useState } from 'react'
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
  salary: number
  expenses: number
  extras: number
}

export default function SummaryCards({ salary, expenses, extras }: Props) {
  const totalIncome = salary + extras
  const balance     = totalIncome - expenses
  const pct         = totalIncome > 0 ? clamp((expenses / totalIncome) * 100, 0, 100) : 0

  const fillClass = pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : ''
  const balanceColor = balance < 0 ? 'var(--accent-red)' : 'var(--accent-blue)'

  return (
    <div style={{ padding: '14px 14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {/* Saldo — full width */}
      <div className="glass" style={{
        gridColumn: '1/-1', padding: '18px 20px',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-raised) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 6 }}>
          Saldo do Mês
        </div>
        <div className="font-mono" style={{ fontSize: 26, fontWeight: 700, color: balanceColor, letterSpacing: '-0.5px', marginBottom: 12 }}>
          <AnimatedValue value={balance} />
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
          <span>{Math.round(pct)}% utilizado</span>
          <span style={{ color: 'var(--accent-green)' }}>
            <AnimatedValue value={totalIncome} />
          </span>
        </div>
        <div className="progress-track">
          <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Receitas */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-sub)',
        borderRadius: 'var(--radius-md)', padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 600, marginBottom: 6 }}>
          Receitas
        </div>
        <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-green)' }}>
          <AnimatedValue value={totalIncome} />
        </div>
        {extras > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            +{fmtBRL(extras)} extras
          </div>
        )}
      </div>

      {/* Despesas */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-sub)',
        borderRadius: 'var(--radius-md)', padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 600, marginBottom: 6 }}>
          Despesas
        </div>
        <div className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-red)' }}>
          <AnimatedValue value={expenses} />
        </div>
        {expenses > 0 && totalIncome > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {Math.round(pct)}% da receita
          </div>
        )}
      </div>
    </div>
  )
}
