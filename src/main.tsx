import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-center"
      gutter={8}
      toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--bg-raised)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-med)',
          borderRadius: '99px',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'Figtree, sans-serif',
          padding: '10px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        },
        success: {
          iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--bg-raised)' },
        },
        error: {
          iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--bg-raised)' },
        },
      }}
    />
  </React.StrictMode>
)
