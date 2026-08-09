import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { TeamLogo, TeamCard, PlayerCard, EmptyState } from '../components.jsx'

export default function Teams() {
  const { id } = useParams()
  const { teamList, players, teams } = useApp()

  if (id) {
    const team = teams[id]
    if (!team) return <EmptyState emoji="🛡️" title="Komanda tapılmadı" />
    const roster = Object.entries(players).filter(([, p]) => p.teamId === id).map(([pid, p]) => ({ id: pid, ...p }))
    const gd = (team.gf || 0) - (team.ga || 0)
    return (
      <div>
        <Link to="/teams" className="chip" style={{ marginBottom: 14, display: 'inline-block' }}>← Komandalar</Link>
        <div className="card card-elevated" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <TeamLogo team={{ id, ...team }} size={64} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{team.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{team.played || 0} oyun · {team.won || 0}Q {team.drawn || 0}H {team.lost || 0}M</div>
          </div>
        </div>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="card"><div className="muted" style={{ fontSize: 11 }}>Vurulan qollar</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{team.gf || 0}</div></div>
          <div className="card"><div className="muted" style={{ fontSize: 11 }}>Buraxılan qollar</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{team.ga || 0}</div></div>
          <div className="card"><div className="muted" style={{ fontSize: 11 }}>Top fərqi</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{gd > 0 ? `+${gd}` : gd}</div></div>
          <div className="card"><div className="muted" style={{ fontSize: 11 }}>Xal</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold)' }}>{(team.won || 0) * 3 + (team.drawn || 0)}</div></div>
        </div>

        <div className="section-title"><h2>Oyunçular ({roster.length})</h2></div>
        {roster.length === 0
          ? <EmptyState emoji="👤" title="Bu komandada hələ oyunçu yoxdur" />
          : <div className="grid-cards">{roster.map((p) => <PlayerCard key={p.id} player={p} />)}</div>}
      </div>
    )
  }

  return (
    <div>
      <div className="section-title"><h2>Komandalar</h2></div>
      {teamList.length === 0
        ? <EmptyState emoji="🛡️" title="Hələ komanda yaradılmayıb" sub="Admin panelindən komanda əlavə edin." />
        : <div className="grid-cards">{teamList.map((t) => <TeamCard key={t.id} team={t} />)}</div>}
    </div>
  )
}
