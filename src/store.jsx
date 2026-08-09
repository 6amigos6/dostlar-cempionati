import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { db } from './firebase'
import { ref, onValue, set, update, remove } from 'firebase/database'
import {
  generatePlayoffRound, generateRoundRobin, generateGroupMatches, splitIntoGroups,
  buildKnockoutFromGroups, buildNextRound, computeStandings, uid,
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
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const notify = useCallback((msg) => setToast(msg), [])
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  const loading = !teamsLoaded || !tournamentsLoaded || !archiveLoaded || !settingsLoaded

  const activeTournamentId = settings.activeTournamentId || null
  const activeTournament = activeTournamentId ? { id: activeTournamentId, ...tournaments[activeTournamentId] } : null

  const teamList = useMemo(() => Object.entries(teams).map(([id, t]) => ({ id, ...t })), [teams])
  const tournamentList = useMemo(() => Object.entries(tournaments).map(([id, t]) => ({ id, ...t })), [tournaments])
  const archiveList = useMemo(() => Object.entries(archive)
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => (b.archivedAt || b.finishedAt || 0) - (a.archivedAt || a.finishedAt || 0)), [archive])

  // ---------- Teams ----------
  const addTeam = useCallback((data) => {
    const id = uid('team')
    return set(ref(db, `teams/${id}`), {
      ...data, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0, createdAt: Date.now(),
    })
  }, [])
  const updateTeam = useCallback((id, data) => update(ref(db, `teams/${id}`), data), [])
  const deleteTeam = useCallback((id) => remove(ref(db, `teams/${id}`)), [])

  // ---------- Çempionat ----------
  const setActiveTournament = useCallback((id) => set(ref(db, 'settings/activeTournamentId'), id), [])
  const deleteTournament = useCallback(async (id) => {
    await Promise.all([
      remove(ref(db, `tournaments/${id}`)),
      set(ref(db, 'settings/activeTournamentId'), null),
    ])
  }, [])
  const updateTournament = useCallback((id, data) => update(ref(db, `tournaments/${id}`), data), [])

  // Püşkatma: qrup mərhələsi və ya birbaşa playoff / liqa cədvəli
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
      matches = generatePlayoffRound(t.teamIds, { seeded: t.seeded })
    }
    const matchesObj = {}
    matches.forEach((m) => { matchesObj[uid('m')] = { ...m, id: undefined } })
    await update(ref(db, `tournaments/${tournamentId}`), {
      matches: matchesObj, groups, stage: t.format === 'groups' ? 'groups' : 'knockout',
      champion: null, status: 'ACTIVE',
    })
  }, [tournaments])

  // Yeni çempionat yaradır, püşkatmanı çəkir və aktiv edir
  const startChampionship = useCallback(async (teamIds, format) => {
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
      hasThirdPlace: false,
      seeded: false,
      matchDuration: 90,
      pointsRule: { win: 3, draw: 1, loss: 0 },
      teamIds,
      status: 'ACTIVE',
      matches: matchesObj,
      champion: null,
      finalMvp: null,
      createdAt: Date.now(),
    }
    await Promise.all([
      set(ref(db, `tournaments/${id}`), tour),
      set(ref(db, 'settings/activeTournamentId'), id),
    ])
    return id
  }, [])

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
      groupStandings[letter] = computeStandings(ids, matches, t.pointsRule)
    })
    const teamsInfo = {}
    t.teamIds.forEach((id) => {
      const tm = teams[id]
      if (tm) teamsInfo[id] = { name: tm.name, color: tm.color, logoUrl: tm.logoUrl || null }
    })
    const entry = {
      ...t,
      champion,
      status: 'FINISHED',
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
    notify(`🏆 ${teams[champion]?.name || 'Komanda'} kuboku qazandı!`)
  }, [teams, notify])

  // Playoff mərhələsi bitdikdə növbəti raundu avtomatik qurur
  const maybeAdvanceKnockout = useCallback(async (tournamentId, t, matches) => {
    const ko = Object.values(matches).filter((m) => !m.group)
    if (ko.length === 0) return
    const byRound = {}
    ko.forEach((m) => { (byRound[m.round] = byRound[m.round] || []).push(m) })
    const roundName = Object.keys(byRound).sort((a, b) => byRound[b].length - byRound[a].length)[0]
    const current = byRound[roundName] || []
    if (current.length === 0 || current.some((m) => m.status !== 'FINISHED')) return
    const { matches: nextMatches, champion } = buildNextRound(current)
    if (champion) {
      await finalizeTournament(tournamentId, { ...t, matches }, champion)
    } else if (nextMatches.length > 0) {
      await addMatchesToTournament(tournamentId, nextMatches)
      notify('Növbəti mərhələ formalaşdı')
    }
  }, [finalizeTournament, addMatchesToTournament, notify])

  // Nəticə daxil et — mərhələlər və çempion avtomatik formalaşır
  const recordResult = useCallback(async (tournamentId, matchId, result) => {
    const path = `tournaments/${tournamentId}/matches/${matchId}`
    await update(ref(db, path), { ...result, status: 'FINISHED', playedAt: result.playedAt || Date.now() })
    const t = tournaments[tournamentId]
    const m = t?.matches?.[matchId]
    if (!t || !m) return
    // Komanda statistikasını yenilə
    const teamA = teams[m.teamA]
    const teamB = teams[m.teamB]
    if (teamA) {
      const won = result.scoreA > result.scoreB ? 1 : 0
      const lost = result.scoreA < result.scoreB ? 1 : 0
      const drawn = result.scoreA === result.scoreB ? 1 : 0
      await update(ref(db, `teams/${m.teamA}`), {
        played: (teamA.played || 0) + 1, won: (teamA.won || 0) + won, lost: (teamA.lost || 0) + lost,
        drawn: (teamA.drawn || 0) + drawn, gf: (teamA.gf || 0) + result.scoreA, ga: (teamA.ga || 0) + result.scoreB,
      })
    }
    if (teamB) {
      const won = result.scoreB > result.scoreA ? 1 : 0
      const lost = result.scoreB < result.scoreA ? 1 : 0
      const drawn = result.scoreA === result.scoreB ? 1 : 0
      await update(ref(db, `teams/${m.teamB}`), {
        played: (teamB.played || 0) + 1, won: (teamB.won || 0) + won, lost: (teamB.lost || 0) + lost,
        drawn: (teamB.drawn || 0) + drawn, gf: (teamB.gf || 0) + result.scoreB, ga: (teamB.ga || 0) + result.scoreA,
      })
    }

    const patched = { ...t.matches }
    patched[matchId] = { ...m, ...result, status: 'FINISHED' }

    // Qrup mərhələsi bitdikdə playoff avtomatik qurulur
    if (t.format === 'groups' && t.stage === 'groups') {
      const groupMatches = Object.values(patched).filter((mm) => mm.group)
      if (groupMatches.length > 0 && groupMatches.every((mm) => mm.status === 'FINISHED')) {
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
      if (allMatches.length > 0 && allMatches.every((mm) => mm.status === 'FINISHED')) {
        const table = computeStandings(t.teamIds, allMatches, t.pointsRule)
        await finalizeTournament(tournamentId, { ...t, matches: patched }, table[0]?.teamId)
        return
      }
    }
    notify('Nəticə yadda saxlanıldı')
  }, [tournaments, teams, addMatchesToTournament, maybeAdvanceKnockout, finalizeTournament, notify])

  const setMatchLive = useCallback((tournamentId, matchId, isLive) => update(
    ref(db, `tournaments/${tournamentId}/matches/${matchId}`),
    { status: isLive ? 'LIVE' : 'UPCOMING', liveStartedAt: isLive ? Date.now() : null },
  ), [])

  const updateMatch = useCallback((tournamentId, matchId, data) => update(
    ref(db, `tournaments/${tournamentId}/matches/${matchId}`), data,
  ), [])

  const deleteMatch = useCallback((tournamentId, matchId) => remove(
    ref(db, `tournaments/${tournamentId}/matches/${matchId}`),
  ), [])

  const addMatch = useCallback((tournamentId, data) => set(
    ref(db, `tournaments/${tournamentId}/matches/${uid('m')}`),
    { status: 'UPCOMING', scoreA: null, scoreB: null, ...data },
  ), [])

  // ---------- Arxiv ----------
  const deleteArchivedTournament = useCallback((id) => remove(ref(db, `archive/${id}`)), [])

  const value = {
    teams, teamList, tournaments, tournamentList, archive, archiveList,
    activeTournament, activeTournamentId, loading, theme, toggleTheme, notify, toast,
    addTeam, updateTeam, deleteTeam,
    setActiveTournament, deleteTournament, updateTournament, generateDraw, startChampionship,
    recordResult, setMatchLive, updateMatch, deleteMatch, addMatch,
    deleteArchivedTournament, computeStandings,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
