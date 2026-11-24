import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      gutter={8}
      toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--glass-strong)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          color: 'var(--label)',
          border: '0.5px solid var(--glass-border)',
          borderRadius: '99px',
          fontSize: '14px',
          fontWeight: '600',
          padding: '10px 18px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        },
        success: {
          iconTheme: { primary: '#1FB86A', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#FF3B30', secondary: '#fff' },
        },
      }}
    />
  </React.StrictMode>
)
