import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'
import { winnerOf } from '../lib/logic'

export default function Bracket() {
  const { activeTournament, teams } = useApp()

  const rounds = useMemo(() => {
    if (!activeTournament?.matches) return []
    const map = {}
    // yalnız playoff (qrup xaric) oyunları bracket-də göstərilir
    Object.values(activeTournament.matches).filter((m) => !m.group).forEach((m) => { (map[m.round] = map[m.round] || []).push(m) })
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [activeTournament])

  if (!activeTournament) return <EmptyState emoji="🏆" title="Aktiv çempionat yoxdur" />

  if (activeTournament.champion) {
    return (
      <div>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: 26, marginBottom: 16 }}>
          <span style={{ fontSize: 40 }}>🏆</span>
          <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Çempion</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginTop: 4 }}>{teams[activeTournament.champion]?.name}</div>
          <Link to="/champion" className="btn btn-gold btn-sm" style={{ marginTop: 12 }}>Çempion səhifəsinə bax →</Link>
        </div>
        <BracketGrid rounds={rounds} teams={teams} />
      </div>
    )
  }

  if (rounds.length === 0) {
    const stageLabel = activeTournament.stage === 'groups' ? 'Qrup mərhələsi davam edir' : 'Hələ püşkatma edilməyib'
    return <EmptyState emoji="🏆" title="Playoff hələ formalaşmayıb" sub={activeTournament.stage === 'groups' ? 'Qrup oyunları bitdikdə playoff avtomatik qurulacaq.' : 'Admin panelindən Tənzimləmələr → Çempionatı başlat ilə püşkatma çəkin.'} />
  }

  return (
    <div>
      <div className="section-title"><h2>Playoff Bracket</h2></div>
      <BracketGrid rounds={rounds} teams={teams} />
    </div>
  )
}

function BracketGrid({ rounds, teams }) {
  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {rounds.map(([roundName, matches]) => (
          <div className="bracket-round" key={roundName}>
            <div className="bracket-round-title">{roundName}</div>
            {matches.map((m, i) => {
              const winner = winnerOf(m)
              const teamA = teams[m.teamA]
              const teamB = teams[m.teamB]
              return (
                <div className="bracket-match" key={i}>
                  <div className={`bracket-slot ${winner && winner === m.teamA ? 'winner' : ''}`}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <TeamLogo team={teamA} size={18} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamA?.name || 'TBD'}</span>
                    </span>
                    <span className="sc">{m.status === 'UPCOMING' ? '' : m.scoreA ?? '-'}</span>
                  </div>
                  <div className={`bracket-slot ${winner && winner === m.teamB ? 'winner' : ''}`}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <TeamLogo team={teamB} size={18} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamB?.name || 'TBD'}</span>
                    </span>
                    <span className="sc">{m.status === 'UPCOMING' ? '' : m.scoreB ?? '-'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
