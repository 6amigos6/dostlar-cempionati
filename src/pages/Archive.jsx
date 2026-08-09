import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { TeamLogo, MatchCard, EmptyState } from '../components.jsx'

export default function Archive() {
  const { id } = useParams()
  const { archive, archiveList, teams } = useApp()

  if (id) {
    const t = archive[id]
    if (!t) return <EmptyState emoji="🗄️" title="Arxiv tapılmadı" />
    const matches = Object.values(t.matches || {}).filter((m) => m.status === 'FINISHED')
    return (
      <div>
        <Link to="/archive" className="chip" style={{ marginBottom: 14, display: 'inline-block' }}>← Turnir Arxivi</Link>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: 24 }}>
          <div className="muted" style={{ fontSize: 11 }}>{t.season}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '4px 0' }}>{t.name}</div>
          {t.champion && (
            <>
              <span style={{ fontSize: 34 }}>🏆</span>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{teams[t.champion]?.name}</div>
            </>
          )}
          {t.finalMvp && <div className="chip" style={{ marginTop: 8, display: 'inline-block' }}>⭐ MVP: {t.finalMvp}</div>}
        </div>
        <div className="section-title"><h2>Oyunlar və nəticələr</h2></div>
        {matches.length === 0 ? <EmptyState emoji="⚽" title="Nəticə yoxdur" /> : matches.map((m, i) => <MatchCard key={i} match={m} teams={teams} />)}
      </div>
    )
  }

  return (
    <div>
      <div className="section-title"><h2>🏆 Hall of Fame</h2></div>
      {archiveList.filter((t) => t.champion).length === 0
        ? <div className="card muted" style={{ textAlign: 'center', fontSize: 12.5 }}>Hələ çempion yoxdur</div>
        : (
          <div className="card stack-8">
            {archiveList.filter((t) => t.champion).map((t) => (
              <div key={t.id} className="flex-between">
                <span className="mono muted">{t.season}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamLogo team={teams[t.champion]} size={22} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{teams[t.champion]?.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      <div className="section-title"><h2>Turnir Arxivi</h2></div>
      {archiveList.length === 0
        ? <EmptyState emoji="🗄️" title="Arxivləşmiş turnir yoxdur" sub="Turnir tamamlandıqda burada saxlanılacaq." />
        : archiveList.map((t) => (
          <Link key={t.id} to={`/archive/${t.id}`} className="card team-card">
            <div className="flex-between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.name}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{t.season} · {t.teamIds?.length || 0} komanda</div>
              </div>
              {t.champion && <div style={{ textAlign: 'right' }}><span>🏆</span><div style={{ fontSize: 11, fontWeight: 700 }}>{teams[t.champion]?.name}</div></div>}
            </div>
          </Link>
        ))}
    </div>
  )
}
