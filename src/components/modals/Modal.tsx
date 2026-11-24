import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  id: string
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

let openCount = 0

export default function Modal({ id, open, onClose, title, children, wide }: ModalProps) {
  // Fecha com Esc
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Trava o scroll do body enquanto houver modal aberto (suporta modais empilhados)
  useEffect(() => {
    if (!open) return
    openCount++
    document.body.style.overflow = 'hidden'
    return () => {
      openCount = Math.max(0, openCount - 1)
      if (openCount === 0) document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      id={id}
      className="modal-overlay"
      onClick={e => { if ((e.target as HTMLElement).id === id) onClose() }}
    >
      <div className={`modal-sheet${wide ? ' wide' : ''}`} role="dialog" aria-modal aria-label={title}>
        <div className="modal-handle" />
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={17} strokeWidth={2.5} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
