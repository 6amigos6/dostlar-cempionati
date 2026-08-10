import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'

export default function Champion() {
  const { activeTournament, teams, archiveList } = useApp()
  const t = activeTournament?.champion ? activeTournament : archiveList[0]

  if (!t?.champion) {
    return <EmptyState emoji="🏆" title="Hələ çempion müəyyənləşməyib" sub="Turnir başa çatdıqda çempion burada göstəriləcək." />
  }

  const teamInfo = (id) => t.teamsInfo?.[id] || teams[id] || null
  const teamName = (id) => teamInfo(id)?.name || '—'
  const finalMatch = Object.values(t.matches || {}).find((m) => m.round === 'Final' && m.status === 'FINISHED')

  return (
    <div>
      <div className="champion-hero card card-elevated">
        <span className="trophy-emoji">🏆</span>
        <div className="champion-sub" style={{ marginTop: 14 }}>{t.name} · Mövsüm {t.season}</div>
        <div className="champion-title">ÇEMPİON</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 }}>
          <TeamLogo team={teamInfo(t.champion)} size={48} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{teamName(t.champion)}</span>
        </div>

        {finalMatch && (
          <div style={{ marginTop: 22 }}>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Final</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 6 }}>
              {teamName(finalMatch.teamA)} {finalMatch.scoreA} — {finalMatch.scoreB} {teamName(finalMatch.teamB)}
            </div>
          </div>
        )}
      </div>
      {!activeTournament?.champion && (
        <Link to="/archive" className="btn btn-outline btn-block" style={{ marginTop: 12 }}>Tarixçəyə bax →</Link>
      )}
    </div>
  )
}
