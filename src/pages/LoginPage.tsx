import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarClock, Layers, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const FEATURES = [
  { icon: Layers,        color: '#FF9500', label: 'Fixas e parcelas automáticas', sub: 'Edite uma parcela e atualize todas' },
  { icon: CalendarClock, color: '#007AFF', label: 'Fechamento de fatura',         sub: 'Cada compra no mês em que você paga' },
  { icon: Sparkles,      color: '#AF52DE', label: 'Categorias automáticas',       sub: 'Aprende com os seus lançamentos' },
  { icon: ShieldCheck,   color: '#34C759', label: 'Dados privados',               sub: 'Protegidos por conta Google' },
]

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'calc(24px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom))',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="glass login-card"
      >
        <div className="login-brand">
          <img src="/GranaOk.png" alt="" style={{ width: 72, height: 72, borderRadius: 20, boxShadow: '0 10px 30px rgba(31,184,106,0.35)' }} />
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', margin: '18px 0 6px', lineHeight: 1 }}>
            grana<span style={{ color: 'var(--tint)' }}>.</span>ok
          </h1>
          <p style={{ color: 'var(--label-2)', fontSize: 17, lineHeight: 1.45 }}>
            Suas finanças pessoais,<br />organizadas e no controle.
          </p>
        </div>

        <div>
          <div className="list" style={{ marginBottom: 22 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.label} className="row" style={{ cursor: 'default' }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                <div className="row-icon" style={{ background: f.color, width: 34, height: 34, borderRadius: 10 }}><f.icon size={18} /></div>
                <div className="row-body">
                  <div className="row-title" style={{ fontSize: 15 }}>{f.label}</div>
                  <div className="row-sub">{f.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="btn"
            style={{
              width: '100%', minHeight: 52, background: 'var(--label)', color: 'var(--bg-solid)', fontSize: 17,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
              <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
              <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
              <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Entrar com Google
          </button>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--label-2)', lineHeight: 1.5, textAlign: 'center' }}>
            Seus dados ficam no Supabase, vinculados exclusivamente à sua conta Google.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
