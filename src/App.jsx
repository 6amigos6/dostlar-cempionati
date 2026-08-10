import React, { useState } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from './store.jsx'

import Home from './pages/Home.jsx'
import Teams from './pages/Teams.jsx'
import Archive from './pages/Archive.jsx'
import Admin from './pages/Admin.jsx'

const NAV = [
  { to: '/', label: 'Çempionat', emoji: '⚽' },
  { to: '/teams', label: 'Komandalar', emoji: '🛡️' },
  { to: '/archive', label: 'Tarixçə', emoji: '🗄️' },
]

const MORE_LINKS = [
  { to: '/admin', label: 'Admin Panel', emoji: '🔐' },
]

export default function App() {
  const { toast, loading, theme, toggleTheme } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">⚽</span>
          Çempionlar Liqası
        </Link>
        <div className="topbar-right">
          <nav className="desktop-nav">
            {[...NAV, ...MORE_LINKS].map((l) => (
              <Link key={l.to} to={l.to} className={isActive(l.to) ? 'active' : ''}>{l.label}</Link>
            ))}
          </nav>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Tema dəyiş" title="Tema dəyiş">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading"><div className="spinner" />Yüklənir...</div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<Teams />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/archive/:id" element={<Archive />} />
            <Route path="/admin/*" element={<Admin />} />
          </Routes>
        )}
      </main>

      <nav className="bottom-nav">
        {NAV.map((l) => (
          <button key={l.to} className={`nav-item ${isActive(l.to) ? 'active' : ''}`} onClick={() => navigate(l.to)}>
            <span>{l.emoji}</span>{l.label}
          </button>
        ))}
        <button className={`nav-item ${moreOpen ? 'active' : ''}`} onClick={() => setMoreOpen(true)}>
          <span>☰</span>Digər
        </button>
      </nav>

      {moreOpen && (
        <div className="modal-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, margin: 0 }}>Digər bölmələr</h2>
              <button className="icon-btn" onClick={() => setMoreOpen(false)}>✕</button>
            </div>
            <div className="stack-8">
              {MORE_LINKS.map((l) => (
                <button
                  key={l.to}
                  className="btn btn-ghost btn-block"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => { navigate(l.to); setMoreOpen(false) }}
                >
                  <span style={{ marginRight: 8 }}>{l.emoji}</span>{l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
