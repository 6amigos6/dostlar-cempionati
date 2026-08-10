import React, { useMemo } from 'react'
import { TeamLogo, MatchCard } from '../components.jsx'
import { computeStandings, winnerOf, matchPlayed } from '../lib/logic.js'

function TeamRow({ team, score, win }) {
  return (
    <div className={`tv-team-row ${win ? 'win' : ''}`}>
      <TeamLogo team={team} size={22} />
      <span className="tv-team-name">{team?.name || 'TBD'}</span>
      <span className="tv-score">{score != null ? score : ''}</span>
    </div>
  )
}

function WingMatch({ m, teamInfo }) {
  const played = matchPlayed(m)
  return (
    <div className={`tv-match ${played ? 'played' : ''}`}>
      <TeamRow team={teamInfo(m.teamA)} score={played ? m.scoreA : null} win={played && winnerOf(m) === m.teamA} />
      <TeamRow team={teamInfo(m.teamB)} score={played ? m.scoreB : null} win={played && winnerOf(m) === m.teamB} />
    </div>
  )
}

function SingleCard({ teamId, teamInfo, advance }) {
  const team = teamInfo(teamId)
  return (
    <div className={`tv-match tv-single ${advance ? 'advance' : ''}`}>
      <div className="tv-team-row">
        <TeamLogo team={team} size={22} />
        <span className="tv-team-name">{team?.name || 'TBD'}</span>
        {advance && <span className="tv-adv">↗</span>}
      </div>
    </div>
  )
}

function WingCol({ col, teamInfo }) {
  return (
    <div className="tv-wing-col">
      <div className="tv-round-name">{col.name}</div>
      {col.slots.map((slot, i) => (
        slot.type === 'match'
          ? <WingMatch key={i} m={slot.match} teamInfo={teamInfo} />
          : <SingleCard key={i} teamId={slot.teamId} teamInfo={teamInfo} advance={slot.advance} />
      ))}
    </div>
  )
}

export default function TournamentView({ tournament, teams }) {
  const t = tournament
  const teamInfo = (id) => teams?.[id] || t.teamsInfo?.[id] || null
  const teamName = (id) => teamInfo(id)?.name || 'TBD'
  const matches = Object.values(t.matches || {})
  const groups = t.groups || null

  const koRounds = useMemo(() => {
    const map = {}
    matches.filter((m) => !m.group).forEach((m) => { (map[m.round] = map[m.round] || []).push(m) })
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [t])

  const finalRound = koRounds.length ? koRounds[koRounds.length - 1] : null
  const finalMatch = finalRound?.[1]?.length === 1 ? finalRound[1][0] : null

  const groupTables = useMemo(() => {
    if (!groups) return null
    const out = {}
    Object.entries(groups).forEach(([letter, ids]) => {
      out[letter] = computeStandings(ids, matches.filter((m) => m.group === letter), t.pointsRule)
    })
    return out
  }, [t])

  // Qrup mərhələsi: komandalar canlı cədvələ görə mərhələ-mərhələ kuboka doğru göstərilir
  const groupWings = useMemo(() => {
    if (!groups || !groupTables) return null
    const letters = Object.keys(groups).sort()
    const half = Math.ceil(letters.length / 2)
    const build = (ls) => {
      const cols = []
      ls.forEach((letter) => {
        cols.push({
          name: `${letter} QRUPU`,
          slots: (groupTables[letter] || []).map((r) => ({ type: 'team', teamId: r.teamId, advance: false })),
        })
      })
      if (ls.length > 0) {
        const next = []
        const final = []
        ls.forEach((letter) => {
          const rows = groupTables[letter] || []
          rows.slice(0, 2).forEach((r) => next.push({ type: 'team', teamId: r.teamId, advance: true }))
          if (rows[0]) final.push({ type: 'team', teamId: rows[0].teamId, advance: true })
        })
        cols.push({ name: 'NÖVBƏTİ MƏRHƏLƏ', slots: next })
        cols.push({ name: 'FİNAL', slots: final })
      }
      return cols
    }
    return { left: build(letters.slice(0, half)), right: build(letters.slice(half)) }
  }, [groups, groupTables])

  const isGroupStage = t.format === 'groups' && t.stage === 'groups' && !!groupWings

  // Ümumi qanad sütunları: qrup mərhələsi → vizual proqnoz, əks halda real playoff bracket
  const wings = useMemo(() => {
    if (isGroupStage) return groupWings
    const rounds = koRounds.filter(([, ms]) => ms.length >= 2)
    const left = rounds.map(([name, ms]) => ({
      name,
      slots: ms.slice(0, ms.length / 2).map((m) => ({ type: 'match', match: m })),
    }))
    const right = rounds.map(([name, ms]) => ({
      name,
      slots: ms.slice(ms.length / 2).map((m) => ({ type: 'match', match: m })),
    }))
    if (left.length === 0 && right.length === 0) {
      const all = (t.teamIds || []).map((teamId) => ({ type: 'team', teamId, advance: false }))
      if (all.length === 0) return { left: [], right: [] }
      return { left: [{ name: t.format === 'league' ? 'LİQA' : 'MƏRHƏLƏ', slots: all }], right: [] }
    }
    return { left, right }
  }, [isGroupStage, groupWings, koRounds, t])

  const leagueTable = (!groups && t.format === 'league') ? computeStandings(t.teamIds || [], matches, t.pointsRule) : null
  const stageLabel = t.stage === 'groups' ? 'Qrup mərhələsi' : t.stage === 'knockout' ? 'Playoff' : 'Liqa'
  const champion = t.champion ? teamInfo(t.champion) : null
  const hasWings = wings.left.length > 0

  return (
    <div className="tournament-view">
      <div className="tournament-head">
        <span className="tournament-eyebrow">TOURNAMENT SCHEDULE</span>
        <span className="tournament-name">{t.name}</span>
        <span className="tournament-season">Mövsüm {t.season} · {stageLabel}</span>
      </div>

      {champion && (
        <div className="champion-banner">
          <span className="champion-cup">🏆</span>
          <div className="champion-text">
            <div className="champion-label">ÇEMPİON</div>
            <div className="champion-name">{champion.name}</div>
          </div>
          <TeamLogo team={champion} size={44} />
        </div>
      )}

      <div className="bracket-scroll">
        <div className="tournament-bracket">
          <div className="tv-wing tv-left">
            {hasWings ? wings.left.map((w) => <WingCol key={w.name} col={w} teamInfo={teamInfo} />) : (
              <div className="tv-placeholder">Komandalar<br />gözlənilir</div>
            )}
          </div>

          <div className="tv-center">
            <div className="tv-cup">🏆</div>
            <div className="tv-cup-label">{champion ? 'ÇEMPİON' : stageLabel}</div>
            {champion && <div className="tv-champion">{champion.name}</div>}
            {finalMatch && (
              <div className="tv-final">
                <span className="tv-final-team">{teamName(finalMatch.teamA)}</span>
                <b>{matchPlayed(finalMatch) ? `${finalMatch.scoreA} : ${finalMatch.scoreB}` : 'vs'}</b>
                <span className="tv-final-team">{teamName(finalMatch.teamB)}</span>
              </div>
            )}
          </div>

          <div className="tv-wing tv-right">
            {hasWings ? wings.right.map((w) => <WingCol key={w.name} col={w} teamInfo={teamInfo} />) : null}
          </div>
        </div>
      </div>

      <div className="tv-groups">
        {groupTables && Object.entries(groupTables).map(([letter, rows]) => (
          <div className="tv-group-card" key={letter}>
            <div className="tv-group-title">{letter} QRUPU</div>
            {rows.map((r, i) => {
              const advance = t.stage === 'groups' && i < 2
              return (
                <div className={`tv-group-row ${advance ? 'advance' : ''}`} key={r.teamId}>
                  <span className="tv-pos">{i + 1}</span>
                  <TeamLogo team={teamInfo(r.teamId)} size={24} />
                  <span className="tv-team-name">{teamInfo(r.teamId)?.name || '—'}</span>
                  {advance && <span className="tv-adv">↗</span>}
                  <span className="tv-pts">{r.played > 0 ? r.pts : '—'}</span>
                  <span className="tv-rec">{r.played > 0 ? `${r.played} oyun · ${r.won}Q ${r.drawn}H ${r.lost}M` : '—'}</span>
                </div>
              )
            })}
          </div>
        ))}
        {leagueTable && (
          <div className="tv-group-card tv-league-card">
            <div className="tv-group-title">ÜMUMİ CƏDVƏL</div>
            {leagueTable.map((r, i) => (
              <div className={`tv-group-row ${i === 0 ? 'advance' : ''}`} key={r.teamId}>
                <span className="tv-pos">{i + 1}</span>
                <TeamLogo team={teamInfo(r.teamId)} size={24} />
                <span className="tv-team-name">{teamInfo(r.teamId)?.name || '—'}</span>
                <span className="tv-pts">{r.played > 0 ? r.pts : '—'}</span>
                <span className="tv-rec">{r.played > 0 ? `${r.played} oyun · ${r.won}Q ${r.drawn}H ${r.lost}M` : '—'}</span>
              </div>
            ))}
          </div>
        )}
        {!groupTables && !leagueTable && t.format === 'knockout' && (
          <div className="tv-group-card tv-league-card">
            <div className="tv-group-title">QARŞILAŞMALAR</div>
            <div className="stack-8">
              {koRounds.flatMap(([, ms]) => ms).map((m, i) => <MatchCard key={i} match={m} teams={teams} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
