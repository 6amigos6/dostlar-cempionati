import React, { useRef, useState } from 'react'
import { avatarColorFor } from './lib/logic'

export function TeamLogo({ team, size = 36 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.45) }
  if (team?.logoUrl) {
    return (
      <img
        className="team-logo team-logo-img"
        style={{ ...style }}
        src={team.logoUrl}
        alt=""
        crossOrigin="anonymous"
        loading="lazy"
      />
    )
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

// "66" şifrəsi ilə qorunan silmə təsdiqi.
// istifadəçi əvvəlcə "Sil" düyməsini, sonra bu dialoqda şifrəni daxil edir.
export function DeleteGate({ title, hint, onConfirm, onClose }) {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(false)
  const inputRef = useRef(null)

  function submit(e) {
    e.preventDefault()
    if (password.trim() === '66') {
      onConfirm()
      onClose()
    } else {
      setErr(true)
      inputRef.current?.focus()
    }
  }

  return (
    <Modal title={title || 'Silmə təsdiqi'} onClose={onClose}>
      <form onSubmit={submit}>
        <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
          {hint || 'Bu əməliyyat geri alına bilməz.'}
        </p>
        <div className="field">
          <label>Təsdiq şifrəsi (66)</label>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErr(false) }}
            placeholder="••••"
            autoFocus
            style={{ letterSpacing: 4, fontSize: 16, textAlign: 'center' }}
          />
        </div>
        {err && <div style={{ color: 'var(--live)', fontSize: 12, marginBottom: 10 }}>Şifrə yanlışdır.</div>}
        <div className="field-row">
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Ləğv et</button>
          <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>Sil</button>
        </div>
      </form>
    </Modal>
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
