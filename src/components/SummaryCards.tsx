import { useEffect, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Layers, Repeat } from 'lucide-react'
import { fmtBRL, clamp } from '@/lib/utils'

export function AnimatedValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf  = useRef<number>()

  useEffect(() => {
    const start = prev.current
    const end = value
    const duration = 550
    const startTime = performance.now()
    const animate = (now: number) => {
      const t = clamp((now - startTime) / duration, 0, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplay(start + (end - start) * ease)
      if (t < 1) raf.current = requestAnimationFrame(animate)
      else { setDisplay(end); prev.current = end }
    }
    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current); prev.current = end }
  }, [value])

  return <>{fmtBRL(display)}</>
}

interface Props {
  monthLabel: string
  salary: number
  expenses: number
  extras: number
  fixed: number
  installments: number
}

export default function SummaryCards({ monthLabel, salary, expenses, extras, fixed, installments }: Props) {
  const totalIncome = salary + extras
  const balance     = totalIncome - expenses
  const pct         = totalIncome > 0 ? clamp((expenses / totalIncome) * 100, 0, 100) : (expenses > 0 ? 100 : 0)
  const fillClass   = pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : ''

  return (
    <div className="stack">
      <section className="hero" aria-label="Saldo do mês">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="hero-label">Disponível em {monthLabel}</span>
          <span className="hero-chip num">{Math.round(pct)}% usado</span>
        </div>
        <div className="hero-value num"><AnimatedValue value={balance} /></div>
        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="hero-glass-row">
          <div className="hero-glass-cell">
            <span>Entradas</span>
            <strong className="num"><AnimatedValue value={totalIncome} /></strong>
          </div>
          <div className="hero-glass-cell">
            <span>Saídas</span>
            <strong className="num"><AnimatedValue value={expenses} /></strong>
          </div>
        </div>
      </section>

      <div className="stats four">
        <div className="stat card">
          <div className="stat-label"><ArrowDownLeft size={15} color="var(--green)" /> Salário</div>
          <div className="stat-value num">{fmtBRL(salary)}</div>
        </div>
        <div className="stat card">
          <div className="stat-label"><ArrowUpRight size={15} color="var(--green)" /> Extras</div>
          <div className="stat-value num">{fmtBRL(extras)}</div>
        </div>
        <div className="stat card">
          <div className="stat-label"><Repeat size={15} color="var(--purple)" /> Contas fixas</div>
          <div className="stat-value num">{fmtBRL(fixed)}</div>
          {totalIncome > 0 && <div className="stat-sub">{Math.round((fixed / totalIncome) * 100)}% da renda</div>}
        </div>
        <div className="stat card">
          <div className="stat-label"><Layers size={15} color="var(--orange)" /> Parcelas</div>
          <div className="stat-value num">{fmtBRL(installments)}</div>
          {totalIncome > 0 && <div className="stat-sub">{Math.round((installments / totalIncome) * 100)}% da renda</div>}
        </div>
      </div>
    </div>
  )
}
