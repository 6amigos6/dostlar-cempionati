import React, { useMemo } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'

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
  const { teamList } = useApp()

  const topAttack = useMemo(() => [...teamList].filter((t) => (t.gf || 0) > 0).sort((a, b) => (b.gf || 0) - (a.gf || 0)).slice(0, 5), [teamList])
  const bestDefense = useMemo(() => [...teamList].filter((t) => (t.ga || 0) > 0).sort((a, b) => (a.ga || 0) - (b.ga || 0)).slice(0, 5), [teamList])
  const mostWins = useMemo(() => [...teamList].filter((t) => (t.won || 0) > 0).sort((a, b) => (b.won || 0) - (a.won || 0)).slice(0, 5), [teamList])
  const totalGoals = teamList.reduce((s, t) => s + (t.gf || 0), 0)

  return (
    <div>
      <div className="section-title"><h2>Statistikalar</h2></div>
      <div className="card card-elevated" style={{ textAlign: 'center', padding: 20 }}>
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Ümumi vurulan qollar</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold)', marginTop: 4 }}>{totalGoals}</div>
      </div>
      {teamList.length === 0
        ? <EmptyState emoji="📊" title="Hələ statistika yoxdur" sub="Komandalar və oyun nəticələri daxil edildikcə burada görünəcək." />
        : (
          <div className="stack-8" style={{ marginTop: 12 }}>
            <Leaderboard title="Ən çox qol vuran komanda" emoji="⚽" rows={topAttack}
              renderMeta={(t) => <TeamLogo team={t} size={26} />} renderLabel={(t) => t.name} renderValue={(t) => `${t.gf} qol`} />
            <Leaderboard title="Ən yaxşı müdafiə" emoji="🛡️" rows={bestDefense}
              renderMeta={(t) => <TeamLogo team={t} size={26} />} renderLabel={(t) => t.name} renderValue={(t) => `${t.ga} buraxılan`} />
            <Leaderboard title="Ən çox qələbə" emoji="🔥" rows={mostWins}
              renderMeta={(t) => <TeamLogo team={t} size={26} />} renderLabel={(t) => t.name} renderValue={(t) => `${t.won} qələbə`} />
          </div>
        )}
    </div>
  )
}
