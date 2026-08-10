import React, { useMemo } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'
import { computeStandings } from '../lib/logic'

function GroupTable({ title, rows, teams }) {
  return (
    <div>
      <div className="section-title"><h2>{title}</h2></div>
      <div className="card table-wrap">
        <table className="standings">
          <thead>
            <tr><th>POS</th><th>TEAM</th><th>O</th><th>Q</th><th>H</th><th>M</th><th>VQ</th><th>BQ</th><th>FƏRQ</th><th>XAL</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const team = teams[r.teamId]
              return (
                <tr key={r.teamId}>
                  <td>{i + 1}</td>
                  <td><TeamLogo team={team} size={22} />{team?.name || '—'}</td>
                  <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
                  <td>{r.gf}</td><td>{r.ga}</td><td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td><td>{r.pts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Standings() {
  const { activeTournament, teams } = useApp()

  const matches = useMemo(() => Object.values(activeTournament?.matches || {}), [activeTournament])

  if (!activeTournament) return <EmptyState emoji="📋" title="Aktiv çempionat yoxdur" />
  if (activeTournament.format === 'knockout') {
    return <EmptyState emoji="📋" title="Bu formatda cədvəl yoxdur" sub="Playoff formatında cədvəl əvəzinə Turnir (bracket) bölməsinə baxın." />
  }

  const groups = activeTournament.groups

  return (
    <div>
      <div className="section-title"><h2>Turnir Cədvəli</h2></div>
      {groups
        ? Object.entries(groups).map(([letter, ids]) => (
            <GroupTable
              key={letter}
              title={`${letter} qrupu`}
              rows={computeStandings(ids, matches.filter((m) => m.group === letter), activeTournament.pointsRule)}
              teams={teams}
            />
          ))
        : (
          <GroupTable
            title="Ümumi cədvəl"
            rows={computeStandings(activeTournament.teamIds || [], matches, activeTournament.pointsRule)}
            teams={teams}
          />
        )}
      <p className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>Qələbə 3 xal · Heç-heçə 1 xal · Məğlubiyyət 0 xal · Sıralama: Xal → Top fərqi → Vurulan qollar</p>
    </div>
  )
}
