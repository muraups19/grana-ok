import { useEffect } from 'react'

export interface SheetAction {
  label: string
  destructive?: boolean
  onClick: () => void
}

export interface ActionSheetState {
  title: string
  message?: string
  actions: SheetAction[]
}

export default function ActionSheet({ sheet, onClose }: { sheet: ActionSheetState | null; onClose: () => void }) {
  useEffect(() => {
    if (!sheet) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [sheet, onClose])

  if (!sheet) return null
  return (
    <div className="modal-overlay action-sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="action-sheet" role="alertdialog" aria-label={sheet.title}>
        <div className="action-group glass">
          <div className="action-head"><strong>{sheet.title}</strong>{sheet.message}</div>
          {sheet.actions.map(a => (
            <button key={a.label} className={`action-btn${a.destructive ? ' destructive' : ''}`}
              onClick={() => { onClose(); a.onClick() }}>{a.label}</button>
          ))}
        </div>
        <div className="action-group glass">
          <button className="action-btn bold" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
