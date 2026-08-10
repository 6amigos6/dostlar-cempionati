import React, { useMemo } from 'react'
import { TeamLogo } from '../components.jsx'
import {
  computeStandings, winnerOf, matchPlayed, roundNameForSize, largestPowerOfTwoLeq,
} from '../lib/logic.js'

function StageMatch({ m, teamInfo, nextLabel }) {
  const played = matchPlayed(m)
  const winner = played ? winnerOf(m) : null
  const a = teamInfo(m.teamA)
  const b = teamInfo(m.teamB)
  return (
    <div className={`mm-card ${played ? 'played' : ''}`}>
      <div className={`mm-team ${winner === m.teamA ? 'win' : ''}`}>
        <TeamLogo team={a} size={34} />
        <span className="mm-name">{a?.name || 'TBD'}</span>
        <span className="mm-score">{played ? m.scoreA : ''}</span>
        {winner === m.teamA && <span className="mm-tick">✓</span>}
      </div>
      <div className="mm-vs">{played ? '—' : 'VS'}</div>
      <div className={`mm-team ${winner === m.teamB ? 'win' : ''}`}>
        <TeamLogo team={b} size={34} />
        <span className="mm-name">{b?.name || 'TBD'}</span>
        <span className="mm-score">{played ? m.scoreB : ''}</span>
        {winner === m.teamB && <span className="mm-tick">✓</span>}
      </div>
      {played && m.penA != null && m.penB != null && (
        <div className="mm-pen">Penaltilər: {m.penA} — {m.penB}</div>
      )}
      {played && nextLabel && (
        <div className="mm-next">{winner === m.teamA ? a?.name : b?.name} → {nextLabel}</div>
      )}
    </div>
  )
}

export default function TournamentView({ tournament, teams }) {
  const t = tournament
  const teamInfo = (id) => teams?.[id] || t.teamsInfo?.[id] || null
  const matches = Object.values(t.matches || {})
  const groups = t.groups || null

  const groupTables = useMemo(() => {
    if (!groups) return null
    const out = {}
    Object.entries(groups).forEach(([letter, ids]) => {
      out[letter] = computeStandings(ids, matches.filter((m) => m.group === letter), t.pointsRule)
    })
    return out
  }, [t])

  const koStages = useMemo(() => {
    const map = {}
    matches.filter((m) => !m.group).forEach((m) => { (map[m.round] = map[m.round] || []).push(m) })
    return Object.entries(map)
      .map(([name, ms]) => ({ name, matches: ms }))
      .sort((a, b) => b.matches.length - a.matches.length) // 1/4 → 1/2 → Final
  }, [t])

  const groupMatches = matches.filter((m) => m.group)
  const leagueTable = (!groups && t.format === 'league') ? computeStandings(t.teamIds || [], matches, t.pointsRule) : null

  const stageLabel = t.stage === 'groups' ? 'Qrup mərhələsi' : t.stage === 'knockout' ? 'Playoff' : 'Liqa'
  const champion = t.champion ? teamInfo(t.champion) : null

  // Mərhələ yolu: Qrup → 1/4 → 1/2 → Final → Çempion
  const roadmap = useMemo(() => {
    const rounds = []
    let size = largestPowerOfTwoLeq(Math.max(2, t.teamIds?.length || 0))
    while (size >= 2) { rounds.push(roundNameForSize(size)); size /= 2 }
    const list = t.format === 'groups' ? ['Qrup mərhələsi', ...rounds] : [...rounds]
    list.push('Çempion')
    return list
  }, [t])
  const activeStep = useMemo(() => {
    if (champion) return roadmap.length - 1
    if (t.stage === 'groups') return 0
    const cur = koStages.find((s) => s.matches.some((m) => !matchPlayed(m)))
    const i = cur ? roadmap.indexOf(cur.name) : -1
    return i >= 0 ? i : Math.max(0, roadmap.length - 2)
  }, [champion, t, koStages, roadmap])

  return (
    <div className="tournament-view">
      <div className="tournament-head">
        <span className="tournament-eyebrow">TOURNAMENT SCHEDULE</span>
        <span className="tournament-name">{t.name}</span>
        <span className="tournament-season">Mövsüm {t.season} · {stageLabel}</span>
      </div>

      <div className="tournament-roadmap">
        {roadmap.map((r, i) => (
          <div className="roadmap-item" key={r}>
            <span className={`roadmap-pill ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}>
              {r}
            </span>
            {i < roadmap.length - 1 && <span className="roadmap-arrow">›</span>}
          </div>
        ))}
      </div>

      {champion && (
        <div className="champion-banner">
          <TeamLogo team={champion} size={64} />
          <div className="champion-text">
            <div className="champion-label">ÇEMPİON</div>
            <div className="champion-name">{champion.name}</div>
          </div>
        </div>
      )}

      <div className="tv-stages">
        {groupTables && (
          <div className="tv-stage">
            <div className="tv-stage-title">Qrup mərhələsi</div>
            <div className="tv-groups">
              {Object.entries(groupTables).map(([letter, rows]) => (
                <div className="tv-group-card" key={letter}>
                  <div className="tv-group-title">GROUP {letter}</div>
                  {rows.map((r, i) => (
                    <div className="tv-group-row" key={r.teamId}>
                      <span className="tv-pos">{i + 1}</span>
                      <TeamLogo team={teamInfo(r.teamId)} size={24} />
                      <span className="tv-team-name">{teamInfo(r.teamId)?.name || '—'}</span>
                      <span className="tv-pts">{r.played > 0 ? `${r.pts} xal` : '—'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {groupMatches.length > 0 && (
              <div className="tv-stage-matches">
                {groupMatches.map((m, i) => (
                  <StageMatch key={i} m={m} teamInfo={teamInfo} nextLabel={null} />
                ))}
              </div>
            )}
          </div>
        )}

        {leagueTable && (
          <div className="tv-stage">
            <div className="tv-stage-title">Liqa</div>
            <div className="tv-groups">
              <div className="tv-group-card tv-league-card">
                <div className="tv-group-title">ÜMUMİ CƏDVƏL</div>
                {leagueTable.map((r, i) => (
                  <div className="tv-group-row" key={r.teamId}>
                    <span className="tv-pos">{i + 1}</span>
                    <TeamLogo team={teamInfo(r.teamId)} size={24} />
                    <span className="tv-team-name">{teamInfo(r.teamId)?.name || '—'}</span>
                    <span className="tv-pts">{r.played > 0 ? `${r.pts} xal` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="tv-stage-matches">
              {matches.map((m, i) => <StageMatch key={i} m={m} teamInfo={teamInfo} nextLabel={null} />)}
            </div>
          </div>
        )}

        {koStages.map((stage) => (
          <div className="tv-stage" key={stage.name}>
            <div className="tv-stage-title">
              {stage.name}
              {stage.matches.length > 1 && (
                <span className="tv-stage-next">→ {roundNameForSize(stage.matches.length)}</span>
              )}
            </div>
            <div className="tv-stage-matches">
              {stage.matches.map((m, i) => (
                <StageMatch
                  key={i}
                  m={m}
                  teamInfo={teamInfo}
                  nextLabel={stage.matches.length === 1 ? 'Çempion' : roundNameForSize(stage.matches.length)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
