import React, { useMemo } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'
import { computeStandings } from '../lib/logic'

export default function Standings() {
  const { activeTournament, teams } = useApp()

  const rows = useMemo(() => {
    if (!activeTournament) return []
    const matches = Object.values(activeTournament.matches || {})
    return computeStandings(activeTournament.teamIds || [], matches, activeTournament.pointsRule)
  }, [activeTournament])

  if (!activeTournament) return <EmptyState emoji="📋" title="Aktiv çempionat yoxdur" />
  if (activeTournament.format === 'knockout') {
    return <EmptyState emoji="📋" title="Bu turnir formatında cədvəl yoxdur" sub="Birbaşa playoff formatı üçün Turnir bölməsindəki əvəzinə bracket görünüşünə baxın." />
  }

  return (
    <div>
      <div className="section-title"><h2>Turnir Cədvəli</h2></div>
      <div className="card table-wrap">
        <table className="standings">
          <thead>
            <tr>
              <th>POS</th><th>TEAM</th><th>O</th><th>Q</th><th>H</th><th>M</th><th>VQ</th><th>BQ</th><th>FƏRQ</th><th>XAL</th>
            </tr>
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
      <p className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>Sıralama: Xal → Top fərqi → Vurulan qollar</p>
    </div>
  )
}
