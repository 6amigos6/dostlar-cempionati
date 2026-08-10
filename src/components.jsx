import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { avatarColorFor, formatDateTimeBaku } from './lib/logic'

export function TeamLogo({ team, size = 46 }) {
  if (!team) return <div className="team-logo" style={{ width: size, height: size, background: 'var(--elevated)' }}>?</div>
  if (team.logoUrl) {
    return <div className="team-logo" style={{ width: size, height: size, backgroundImage: `url(${team.logoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
  }
  const color = team.color || avatarColorFor(team.name || team.id)
  return (
    <div className="team-logo" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {(team.name || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}

export function StatusBadge({ status }) {
  const labels = { LIVE: 'Canlı', UPCOMING: 'Planlaşdırılıb', FINISHED: 'Bitib', POSTPONED: 'Təxirə salınıb', CANCELLED: 'Ləğv edilib' }
  return (
    <span className={`status-badge status-${status}`}>
      {status === 'LIVE' && <span className="live-dot" />}
      {labels[status] || status}
    </span>
  )
}

export function MatchCard({ match, teams, onClick }) {
  const teamA = teams[match.teamA]
  const teamB = teams[match.teamB]
  const hasScore = match.status === 'FINISHED' || match.status === 'LIVE'
  return (
    <div className="card match-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="match-meta">
        <span className="match-round-tag">{match.round}</span>
        <StatusBadge status={match.status} />
      </div>
      <div className="match-teams">
        <div className="match-team">
          <TeamLogo team={teamA} size={38} />
          <span className="match-team-name">{teamA ? teamA.name : 'TBD'}</span>
        </div>
        <div className="score-board">
          {hasScore ? (
            <>
              <span>{match.scoreA ?? 0}</span><span className="dash">:</span><span>{match.scoreB ?? 0}</span>
            </>
          ) : (
            <span style={{ fontSize: 15, color: 'var(--ink-muted)' }}>vs</span>
          )}
        </div>
        <div className="match-team">
          <TeamLogo team={teamB} size={38} />
          <span className="match-team-name">{teamB ? teamB.name : 'TBD'}</span>
        </div>
      </div>
      {match.penA != null && match.penB != null && (
        <div className="match-pen">Penaltilər: {match.penA} - {match.penB}</div>
      )}
      {match.startTime && (
        <div className="match-pen">{formatDateTimeBaku(match.startTime)}{match.venue ? ` · ${match.venue}` : ''}</div>
      )}
    </div>
  )
}

export function TeamCard({ team }) {
  const gd = (team.gf || 0) - (team.ga || 0)
  return (
    <Link to={`/teams/${team.id}`} className="card team-card">
      <div className="team-card-top">
        <TeamLogo team={team} />
        <div>
          <div className="team-name">{team.name}</div>
          <div className="team-record">{team.won || 0}Q {team.drawn || 0}H {team.lost || 0}M</div>
        </div>
      </div>
      <div className="team-stat-row"><span>Qol fərqi</span><span>{gd > 0 ? `+${gd}` : gd}</span></div>
      <div className="team-stat-row"><span>Xal</span><span className="team-pts">{team.pts ?? (team.won || 0) * 3 + (team.drawn || 0)}</span></div>
    </Link>
  )
}

export function EmptyState({ emoji = '⚽', title, sub }) {
  return (
    <div className="empty-state">
      <span className="emoji">{emoji}</span>
      <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5 }}>{sub}</div>}
    </div>
  )
}

export function Countdown({ target }) {
  const [left, setLeft] = useState(target - Date.now())
  useEffect(() => {
    const t = setInterval(() => setLeft(target - Date.now()), 1000)
    return () => clearInterval(t)
  }, [target])
  if (left <= 0) return <div className="countdown"><div className="countdown-unit"><b>🔴</b><span>Başladı</span></div></div>
  const d = Math.floor(left / 86400000)
  const h = Math.floor((left % 86400000) / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const units = [[d, 'Gün'], [h, 'Saat'], [m, 'Dəq'], [s, 'San']]
  return (
    <div className="countdown">
      {units.map(([v, l]) => (
        <div className="countdown-unit" key={l}><b>{String(v).padStart(2, '0')}</b><span>{l}</span></div>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
