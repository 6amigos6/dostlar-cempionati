import React from 'react'
import { avatarColorFor } from './lib/logic'

export function TeamLogo({ team, size = 36 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.45) }
  if (team?.logoUrl) {
    return <div className="team-logo" style={{ ...style, backgroundImage: `url(${team.logoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
  }
  const color = avatarColorFor(team?.name || team?.id || '')
  return (
    <div className="team-logo" style={{ ...style, background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
      {(team?.name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-emoji">⚽</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}
