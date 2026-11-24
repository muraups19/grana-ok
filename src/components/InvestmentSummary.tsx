import { fmtBRL, fmtPct } from '@/lib/utils'

interface Props {
  totalInvested: number
  totalCurrent: number
}

export default function InvestmentSummary({ totalInvested, totalCurrent }: Props) {
  const gain = totalCurrent - totalInvested
  const pct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0
  const isPositive = gain >= 0

  return (
    <section className="hero" style={{ background: 'radial-gradient(120% 140% at 0% 0%, #5E9BFF 0%, #2F5BEA 45%, #1B2F8F 100%)', boxShadow: '0 18px 40px -12px rgba(47,91,234,0.45), inset 0 1px 0 rgba(255,255,255,0.35)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="hero-label">Patrimônio investido</span>
        {totalInvested > 0 && <span className="hero-chip num">{fmtPct(pct)}</span>}
      </div>
      <div className="hero-value num">{fmtBRL(totalCurrent)}</div>
      <div className="hero-glass-row">
        <div className="hero-glass-cell">
          <span>Total aportado</span>
          <strong className="num">{fmtBRL(totalInvested)}</strong>
        </div>
        <div className="hero-glass-cell">
          <span>Rendimento</span>
          <strong className="num">{isPositive ? '+' : ''}{fmtBRL(gain)}</strong>
        </div>
      </div>
    </section>
  )
}
