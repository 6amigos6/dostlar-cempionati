import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { db } from './firebase'
import { ref, onValue, set, update, remove } from 'firebase/database'
import {
  generatePlayoffRound, generateRoundRobin, generateGroupMatches, splitIntoGroups,
  buildKnockoutFromGroups, buildNextRound, computeStandings, matchPlayed, uid,
} from './lib/logic'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

function useCollection(path) {
  const [data, setData] = useState({})
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const r = ref(db, path)
    const unsub = onValue(r, (snap) => {
      setData(snap.val() || {})
      setLoaded(true)
    }, () => setLoaded(true))
    return () => unsub()
  }, [path])
  return [data, loaded]
}

export function AppProvider({ children }) {
  const [teams, teamsLoaded] = useCollection('teams')
  const [tournaments, tournamentsLoaded] = useCollection('tournaments')
  const [archive, archiveLoaded] = useCollection('archive')
  const [settings, settingsLoaded] = useCollection('settings')
  const [toast, setToast] = useState(null)

  useEffect(() => { document.documentElement.setAttribute('data-theme', 'dark') }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const notify = useCallback((msg) => setToast(msg), [])

  const loading = !teamsLoaded || !tournamentsLoaded || !archiveLoaded || !settingsLoaded

  const activeTournamentId = settings.activeTournamentId || null
  const activeTournament = activeTournamentId ? { id: activeTournamentId, ...tournaments[activeTournamentId] } : null

  const teamList = useMemo(() => Object.entries(teams).map(([id, t]) => ({ id, ...t })), [teams])
  const archiveList = useMemo(() => Object.entries(archive)
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => (b.archivedAt || b.finishedAt || 0) - (a.archivedAt || a.finishedAt || 0)), [archive])

  // ---------- Teams ----------
  const addTeam = useCallback((data) => {
    const id = uid('team')
    // Hesablanan sahələr default olaraq yazılmır — real nəticə daxil ediləndə hesablanır
    return set(ref(db, `teams/${id}`), { ...data, createdAt: Date.now() })
  }, [])
  const updateTeam = useCallback((id, data) => update(ref(db, `teams/${id}`), data), [])
  const deleteTeam = useCallback((id) => remove(ref(db, `teams/${id}`)), [])

  // Komandanın statistikasını bütün oyunlardan yenidən hesablayır.
  // Oyun yoxdursa sahələr null (—) qalır, 0 ilə doldurulmur.
  const recomputeTeamStats = useCallback(async (teamId, override = {}, excludeId = null) => {
    const matches = []
    Object.entries({ ...tournaments, ...archive }).forEach(([id, t]) => {
      if (!t || !t.matches || id === excludeId) return
      const ms = override.tournamentId === id ? override.matches : Object.values(t.matches)
      ms.forEach((m) => {
        if (matchPlayed(m) && (m.teamA === teamId || m.teamB === teamId)) matches.push(m)
      })
    })
    if (matches.length === 0) {
      await update(ref(db, `teams/${teamId}`), {
        played: null, won: null, drawn: null, lost: null, gf: null, ga: null, pts: null,
      })
      return
    }
    const stats = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 }
    matches.forEach((m) => {
      const isA = m.teamA === teamId
      const gf = isA ? m.scoreA : m.scoreB
      const ga = isA ? m.scoreB : m.scoreA
      stats.played += 1
      stats.gf += gf
      stats.ga += ga
      const win = isA ? m.scoreA > m.scoreB : m.scoreB > m.scoreA
      const loss = isA ? m.scoreA < m.scoreB : m.scoreB < m.scoreA
      if (win) stats.won += 1
      else if (loss) stats.lost += 1
      else stats.drawn += 1
    })
    await update(ref(db, `teams/${teamId}`), {
      played: stats.played, won: stats.won, drawn: stats.drawn, lost: stats.lost,
      gf: stats.gf, ga: stats.ga, pts: stats.won * 3 + stats.drawn,
    })
  }, [tournaments, archive])

  // ---------- Çempionat ----------
  const generateDraw = useCallback(async (tournamentId) => {
    const t = tournaments[tournamentId]
    if (!t) return
    let matches = []
    let groups = null
    if (t.format === 'groups') {
      groups = splitIntoGroups(t.teamIds)
      matches = generateGroupMatches(groups)
    } else if (t.format === 'league') {
      matches = generateRoundRobin(t.teamIds)
    } else {
      matches = generatePlayoffRound(t.teamIds, { seeded: false })
    }
    const matchesObj = {}
    matches.forEach((m) => { matchesObj[uid('m')] = { ...m, id: undefined } })
    await update(ref(db, `tournaments/${tournamentId}`), {
      matches: matchesObj, groups, stage: t.format === 'groups' ? 'groups' : t.format === 'league' ? 'league' : 'knockout',
      champion: null,
    })
  }, [tournaments])

  // Yeni çempionat yaradır, püşkatmanı çəkir və aktiv edir.
  // Aktiv köhnə turnir varsa bütün məlumatı ilə avtomatik ARXİV-ə köçürülür.
  const startChampionship = useCallback(async (teamIds, format) => {
    const prevId = activeTournamentId
    const prev = prevId ? tournaments[prevId] : null
    if (prev && (prev.teamIds?.length || Object.keys(prev.matches || {}).length)) {
      const now = Date.now()
      const prevMatches = Object.values(prev.matches || {})
      const groupStandings = {}
      Object.entries(prev.groups || {}).forEach(([letter, ids]) => {
        groupStandings[letter] = computeStandings(ids, prevMatches.filter((m) => m.group === letter), prev.pointsRule)
      })
      const teamsInfo = {}
      prev.teamIds.forEach((id) => {
        const tm = teams[id]
        if (tm) teamsInfo[id] = { name: tm.name, logoUrl: tm.logoUrl || null }
      })
      const entry = { ...prev, finishedAt: prev.finishedAt || now, archivedAt: now, groupStandings, teamsInfo }
      await Promise.all([
        set(ref(db, `archive/${prevId}`), entry),
        remove(ref(db, `tournaments/${prevId}`)),
      ])
    }
    const id = uid('tour')
    const groups = format === 'groups' ? splitIntoGroups(teamIds) : null
    const matches = format === 'groups'
      ? generateGroupMatches(groups)
      : format === 'league'
        ? generateRoundRobin(teamIds)
        : generatePlayoffRound(teamIds, { seeded: false })
    const matchesObj = {}
    matches.forEach((m) => { matchesObj[uid('m')] = { ...m } })
    const tour = {
      name: 'Çempionlar Liqası',
      season: new Date().getFullYear(),
      format, // 'groups' | 'knockout' | 'league'
      groups,
      stage: format === 'groups' ? 'groups' : format === 'league' ? 'league' : 'knockout',
      pointsRule: { win: 3, draw: 1, loss: 0 },
      teamIds,
      matches: matchesObj,
      champion: null,
      createdAt: Date.now(),
    }
    await Promise.all([
      set(ref(db, `tournaments/${id}`), tour),
      set(ref(db, 'settings/activeTournamentId'), id),
    ])
    return id
  }, [activeTournamentId, tournaments, teams, computeStandings])

  const addMatchesToTournament = useCallback(async (tournamentId, matches) => {
    const obj = {}
    matches.forEach((m) => { obj[uid('m')] = { ...m } })
    await update(ref(db, `tournaments/${tournamentId}/matches`), obj)
  }, [])

  // Çempion müəyyənləşəndə turniri tam məlumatla arxivə köçürür
  const finalizeTournament = useCallback(async (tournamentId, t, champion) => {
    const now = Date.now()
    const matches = Object.values(t.matches || {})
    const groupStandings = {}
    Object.entries(t.groups || {}).forEach(([letter, ids]) => {
      groupStandings[letter] = computeStandings(ids, matches.filter((m) => m.group === letter), t.pointsRule)
    })
    const teamsInfo = {}
    t.teamIds.forEach((id) => {
      const tm = teams[id]
      if (tm) teamsInfo[id] = { name: tm.name, logoUrl: tm.logoUrl || null }
    })
    const entry = {
      ...t,
      champion,
      finishedAt: now,
      archivedAt: now,
      groupStandings,
      teamsInfo,
    }
    await Promise.all([
      set(ref(db, `archive/${tournamentId}`), entry),
      remove(ref(db, `tournaments/${tournamentId}`)),
      set(ref(db, 'settings/activeTournamentId'), null),
    ])
    notify(`${teams[champion]?.name || 'Komanda'} çempion oldu!`)
  }, [teams, notify])

  // Playoff mərhələsi bitdikdə növbəti raundu avtomatik qurur
  const maybeAdvanceKnockout = useCallback(async (tournamentId, t, matches) => {
    const ko = Object.values(matches).filter((m) => !m.group)
    if (ko.length === 0) return
    const byRound = {}
    ko.forEach((m) => { (byRound[m.round] = byRound[m.round] || []).push(m) })
    const roundName = Object.keys(byRound).sort((a, b) => byRound[b].length - byRound[a].length)[0]
    const current = byRound[roundName] || []
    if (current.length === 0 || current.some((m) => !matchPlayed(m))) return
    const { matches: nextMatches, champion } = buildNextRound(current)
    if (champion) {
      await finalizeTournament(tournamentId, { ...t, matches }, champion)
    } else if (nextMatches.length > 0) {
      await addMatchesToTournament(tournamentId, nextMatches)
      notify('Növbəti mərhələ formalaşdı')
    }
  }, [finalizeTournament, addMatchesToTournament, notify])

  // Nəticə daxil et — xal, cədvəl və mərhələlər avtomatik yenilənir
  const recordResult = useCallback(async (tournamentId, matchId, result) => {
    const path = `tournaments/${tournamentId}/matches/${matchId}`
    await update(ref(db, path), { ...result, playedAt: result.playedAt || Date.now() })
    const t = tournaments[tournamentId]
    const m = t?.matches?.[matchId]
    if (!t || !m) return

    const patched = { ...t.matches }
    patched[matchId] = { ...m, ...result }
    const patchedList = Object.values(patched)

    // Komanda statistikasını bütün oyunlardan yenidən hesabla (0 default qalmır)
    await Promise.all([
      recomputeTeamStats(m.teamA, { tournamentId, matches: patchedList }),
      recomputeTeamStats(m.teamB, { tournamentId, matches: patchedList }),
    ])

    // Qrup mərhələsi bitdikdə playoff avtomatik qurulur
    if (t.format === 'groups' && t.stage === 'groups') {
      const groupMatches = Object.values(patched).filter((mm) => mm.group)
      if (groupMatches.length > 0 && groupMatches.every(matchPlayed)) {
        const koMatches = buildKnockoutFromGroups({ ...t, matches: patched })
        await update(ref(db, `tournaments/${tournamentId}`), { stage: 'knockout' })
        await addMatchesToTournament(tournamentId, koMatches)
        notify('Qrup mərhələsi bitdi — Playoff formalaşdı! 🎉')
        return
      }
    }
    // Playoff raundu avtomatik irəliləyir
    if ((t.format === 'groups' && t.stage === 'knockout') || t.format === 'knockout') {
      await maybeAdvanceKnockout(tournamentId, t, patched)
      return
    }
    // Liqa formatında bütün oyunlar bitəndə çempion müəyyənləşir
    if (t.format === 'league') {
      const allMatches = Object.values(patched)
      if (allMatches.length > 0 && allMatches.every(matchPlayed)) {
        const table = computeStandings(t.teamIds, allMatches, t.pointsRule)
        await finalizeTournament(tournamentId, { ...t, matches: patched }, table[0]?.teamId)
        return
      }
    }
    notify('Nəticə yadda saxlanıldı')
  }, [tournaments, recomputeTeamStats, addMatchesToTournament, maybeAdvanceKnockout, finalizeTournament, notify])

  // Tək qarşılaşmanın nəticəsini sıfırlayır (statistika yenidən hesablanır)
  const resetMatch = useCallback(async (tournamentId, matchId) => {
    const t = tournaments[tournamentId]
    const m = t?.matches?.[matchId]
    const cleared = { scoreA: null, scoreB: null, penA: null, penB: null, playedAt: null }
    await update(ref(db, `tournaments/${tournamentId}/matches/${matchId}`), cleared)
    if (!t || !m) return
    const patched = { ...t.matches, [matchId]: { ...m, ...cleared } }
    await Promise.all([
      recomputeTeamStats(m.teamA, { tournamentId, matches: Object.values(patched) }),
      recomputeTeamStats(m.teamB, { tournamentId, matches: Object.values(patched) }),
    ])
    notify('Nəticə sıfırlandı')
  }, [tournaments, recomputeTeamStats, notify])

  // Bütün nəticələri sıfırlayır; qrup formatında playoff silinib qrup mərhələsinə qayıdır
  const resetAllResults = useCallback(async (tournamentId) => {
    const t = tournaments[tournamentId]
    if (!t) return
    let finalMatches = []
    if (t.format === 'groups' && t.stage === 'knockout') {
      finalMatches = Object.values(t.matches || {})
        .filter((m) => m.group)
        .map((m) => ({ ...m, scoreA: null, scoreB: null, penA: null, penB: null, playedAt: null }))
      const matchesObj = {}
      finalMatches.forEach((m) => { matchesObj[uid('m')] = { ...m } })
      await update(ref(db, `tournaments/${tournamentId}`), { stage: 'groups', matches: matchesObj, champion: null })
    } else {
      finalMatches = Object.values(t.matches || {})
        .map((m) => ({ ...m, scoreA: null, scoreB: null, penA: null, penB: null, playedAt: null }))
      const scoresReset = {}
      Object.entries(t.matches || {}).forEach(([id, m]) => {
        scoresReset[`${id}/scoreA`] = null
        scoresReset[`${id}/scoreB`] = null
        scoresReset[`${id}/penA`] = null
        scoresReset[`${id}/penB`] = null
        scoresReset[`${id}/playedAt`] = null
      })
      await update(ref(db, `tournaments/${tournamentId}/matches`), scoresReset)
    }
    ;(t.teamIds || []).forEach((teamId) => recomputeTeamStats(teamId, { tournamentId, matches: finalMatches }))
    notify('Bütün nəticələr sıfırlandı')
  }, [tournaments, recomputeTeamStats, notify])

  // "Turniri bitir" — çempion müəyyənləşibsə turniri arxivə köçürür
  const finishTournament = useCallback(async (tournamentId) => {
    const t = tournaments[tournamentId]
    if (!t) return
    if (t.champion) {
      await finalizeTournament(tournamentId, t, t.champion)
      return
    }
    notify('Çempion hələ müəyyənləşməyib — final oyununun nəticəsini daxil edin.')
  }, [tournaments, finalizeTournament, notify])

  // Aktiv turniri tamamilə silir (statistika yenidən hesablanır)
  const deleteTournament = useCallback(async (tournamentId) => {
    const t = tournaments[tournamentId]
    const ids = t?.teamIds || []
    await Promise.all([
      remove(ref(db, `tournaments/${tournamentId}`)),
      set(ref(db, 'settings/activeTournamentId'), null),
    ])
    ids.forEach((teamId) => recomputeTeamStats(teamId, {}, tournamentId))
    notify('Turnir silindi')
  }, [tournaments, recomputeTeamStats, notify])

  // ---------- Arxiv ----------
  const deleteArchivedTournament = useCallback(async (id) => {
    const t = archive[id]
    const ids = t?.teamIds || []
    await remove(ref(db, `archive/${id}`))
    ids.forEach((teamId) => recomputeTeamStats(teamId, {}, id))
    notify('Turnir tarixçədən silindi')
  }, [archive, recomputeTeamStats, notify])

  const value = {
    teams, teamList, archive, archiveList,
    activeTournament, activeTournamentId, loading, notify, toast,
    addTeam, updateTeam, deleteTeam,
    generateDraw, startChampionship, recordResult, resetMatch, resetAllResults, finishTournament, deleteTournament,
    deleteArchivedTournament, computeStandings,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
