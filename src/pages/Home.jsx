import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { MatchCard, Countdown, TeamLogo, EmptyState } from '../components.jsx'

export default function Home() {
  const { activeTournament, teams } = useApp()

  const matches = useMemo(() => (activeTournament?.matches ? Object.entries(activeTournament.matches).map(([id, m]) => ({ id, ...m })) : []), [activeTournament])
  const upcoming = matches.filter((m) => m.status === 'UPCOMING' && m.startTime).sort((a, b) => a.startTime - b.startTime)
  const nextMatch = upcoming[0]
  const recent = matches.filter((m) => m.status === 'FINISHED').sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0)).slice(0, 4)
  const live = matches.filter((m) => m.status === 'LIVE')

  if (!activeTournament) {
    return (
      <div>
        <EmptyState emoji="🏟️" title="Hazırda aktiv çempionat yoxdur" sub="Admin panelindən Tənzimləmələr → Çempionatı başlat ilə yeni çempionat başlada bilərsiniz." />
        <Link to="/admin" className="btn btn-primary btn-block">Admin Panelə keç</Link>
      </div>
    )
  }

  const stagesCount = new Set(matches.map((m) => m.round)).size

  return (
    <div>
      <div className="hero">
        <div className="hero-eyebrow">Aktiv Çempionat</div>
        <h1 className="hero-title">{activeTournament.name}</h1>
        <div className="hero-sub">Mövsüm {activeTournament.season} · {activeTournament.status === 'ACTIVE' ? 'Davam edir' : activeTournament.status}</div>
        <div className="hero-stats">
          <div className="hero-stat"><b>{activeTournament.teamIds?.length || 0}</b><span>Komanda</span></div>
          <div className="hero-stat"><b>{matches.length}</b><span>Oyun</span></div>
          <div className="hero-stat"><b>{stagesCount}</b><span>Mərhələ</span></div>
        </div>
      </div>

      {live.length > 0 && (
        <>
          <div className="section-title"><h2>🔴 Canlı oyunlar</h2></div>
          {live.map((m) => <MatchCard key={m.id} match={m} teams={teams} />)}
        </>
      )}

      {nextMatch && (
        <>
          <div className="section-title"><h2>Növbəti qarşılaşma</h2></div>
          <div className="card card-elevated">
            <div className="match-teams" style={{ marginBottom: 14 }}>
              <div className="match-team">
                <TeamLogo team={teams[nextMatch.teamA]} size={44} />
                <span className="match-team-name">{teams[nextMatch.teamA]?.name || 'TBD'}</span>
              </div>
              <span style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-display)' }}>VS</span>
              <div className="match-team">
                <TeamLogo team={teams[nextMatch.teamB]} size={44} />
                <span className="match-team-name">{teams[nextMatch.teamB]?.name || 'TBD'}</span>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>⏳ Başlamasına:</div>
            <Countdown target={nextMatch.startTime} />
          </div>
        </>
      )}

      <div className="section-title">
        <h2>Son nəticələr</h2>
        <Link to="/matches" className="see-all">Hamısı →</Link>
      </div>
      {recent.length === 0
        ? <EmptyState emoji="⚽" title="Hələ nəticə yoxdur" />
        : recent.map((m) => <MatchCard key={m.id} match={m} teams={teams} />)}
    </div>
  )
}
