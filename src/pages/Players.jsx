import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { Avatar, PlayerCard, EmptyState } from '../components.jsx'
import { computePlayerRating } from '../lib/logic'

export default function Players() {
  const { id } = useParams()
  const { playerList, players, teams } = useApp()
  const [q, setQ] = useState('')

  if (id) {
    const player = players[id]
    if (!player) return <EmptyState emoji="👤" title="Oyunçu tapılmadı" />
    const team = player.teamId ? teams[player.teamId] : null
    const rating = computePlayerRating(player)
    const stats = [
      ['Oyun sayı', player.gamesPlayed || 0],
      ['Qələbə sayı', player.wins || 0],
      ['Qol sayı', player.goals || 0],
      ['Assist sayı', player.assists || 0],
      ['Sarı kart', player.yellowCards || 0],
      ['Qırmızı kart', player.redCards || 0],
    ]
    return (
      <div>
        <Link to="/players" className="chip" style={{ marginBottom: 14, display: 'inline-block' }}>← Oyunçular</Link>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: 26 }}>
          <Avatar player={player} size={78} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, marginTop: 12 }}>{player.firstName} {player.lastName}</div>
          {player.nickname && <div className="muted" style={{ fontSize: 12.5 }}>"{player.nickname}"</div>}
          <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{player.position || '—'} {player.number != null ? `· #${player.number}` : ''}</div>
          {team && <Link to={`/teams/${team.id}`} className="chip" style={{ marginTop: 10, display: 'inline-block' }}>🛡️ {team.name}</Link>}
          <div className="player-rating" style={{ marginTop: 12, display: 'inline-block' }}>⭐ Reytinq: {rating}</div>
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          {stats.map(([label, val]) => (
            <div className="card" key={label}>
              <div className="muted" style={{ fontSize: 11 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{val}</div>
            </div>
          ))}
        </div>

        {player.tournamentHistory?.length > 0 && (
          <>
            <div className="section-title"><h2>Turnirlərdə iştirakı</h2></div>
            <div className="card">
              {player.tournamentHistory.map((t, i) => <div key={i} className="chip" style={{ marginRight: 6, marginBottom: 6, display: 'inline-block' }}>{t}</div>)}
            </div>
          </>
        )}
      </div>
    )
  }

  const filtered = useMemo(() => playerList.filter((p) => `${p.firstName} ${p.lastName} ${p.nickname || ''}`.toLowerCase().includes(q.toLowerCase())), [playerList, q])

  return (
    <div>
      <div className="section-title"><h2>Oyunçular</h2></div>
      <div className="field"><input placeholder="Oyunçu axtar..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {filtered.length === 0
        ? <EmptyState emoji="👤" title="Oyunçu tapılmadı" sub="Admin panelindən oyunçu əlavə edin." />
        : <div className="grid-cards">{filtered.map((p) => <PlayerCard key={p.id} player={p} team={teams[p.teamId]} />)}</div>}
    </div>
  )
}
