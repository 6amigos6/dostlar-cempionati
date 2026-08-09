import React, { useMemo } from 'react'
import { useApp } from '../store.jsx'
import { Avatar, EmptyState } from '../components.jsx'
import { playerName } from '../lib/logic'

function Leaderboard({ title, emoji, rows, renderValue, renderLabel, renderMeta }) {
  if (!rows.length) return null
  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{emoji} {title}</div>
      <div className="stack-8">
        {rows.map((r, i) => (
          <div key={r.id} className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono muted" style={{ width: 16 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
              {renderMeta(r)}
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{renderLabel(r)}</span>
            </div>
            <span className="mono" style={{ color: 'var(--gold)', fontWeight: 700 }}>{renderValue(r)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Statistics() {
  const { playerList } = useApp()

  const topScorers = useMemo(() => [...playerList].filter((p) => p.goals > 0).sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 5), [playerList])
  const topAssists = useMemo(() => [...playerList].filter((p) => p.assists > 0).sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 5), [playerList])
  const mostCards = useMemo(() => [...playerList].filter((p) => (p.yellowCards || 0) + (p.redCards || 0) > 0)
    .sort((a, b) => ((b.yellowCards || 0) + (b.redCards || 0) * 2) - ((a.yellowCards || 0) + (a.redCards || 0) * 2)).slice(0, 5), [playerList])

  const hasAny = topScorers.length || topAssists.length || mostCards.length

  return (
    <div>
      <div className="section-title"><h2>Statistikalar</h2></div>
      {!hasAny
        ? <EmptyState emoji="📊" title="Hələ statistika yoxdur" sub="Oyun nəticələri daxil edildikcə burada görünəcək." />
        : (
          <div className="stack-8">
            <Leaderboard title="Ən çox qol vuran" emoji="⚽" rows={topScorers}
              renderMeta={(p) => <Avatar player={p} size={26} />} renderLabel={(p) => playerName(p)} renderValue={(p) => `${p.goals} qol`} />
            <Leaderboard title="Ən çox assist" emoji="🎯" rows={topAssists}
              renderMeta={(p) => <Avatar player={p} size={26} />} renderLabel={(p) => playerName(p)} renderValue={(p) => `${p.assists} assist`} />
            <Leaderboard title="Ən çox kart" emoji="🟨" rows={mostCards}
              renderMeta={(p) => <Avatar player={p} size={26} />} renderLabel={(p) => playerName(p)}
              renderValue={(p) => `${p.yellowCards || 0}🟨 ${p.redCards || 0}🟥`} />
          </div>
        )}
    </div>
  )
}
