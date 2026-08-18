import { Home, Receipt, PiggyBank, Settings, TrendingUp } from 'lucide-react'

export type NavTab = 'home' | 'expenses' | 'investments' | 'extras' | 'config'

interface Props {
  active: NavTab
  onChange: (tab: NavTab) => void
}

const items: { key: NavTab; label: string; icon: typeof Home }[] = [
  { key: 'expenses',    label: 'Contas',       icon: Receipt },
  { key: 'home',        label: 'Home',         icon: Home },
  { key: 'investments', label: 'Investir',     icon: TrendingUp },
  { key: 'extras',      label: 'Análise',      icon: PiggyBank },
  { key: 'config',      label: 'Config',       icon: Settings },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={`bottom-nav-item${active === key ? ' active' : ''}`}
          onClick={() => onChange(key)}
        >
          <Icon size={19} strokeWidth={active === key ? 2.4 : 2} />
          {label}
        </button>
      ))}
    </nav>
  )
}
