import React, { useMemo } from 'react'
import { TeamLogo, MatchCard } from '../components.jsx'
import {
  computeStandings, winnerOf, matchPlayed, roundNameForSize,
  largestPowerOfTwoLeq, buildKnockoutFromGroups,
} from '../lib/logic.js'

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

  // Qrup mərhələsi zamanı: cari cədvələ görə playoff "proqnozu" — tam vizual bracket
  const projected = useMemo(() => {
    if (!groups || !groupTables) return null
    const qf = buildKnockoutFromGroups({ ...t, stage: 'knockout' })
    if (qf.length < 1) return null
    const rankPos = (id) => {
      for (const rows of Object.values(groupTables)) {
        const i = rows.findIndex((r) => r.teamId === id)
        if (i >= 0) return i + 1
      }
      return 99
    }
    const better = (a, b) => (rankPos(a) <= rankPos(b) ? a : b)
    const pair = (ids) => {
      const ms = []
      for (let i = 0; i < ids.length; i += 2) {
        ms.push({ teamA: ids[i], teamB: ids[i + 1], round: roundNameForSize(ids.length), scoreA: null, scoreB: null })
      }
      return ms
    }
    const qfWinners = qf.map((m) => better(m.teamA, m.teamB))
    const sf = pair(qfWinners)
    const sfWinners = sf.map((m) => better(m.teamA, m.teamB))
    const fin = pair(sfWinners)
    return { qf, sf, fin }
  }, [groups, groupTables, t])

  const isGroupStage = t.format === 'groups' && t.stage === 'groups' && !!projected

  // Ümumi qanad sütunları: qrup mərhələsi → proqnoz, əks halda real playoff bracket
  const wings = useMemo(() => {
    if (isGroupStage && projected) {
      const half = Math.ceil(projected.qf.length / 2)
      const sfHalf = Math.ceil(projected.sf.length / 2)
      const qfName = roundNameForSize(projected.qf.length * 2)
      const sfName = roundNameForSize(projected.sf.length * 2)
      const left = [
        { name: qfName, slots: projected.qf.slice(0, half).map((m) => ({ type: 'match', match: m })) },
        ...(projected.sf.length ? [{ name: sfName, slots: projected.sf.slice(0, sfHalf).map((m) => ({ type: 'match', match: m })) }] : []),
      ]
      const right = [
        { name: qfName, slots: projected.qf.slice(half).map((m) => ({ type: 'match', match: m })) },
        ...(projected.sf.length ? [{ name: sfName, slots: projected.sf.slice(sfHalf).map((m) => ({ type: 'match', match: m })) }] : []),
      ]
      return { left, right }
    }
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
  }, [isGroupStage, projected, koRounds, t])

  const leagueTable = (!groups && t.format === 'league') ? computeStandings(t.teamIds || [], matches, t.pointsRule) : null
  const stageLabel = t.stage === 'groups' ? 'Qrup mərhələsi' : t.stage === 'knockout' ? 'Playoff' : 'Liqa'
  const champion = t.champion ? teamInfo(t.champion) : null
  const hasWings = wings.left.length > 0
  const centerFinal = isGroupStage ? projected?.fin?.[0] : finalMatch

  // Mərhələ yolu: Qrup → Playoff mərhələləri → Çempion
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
    const cur = koRounds.find(([, ms]) => ms.some((m) => !matchPlayed(m)))
    const i = cur ? roadmap.indexOf(cur[0]) : -1
    return i >= 0 ? i : Math.max(0, roadmap.length - 2)
  }, [champion, t, koRounds, roadmap])

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
              {i === roadmap.length - 1 ? '🏆 ' : ''}{r}
            </span>
            {i < roadmap.length - 1 && <span className="roadmap-arrow">›</span>}
          </div>
        ))}
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
            {centerFinal && (
              <div className="tv-final">
                <span className="tv-final-team">{teamName(centerFinal.teamA)}</span>
                <b>{matchPlayed(centerFinal) ? `${centerFinal.scoreA} : ${centerFinal.scoreB}` : 'vs'}</b>
                <span className="tv-final-team">{teamName(centerFinal.teamB)}</span>
              </div>
            )}
          </div>

          <div className="tv-wing tv-right">
            {hasWings ? wings.right.map((w) => <WingCol key={w.name} col={w} teamInfo={teamInfo} />) : null}
          </div>
        </div>
      </div>

      {isGroupStage && <div className="tv-note">Playoff proqnozu — qrup nəticələrinə görə avtomatik yenilənir</div>}

      <div className="tv-groups">
        {groupTables && Object.entries(groupTables).map(([letter, rows]) => (
          <div className="tv-group-card" key={letter}>
            <div className="tv-group-title">GROUP {letter}</div>
            {rows.map((r, i) => (
              <div className="tv-group-row" key={r.teamId}>
                <span className="tv-pos">{i + 1}</span>
                <TeamLogo team={teamInfo(r.teamId)} size={24} />
                <span className="tv-team-name">{teamInfo(r.teamId)?.name || '—'}</span>
                <span className="tv-rec">{r.played > 0 ? `${r.played} oyun` : '—'}</span>
                <span className="tv-pts">{r.played > 0 ? r.pts : '—'}</span>
              </div>
            ))}
          </div>
        ))}
        {leagueTable && (
          <div className="tv-group-card tv-league-card">
            <div className="tv-group-title">ÜMUMİ CƏDVƏL</div>
            {leagueTable.map((r, i) => (
              <div className="tv-group-row" key={r.teamId}>
                <span className="tv-pos">{i + 1}</span>
                <TeamLogo team={teamInfo(r.teamId)} size={24} />
                <span className="tv-team-name">{teamInfo(r.teamId)?.name || '—'}</span>
                <span className="tv-rec">{r.played > 0 ? `${r.played} oyun` : '—'}</span>
                <span className="tv-pts">{r.played > 0 ? r.pts : '—'}</span>
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
