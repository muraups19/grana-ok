import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'var(--bg-base)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow effects */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '-10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,214,143,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1, textAlign: 'center' }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ fontSize: 56, marginBottom: 20 }}
        >💰</motion.div>

        <h1 className="font-display" style={{
          fontSize: 34, fontWeight: 800, letterSpacing: '-1px',
          marginBottom: 8, lineHeight: 1,
        }}>
          grana<span style={{ color: 'var(--accent-green)' }}>.</span>ok
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 40, lineHeight: 1.6 }}>
          Suas finanças pessoais,<br />organizadas e no controle.
        </p>

        {/* Features list */}
        {[
          { icon: '📊', label: 'Dashboard com resumo mensal' },
          { icon: '🔄', label: 'Fixos e parcelados automáticos' },
          { icon: '🔒', label: 'Dados 100% privados (Supabase)' },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', marginBottom: 8, textAlign: 'left',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-sub)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{f.label}</span>
          </motion.div>
        ))}

        {/* Google Sign-In */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: '100%', marginTop: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '15px 20px',
            background: '#fff', color: '#1a1a1a',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontFamily: 'Figtree, sans-serif',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.18s', letterSpacing: 0.2,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
          onMouseUp  ={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        >
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
            <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
            <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
            <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
          Entrar com Google
        </motion.button>

        <p style={{ marginTop: 20, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Seus dados são armazenados com segurança no Supabase,<br />
          vinculados exclusivamente à sua conta Google.
        </p>
      </motion.div>
    </div>
  )
}
