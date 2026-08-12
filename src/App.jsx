import React, { useEffect, useState } from 'react'
import { useApp } from './store.jsx'
import Home from './pages/Home.jsx'
import Admin from './pages/Admin.jsx'

function getView() {
  return window.location.hash === '#/admin' ? 'admin' : 'home'
}

export default function App() {
  const { loading, toast } = useApp()
  const [view, setView] = useState(getView)

  useEffect(() => {
    const onHash = () => setView(getView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark">⚽</span>
          Dostlar Çempionatı
        </a>
        <a href={view === 'admin' ? '#/' : '#/admin'} className="btn btn-ghost btn-sm">
          {view === 'admin' ? '← Sayt' : '🔐 Admin'}
        </a>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading"><div className="spinner" />Yüklənir...</div>
        ) : view === 'admin' ? (
          <Admin />
        ) : (
          <Home />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
