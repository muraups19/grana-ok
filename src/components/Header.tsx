import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Plus, RefreshCw } from 'lucide-react'
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
  onAdd: () => void
  syncing: boolean
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Header({ month, year, onSelectMonth, onSync, onAdd, syncing }: Props) {
  const { profile, signOut } = useAuth()
  const [pickerYear, setPickerYear] = useState(year)
  const [showPicker,  setShowPicker ] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const userInitials = initials(profile?.name ?? profile?.email ?? '?')
  const firstName = (profile?.name ?? profile?.email ?? '').split(' ')[0] || 'Você'

  return (
    <>
      <header style={{
        padding: '20px 18px 6px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
      }}>
        {/* Greeting */}
        <button
          onClick={() => setShowProfile(true)}
          style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>
            {greeting()}
          </div>
          <div className="font-display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.7px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {firstName}
          </div>
        </button>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          <button
            onClick={onSync}
            title="Sincronizar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--bg-raised)', border: '1px solid var(--border-med)',
              color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          <button
            onClick={() => { setPickerYear(year); setShowPicker(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--bg-raised)', border: '1px solid var(--border-med)',
              borderRadius: 99, padding: '8px 12px 8px 14px',
              color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.3px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {MONTHS[month-1]}
            <ChevronDown size={14} />
          </button>

          <button
            onClick={onAdd}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--bg-dark)', border: 'none',
              color: '#fff', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Plus size={17} />
          </button>
        </div>
      </header>

      {/* Month Picker Modal */}
      <Modal id="modal-month" open={showPicker} onClose={() => setShowPicker(false)} title="Selecionar mês">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          <button className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={() => setPickerYear(p => p-1)}><ChevronLeft size={14} /></button>
          <span className="font-display" style={{ fontWeight: 800, fontSize: 18 }}>{pickerYear}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={() => setPickerYear(p => p+1)}><ChevronRight size={14} /></button>
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
                  background: active ? 'var(--bg-dark)' : 'var(--bg-raised)',
                  border: `1px solid ${active ? 'var(--bg-dark)' : 'var(--border-med)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
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
      <Modal id="modal-profile" open={showProfile} onClose={() => setShowProfile(false)} title="Minha conta">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px', marginBottom: 16,
          background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-med)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif',
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
