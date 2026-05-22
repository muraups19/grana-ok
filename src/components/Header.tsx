import { useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { MONTHS, initials } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import Modal from './modals/Modal'

const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Props {
  month: number
  year: number
  onChangeMonth: (delta: number) => void
  onSelectMonth: (m: number, y: number) => void
  onSync: () => void
  syncing: boolean
}

export default function Header({ month, year, onChangeMonth, onSelectMonth, onSync, syncing }: Props) {
  const { profile, signOut } = useAuth()
  const [pickerYear, setPickerYear] = useState(year)
  const [showPicker,  setShowPicker ] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const userInitials = initials(profile?.name ?? profile?.email ?? '?')

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,10,18,0.90)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border-dim)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        {/* Logo */}
        <div className="font-display" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', flexShrink: 0 }}>
          grana<span style={{ color: 'var(--accent-green)' }}>.</span>ok
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Sync button */}
          <button
            onClick={onSync}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg-raised)', border: '1px solid var(--border-med)',
              color: 'var(--text-secondary)', padding: '6px 10px',
              borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: '0.18s', fontFamily: 'Figtree, sans-serif',
            }}
          >
            <RefreshCw size={11} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            Sync
          </button>

          {/* Month nav */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--bg-raised)', border: '1px solid var(--border-med)',
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
          }}>
            <button onClick={() => onChangeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '6px 9px', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => { setPickerYear(year); setShowPicker(true) }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-primary)',
                fontWeight: 800, fontSize: 12, cursor: 'pointer', padding: '6px 2px',
                minWidth: 74, textAlign: 'center', textTransform: 'uppercase',
                letterSpacing: '0.4px', fontFamily: 'Figtree, sans-serif',
              }}
            >
              {MONTHS[month-1]} {year}
            </button>
            <button onClick={() => onChangeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '6px 9px', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Avatar */}
          <button
            onClick={() => setShowProfile(true)}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
              border: '1.5px solid var(--border-med)',
              cursor: 'pointer', flexShrink: 0, fontFamily: 'Syne, sans-serif',
            }}
          >
            {userInitials || '?'}
          </button>
        </div>
      </header>

      {/* Month Picker Modal */}
      <Modal id="modal-month" open={showPicker} onClose={() => setShowPicker(false)} title="Selecionar Mês">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          <button className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={() => setPickerYear(p => p-1)}>‹</button>
          <span className="font-mono" style={{ fontWeight: 700, fontSize: 18 }}>{pickerYear}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={() => setPickerYear(p => p+1)}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
          {MONTHS_FULL.map((name, i) => {
            const active = (i+1 === month && pickerYear === year)
            return (
              <button
                key={name}
                onClick={() => { onSelectMonth(i+1, pickerYear); setShowPicker(false) }}
                style={{
                  padding: '10px 4px', textAlign: 'center',
                  background: active ? 'var(--accent-green-dim)' : 'var(--bg-raised)',
                  border: `1px solid ${active ? 'var(--accent-green)' : 'var(--border-med)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: active ? 'var(--accent-green)' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Figtree, sans-serif',
                }}
              >
                {MONTHS[i]}
              </button>
            )
          })}
        </div>
        <button className="btn-cancel" onClick={() => setShowPicker(false)}>Cancelar</button>
      </Modal>

      {/* Profile Modal */}
      <Modal id="modal-profile" open={showProfile} onClose={() => setShowProfile(false)} title="Minha Conta">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px', marginBottom: 16,
          background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-med)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif',
          }}>
            {userInitials || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>
              {profile?.name || profile?.email || '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{profile?.email || '—'}</div>
          </div>
        </div>

        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginBottom: 10, justifyContent: 'space-between' }}
          onClick={() => {
            signOut()
            setShowProfile(false)
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogOut size={14} /> Sair da conta
          </span>
          <ChevronRight size={14} />
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          Dados armazenados exclusivamente no Supabase,<br />vinculados à sua conta Google.
        </p>
        <button className="btn-cancel" onClick={() => setShowProfile(false)}>Fechar</button>
      </Modal>
    </>
  )
}
