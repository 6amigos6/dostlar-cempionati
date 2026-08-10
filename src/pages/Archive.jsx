import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import TournamentView from '../components/TournamentView.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'
import { formatDateTimeBaku } from '../lib/logic'

export default function Archive() {
  const { id } = useParams()
  const { archive, archiveList, teams } = useApp()

  if (id) {
    const t = archive[id]
    if (!t) return <EmptyState emoji="🗄️" title="Turnir tapılmadı" />
    const champInfo = t.teamsInfo?.[t.champion] || teams[t.champion] || null
    return (
      <div>
        <Link to="/archive" className="chip" style={{ marginBottom: 14, display: 'inline-block' }}>← Tarixçə</Link>
        <div className="muted" style={{ fontSize: 11.5, marginBottom: 12, textAlign: 'center' }}>
          {formatDateTimeBaku(t.archivedAt || t.finishedAt)}
        </div>
        <TournamentView tournament={t} teams={teams} />
        {champInfo && (
          <div className="card card-elevated" style={{ marginTop: 14, textAlign: 'center', padding: 18 }}>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Çempion</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
              <TeamLogo team={champInfo} size={34} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{champInfo.name}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="section-title"><h2>Hall of Fame</h2></div>
      {archiveList.length === 0
        ? <EmptyState emoji="🗄️" title="Hələ bitmiş turnir yoxdur" sub="Turnir başa çatdıqda avtomatik olaraq burada saxlanılacaq." />
        : archiveList.map((t) => {
            const champInfo = t.teamsInfo?.[t.champion] || teams[t.champion] || null
            return (
              <Link key={t.id} to={`/archive/${t.id}`} className="card team-card" style={{ marginBottom: 10 }}>
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.name} · {t.season}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{formatDateTimeBaku(t.archivedAt || t.finishedAt)} · {t.teamIds?.length || 0} komanda</div>
                  </div>
                  {champInfo && (
                    <div style={{ textAlign: 'right' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                        <TeamLogo team={champInfo} size={20} />{champInfo.name}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
    </div>
  )
}
