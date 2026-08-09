import React from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'

export default function Champion() {
  const { activeTournament, teams } = useApp()

  if (!activeTournament?.champion) {
    return <EmptyState emoji="🏆" title="Hələ çempion müəyyənləşməyib" />
  }

  const champion = teams[activeTournament.champion]
  const finalMatch = Object.values(activeTournament.matches || {}).find((m) => m.round === 'Final' && m.status === 'FINISHED')

  return (
    <div>
      <div className="champion-hero card card-elevated">
        <span className="trophy-emoji">🏆</span>
        <div className="champion-sub" style={{ marginTop: 14 }}>{activeTournament.name}</div>
        <div className="champion-title">ÇEMPİON</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 }}>
          <TeamLogo team={champion} size={48} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{champion?.name}</span>
        </div>

        {finalMatch && (
          <div style={{ marginTop: 22 }}>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Final</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 6 }}>
              {teams[finalMatch.teamA]?.name} {finalMatch.scoreA} — {finalMatch.scoreB} {teams[finalMatch.teamB]?.name}
            </div>
          </div>
        )}
        {activeTournament.finalMvp && (
          <div className="chip" style={{ marginTop: 16, display: 'inline-block' }}>⭐ Finalın ən yaxşı oyunçusu: {activeTournament.finalMvp}</div>
        )}
      </div>
    </div>
  )
}
