import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LoginPage    from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'

// ── Auth Guard ───────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, background: 'var(--bg-base)',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid var(--border-sub)',
          borderTopColor: 'var(--accent-green)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Figtree, sans-serif' }}>
          Carregando...
        </span>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/" replace />
}

// ── Root redirect ────────────────────────────────────────────
function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? '/dashboard' : '/'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
