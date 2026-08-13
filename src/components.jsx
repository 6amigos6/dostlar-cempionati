import React from 'react'
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

// ---------- Sadə SVG ikonlar (emoji əvəzinə) ----------
export function BallIcon({ size = 16, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2 15.8 9v4.8L12 15.8l-3.8-2V9z" />
      <path d="M12 7.2v8.6M8.2 9l7.6 4.8M15.8 9 8.2 13.8" />
    </svg>
  )
}

export function CloseIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function ChevronIcon({ size = 14, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function CheckIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
          <button className="icon-btn" aria-label="Bağla" onClick={onClose}><CloseIcon /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Silmə təsdiqi: sadə təsdiq dialoqu, şifrə tələb olunmur.
export function DeleteGate({ title, hint, onConfirm, onClose }) {
  return (
    <Modal title={title || 'Silmə təsdiqi'} onClose={onClose}>
      <div>
        <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
          {hint || 'Bu əməliyyat geri alına bilməz.'}
        </p>
        <div className="field-row">
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Ləğv et</button>
          <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onConfirm(); onClose() }}>Sil</button>
        </div>
      </div>
    </Modal>
  )
}

export function EmptyState({ title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><BallIcon size={30} /></div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}

// Xal cədvəli: tam sütun adları (Oyun / Qələbə / Heç-heçə / Məğlubiyyət /
// Vurulan / Buraxılan / Top fərqi / Xal), mobil ekranlarda üfüqi sürüşdürmə ilə tam oxunaqlı.
// Sıralama: xal → top fərqi → vurulan qollar.
export function StandingsTable({ standings, nameOf, logoOf }) {
  return (
    <div className="table-wrap">
      <div className="table">
        <div className="table-head">
          <span className="c-pos">#</span>
          <span className="c-team">Komanda</span>
          <span className="c-num">Oyun</span>
          <span className="c-num">Qələbə</span>
          <span className="c-num">Heç-heçə</span>
          <span className="c-num">Məğlubiyyət</span>
          <span className="c-num">Vurulan</span>
          <span className="c-num">Buraxılan</span>
          <span className="c-num">Top fərqi</span>
          <span className="c-pts">Xal</span>
        </div>
        {standings.map((r, i) => {
          const gd = r.gf - r.ga
          return (
            <div className="table-row" key={r.teamId}>
              <span className="c-pos">{i + 1}</span>
              <span className="c-team">
                <TeamLogo team={logoOf ? logoOf(r.teamId) : { name: nameOf(r.teamId) }} size={22} />
                <span className="c-name">{nameOf(r.teamId)}</span>
              </span>
              <span className="c-num">{r.played}</span>
              <span className="c-num">{r.won}</span>
              <span className="c-num">{r.drawn}</span>
              <span className="c-num">{r.lost}</span>
              <span className="c-num">{r.gf}</span>
              <span className="c-num">{r.ga}</span>
              <span className={`c-num ${gd > 0 ? 'pos' : gd < 0 ? 'neg' : ''}`}>{gd > 0 ? `+${gd}` : gd}</span>
              <span className="c-pts">{r.pts}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
