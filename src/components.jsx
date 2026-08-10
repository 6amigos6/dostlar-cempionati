import React from 'react'
import { Link } from 'react-router-dom'
import { avatarColorFor } from './lib/logic'

export function TeamLogo({ team, size = 46 }) {
  const style = { width: size, height: size }
  if (team?.logoUrl) {
    return <div className="team-logo" style={{ ...style, backgroundImage: `url(${team.logoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
  }
  const color = team?.color || avatarColorFor(team?.name || team?.id || '')
  return (
    <div className="team-logo" style={{ ...style, background: `linear-gradient(135deg, ${color}, ${color}99)`, fontSize: size * 0.42 }}>
      🛡️
    </div>
  )
}

export function MatchCard({ match, teams }) {
  const teamA = teams?.[match.teamA]
  const teamB = teams?.[match.teamB]
  const hasScore = match.scoreA != null && match.scoreB != null
  return (
    <div className="card match-card">
      <div className="match-meta">
        <span className="match-round-tag">{match.round}</span>
      </div>
      <div className="match-teams">
        <div className="match-team">
          <TeamLogo team={teamA} size={38} />
          <span className="match-team-name">{teamA ? teamA.name : 'TBD'}</span>
        </div>
        <div className="score-board">
          {hasScore ? (
            <>
              <span>{match.scoreA}</span><span className="dash">:</span><span>{match.scoreB}</span>
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
    </div>
  )
}

export function TeamCard({ team }) {
  const played = team.played ?? null
  const hasStats = played != null && played > 0
  const gd = (team.gf != null && team.ga != null) ? team.gf - team.ga : null
  const pts = team.pts != null ? team.pts : null
  return (
    <Link to={`/teams/${team.id}`} className="card team-card">
      <div className="team-card-top">
        <TeamLogo team={team} />
        <div>
          <div className="team-name">{team.name}</div>
          <div className="team-record">{hasStats ? `${team.won}Q ${team.drawn}H ${team.lost}M` : '—'}</div>
        </div>
      </div>
      <div className="team-stat-row"><span>Qol fərqi</span><span>{gd != null ? (gd > 0 ? `+${gd}` : gd) : '—'}</span></div>
      <div className="team-stat-row"><span>Xal</span><span className="team-pts">{pts != null ? pts : '—'}</span></div>
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
