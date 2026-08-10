import React, { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { TeamLogo, MatchCard, EmptyState } from '../components.jsx'
import { computeStandings, formatDateTimeBaku } from '../lib/logic'

function GroupTable({ title, rows, teamInfo }) {
  return (
    <div>
      <div className="section-title"><h2>{title}</h2></div>
      <div className="card table-wrap">
        <table className="standings">
          <thead><tr><th>POS</th><th>TEAM</th><th>O</th><th>Q</th><th>H</th><th>M</th><th>VQ</th><th>BQ</th><th>FƏRQ</th><th>XAL</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.teamId}>
                <td>{i + 1}</td>
                <td><TeamLogo team={teamInfo(r.teamId)} size={22} />{teamInfo(r.teamId)?.name || '—'}</td>
                <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
                <td>{r.gf}</td><td>{r.ga}</td><td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td><td>{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Archive() {
  const { id } = useParams()
  const { archive, archiveList, teams } = useApp()

  if (id) {
    const t = archive[id]
    if (!t) return <EmptyState emoji="🗄️" title="Turnir tapılmadı" />
    const teamInfo = (tid) => t.teamsInfo?.[tid] || teams[tid] || null
    const teamName = (tid) => teamInfo(tid)?.name || '—'
    const matches = Object.values(t.matches || {})
    const finished = matches.filter((m) => m.status === 'FINISHED')
    const allTeamIds = [...new Set(matches.flatMap((m) => [m.teamA, m.teamB]).filter(Boolean))]

    const rounds = {}
    matches.forEach((m) => { (rounds[m.round] = rounds[m.round] || []).push(m) })

    const totalGoals = finished.reduce((s, m) => s + (m.scoreA || 0) + (m.scoreB || 0), 0)
    const table = computeStandings(allTeamIds, finished, t.pointsRule)
    const topAttack = [...table].sort((a, b) => b.gf - a.gf)[0]
    const bestDefense = [...table].sort((a, b) => a.ga - b.ga)[0]
    const mostWins = [...table].sort((a, b) => b.won - a.won)[0]

    return (
      <div>
        <Link to="/archive" className="chip" style={{ marginBottom: 14, display: 'inline-block' }}>← Tarixçə</Link>
        <div className="hero">
          <span className="cup-trophy">🏆</span>
          <div className="hero-eyebrow">Bitmiş turnir</div>
          <h1 className="hero-title">{t.name}</h1>
          <div className="hero-sub">Mövsüm {t.season} · {formatDateTimeBaku(t.archivedAt || t.finishedAt)}</div>
          {t.champion && (
            <div className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <TeamLogo team={teamInfo(t.champion)} size={22} />
              <b>{teamName(t.champion)}</b>
            </div>
          )}
        </div>

        <div className="section-title"><h2>Xal cədvəli</h2></div>
        {t.groupStandings && Object.keys(t.groupStandings).length > 0
          ? Object.entries(t.groupStandings).map(([letter, rows]) => (
              <GroupTable key={letter} title={`${letter} qrupu`} rows={rows} teamInfo={teamInfo} />
            ))
          : <GroupTable title="Ümumi cədvəl" rows={table} teamInfo={teamInfo} />}

        <div className="section-title"><h2>Qarşılaşmalar</h2></div>
        {finished.length === 0
          ? <EmptyState emoji="⚽" title="Oyun yoxdur" />
          : Object.entries(rounds).map(([round, ms]) => (
              <div key={round}>
                <div className="section-title"><h2>{round}</h2></div>
                {ms.map((m, i) => <MatchCard key={i} match={m} teams={teams} />)}
              </div>
            ))}

        <div className="section-title"><h2>Statistikalar</h2></div>
        <div className="grid-2">
          <div className="card"><div className="muted" style={{ fontSize: 11 }}>Vurulan qollar</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{totalGoals}</div></div>
          {topAttack && <div className="card"><div className="muted" style={{ fontSize: 11 }}>Ən çox qol</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{teamName(topAttack.teamId)} · {topAttack.gf}</div></div>}
          {bestDefense && <div className="card"><div className="muted" style={{ fontSize: 11 }}>Ən yaxşı müdafiə</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{teamName(bestDefense.teamId)} · {bestDefense.ga}</div></div>}
          {mostWins && <div className="card"><div className="muted" style={{ fontSize: 11 }}>Ən çox qələbə</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{teamName(mostWins.teamId)} · {mostWins.won}</div></div>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-title"><h2>🏆 Hall of Fame</h2></div>
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
                      <span>🏆</span>
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
