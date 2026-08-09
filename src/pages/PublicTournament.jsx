import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { MatchCard, TeamLogo, EmptyState } from '../components.jsx'
import { computeStandings } from '../lib/logic'

export default function PublicTournament() {
  const { id } = useParams()
  const { tournaments, archive, teams } = useApp()
  const t = tournaments[id] || archive[id]

  const matches = useMemo(() => (t?.matches ? Object.values(t.matches) : []), [t])
  const standings = useMemo(() => (t ? computeStandings(t.teamIds || [], matches, t.pointsRule) : []), [t, matches])

  if (!t) return <EmptyState emoji="🔗" title="Bu link üçün turnir tapılmadı" />

  return (
    <div>
      <div className="hero">
        <div className="hero-eyebrow">Turnir Linki</div>
        <h1 className="hero-title">{t.name}</h1>
        <div className="hero-sub">Mövsüm {t.season} · {t.status}</div>
        {t.champion && (
          <div className="chip" style={{ display: 'inline-block' }}>🏆 Çempion: {teams[t.champion]?.name}</div>
        )}
      </div>

      {t.format !== 'knockout' && standings.length > 0 && (
        <>
          <div className="section-title"><h2>Cədvəl</h2></div>
          <div className="card table-wrap">
            <table className="standings">
              <thead><tr><th>POS</th><th>TEAM</th><th>O</th><th>XAL</th></tr></thead>
              <tbody>
                {standings.map((r, i) => (
                  <tr key={r.teamId}><td>{i + 1}</td><td><TeamLogo team={teams[r.teamId]} size={20} />{teams[r.teamId]?.name}</td><td>{r.played}</td><td>{r.pts}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="section-title"><h2>Oyunlar</h2></div>
      {matches.length === 0 ? <EmptyState emoji="⚽" title="Oyun yoxdur" /> : matches.map((m, i) => <MatchCard key={i} match={m} teams={teams} />)}
    </div>
  )
}
