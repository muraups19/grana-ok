import { ReactNode, useEffect } from 'react'

interface ModalProps {
  id: string
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({ id, open, onClose, title, children }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      id={id}
      className="modal-overlay open"
      onClick={e => { if ((e.target as HTMLElement).id === id) onClose() }}
    >
      <div className="modal-sheet" role="dialog" aria-modal aria-label={title}>
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  )
}
