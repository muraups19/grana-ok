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
    <div style={{
      background: 'linear-gradient(155deg, #17171C 0%, #0A0A0D 100%)',
      borderRadius: 'var(--radius-lg)',
      padding: '22px 22px 20px',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 12px 30px rgba(17,17,20,0.18)',
      marginBottom: 18,
    }}>
      <div style={{
        position: 'absolute', top: -50, right: -50,
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(47,196,130,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 13, color: 'var(--text-on-dark-muted)', fontWeight: 600, marginBottom: 4 }}>
        Patrimônio investido
      </div>

      <div className="font-display" style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 4 }}>
        {fmtBRL(totalCurrent)}
      </div>

      {totalInvested > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700,
          color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
          background: isPositive ? 'rgba(47,196,130,0.14)' : 'rgba(240,71,63,0.14)',
          padding: '3px 9px', borderRadius: 99, marginBottom: 14,
        }}>
          {isPositive ? '+' : ''}{fmtBRL(gain)} ({fmtPct(pct)})
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: totalInvested > 0 ? 2 : 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-on-dark-muted)', fontWeight: 600, marginBottom: 3 }}>Total aportado</div>
          <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {fmtBRL(totalInvested)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-on-dark-muted)', fontWeight: 600, marginBottom: 3 }}>Rendimento</div>
          <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {isPositive ? '+' : ''}{fmtBRL(gain)}
          </div>
        </div>
      </div>
    </div>
  )
}
