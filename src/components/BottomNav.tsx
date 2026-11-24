import { motion } from 'framer-motion'
import { Home, Receipt, Wallet, Settings, TrendingUp, Plus, LogOut } from 'lucide-react'

export type NavTab = 'home' | 'expenses' | 'investments' | 'extras' | 'config'

export const NAV_ITEMS: { key: NavTab; label: string; title: string; icon: typeof Home }[] = [
  { key: 'home',        label: 'Resumo',    title: 'Resumo',        icon: Home },
  { key: 'expenses',    label: 'Contas',    title: 'Contas',        icon: Receipt },
  { key: 'extras',      label: 'Entradas',  title: 'Entradas',      icon: Wallet },
  { key: 'investments', label: 'Investir',  title: 'Investimentos', icon: TrendingUp },
  { key: 'config',      label: 'Ajustes',   title: 'Ajustes',       icon: Settings },
]

interface Props {
  active: NavTab
  onChange: (tab: NavTab) => void
}

/** Tab bar flutuante em vidro (iPhone em pé) */
export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="tabbar glass" aria-label="Navegação">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
        <button key={key} className={`tab-item${active === key ? ' active' : ''}`} onClick={() => onChange(key)} aria-current={active === key ? 'page' : undefined}>
          {active === key && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
          <Icon size={22} strokeWidth={active === key ? 2.3 : 1.9} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Barra lateral (iPad, desktop e celular na horizontal) */
export function Sidebar({ active, onChange, onAdd, onSignOut }: Props & { onAdd: () => void; onSignOut: () => void }) {
  return (
    <aside className="sidebar glass" aria-label="Navegação">
      <div className="sidebar-brand">
        <img src="/GranaOk.png" alt="" />
        <span>grana<span style={{ color: 'var(--tint)' }}>.</span>ok</span>
      </div>
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
        <button key={key} className={`side-item${active === key ? ' active' : ''}`} onClick={() => onChange(key)} title={label} aria-current={active === key ? 'page' : undefined}>
          {active === key && <motion.span layoutId="side-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
          <Icon size={21} strokeWidth={active === key ? 2.3 : 1.9} />
          <span>{label}</span>
        </button>
      ))}
      <div className="side-cta">
        <button className="btn btn-primary" onClick={onAdd} title="Nova despesa" style={{ minHeight: 44, fontSize: 15 }}>
          <Plus size={19} strokeWidth={2.5} /><span>Nova despesa</span>
        </button>
      </div>
      <div className="sidebar-foot">
        <button className="side-item" onClick={onSignOut} title="Sair" style={{ color: 'var(--red)' }}>
          <LogOut size={20} /><span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
