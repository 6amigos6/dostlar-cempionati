import React, { useEffect, useState } from 'react'
import { useApp } from './store.jsx'
import Home from './pages/Home.jsx'
import Admin from './pages/Admin.jsx'
import Archive from './pages/Archive.jsx'
import { BallIcon } from './components.jsx'

function getView() {
  const h = window.location.hash
  if (h === '#/admin') return 'admin'
  if (h === '#/archive') return 'archive'
  return 'home'
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
          <span className="brand-mark"><BallIcon size={16} /></span>
          Çempionat
        </a>
        <nav className="topbar-nav">
          {view !== 'home' && <a href="#/" className="btn btn-ghost btn-sm">Sayt</a>}
          {view !== 'archive' && <a href="#/archive" className="btn btn-ghost btn-sm">Arxiv</a>}
          {view !== 'admin' && <a href="#/admin" className="btn btn-ghost btn-sm">Admin</a>}
        </nav>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading"><div className="spinner" />Yüklənir...</div>
        ) : view === 'admin' ? (
          <Admin />
        ) : view === 'archive' ? (
          <Archive />
        ) : (
          <Home />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
