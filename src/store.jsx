import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { db } from './firebase'
import { ref, onValue, set, update, remove } from 'firebase/database'
import {
  generatePlayoffRound, generateRoundRobin, buildNextRound, computeStandings, uid,
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
  const [players, playersLoaded] = useCollection('players')
  const [teams, teamsLoaded] = useCollection('teams')
  const [tournaments, tournamentsLoaded] = useCollection('tournaments')
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

  const loading = !playersLoaded || !teamsLoaded || !tournamentsLoaded || !settingsLoaded

  const activeTournamentId = settings.activeTournamentId || null
  const activeTournament = activeTournamentId ? { id: activeTournamentId, ...tournaments[activeTournamentId] } : null

  const teamList = useMemo(() => Object.entries(teams).map(([id, t]) => ({ id, ...t })), [teams])
  const playerList = useMemo(() => Object.entries(players).map(([id, p]) => ({ id, ...p })), [players])
  const tournamentList = useMemo(() => Object.entries(tournaments).map(([id, t]) => ({ id, ...t })), [tournaments])

  // ---------- Players ----------
  const addPlayer = useCallback((data) => {
    const id = uid('player')
    return set(ref(db, `players/${id}`), {
      ...data, gamesPlayed: 0, wins: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, mvpCount: 0, createdAt: Date.now(),
    })
  }, [])
  const updatePlayer = useCallback((id, data) => update(ref(db, `players/${id}`), data), [])
  const deletePlayer = useCallback((id) => remove(ref(db, `players/${id}`)), [])

  // ---------- Teams ----------
  const addTeam = useCallback((data) => {
    const id = uid('team')
    return set(ref(db, `teams/${id}`), {
      ...data, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0, championships: [], createdAt: Date.now(),
    })
  }, [])
  const updateTeam = useCallback((id, data) => update(ref(db, `teams/${id}`), data), [])
  const deleteTeam = useCallback((id) => remove(ref(db, `teams/${id}`)), [])

  // ---------- Tournaments ----------
  const createTournament = useCallback(async (data) => {
    const id = uid('tour')
    const tour = {
      name: data.name,
      season: data.season || new Date().getFullYear(),
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      format: data.format, // 'knockout' | 'groups' | 'league'
      hasThirdPlace: !!data.hasThirdPlace,
      seeded: !!data.seeded,
      matchDuration: data.matchDuration || 90,
      pointsRule: { win: 3, draw: 1, loss: 0 },
      teamIds: data.teamIds || [],
      status: 'DRAFT',
      matches: {},
      champion: null,
      finalMvp: null,
      createdAt: Date.now(),
    }
    await set(ref(db, `tournaments/${id}`), tour)
    return id
  }, [])

  const setActiveTournament = useCallback((id) => set(ref(db, 'settings/activeTournamentId'), id), [])
  const deleteTournament = useCallback(async (id) => {
    await Promise.all([
      remove(ref(db, `tournaments/${id}`)),
      set(ref(db, 'settings/activeTournamentId'), null),
    ])
  }, [])
  const updateTournament = useCallback((id, data) => update(ref(db, `tournaments/${id}`), data), [])

  // Draw / bracket generation, ya da liqa cədvəli
  const generateDraw = useCallback(async (tournamentId) => {
    const t = tournaments[tournamentId]
    if (!t) return
    let matches = []
    if (t.format === 'league') {
      matches = generateRoundRobin(t.teamIds)
    } else {
      // knockout (qrupsuz birbaşa playoff). Qrup dəstəyi: qrup mərhələsi round-robin, sonra playoff manual.
      matches = generatePlayoffRound(t.teamIds, { seeded: t.seeded })
    }
    const matchesObj = {}
    matches.forEach((m) => { matchesObj[uid('m')] = { ...m, id: undefined } })
    await update(ref(db, `tournaments/${tournamentId}`), { matches: matchesObj, status: 'ACTIVE' })
  }, [tournaments])

  // Tək çempionat modeli: yeni çempionat yaradır, püşkatmanı çəkir və aktiv edir
  const startChampionship = useCallback(async (teamIds, format) => {
    const id = uid('tour')
    const matches = format === 'league' ? generateRoundRobin(teamIds) : generatePlayoffRound(teamIds, { seeded: false })
    const matchesObj = {}
    matches.forEach((m) => { matchesObj[uid('m')] = { ...m } })
    const tour = {
      name: 'Çempionlar Liqası',
      season: new Date().getFullYear(),
      format,
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

  // Nəticə daxil et / redaktə et
  const recordResult = useCallback(async (tournamentId, matchId, result) => {
    const path = `tournaments/${tournamentId}/matches/${matchId}`
    await update(ref(db, path), { ...result, status: 'FINISHED', playedAt: result.playedAt || Date.now() })
    // Komanda statistikasını yenilə
    const t = tournaments[tournamentId]
    const m = t?.matches?.[matchId]
    if (m) {
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
    }
    notify('Nəticə yadda saxlanıldı')
  }, [tournaments, teams, notify])

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

  // Cari (bitmiş) mərhələdən növbəti playoff mərhələsini avtomatik yarat
  const advanceRound = useCallback(async (tournamentId, roundName) => {
    const t = tournaments[tournamentId]
    if (!t?.matches) return
    const roundMatches = Object.values(t.matches).filter((m) => m.round === roundName)
    if (roundMatches.some((m) => m.status !== 'FINISHED')) {
      notify('Bu mərhələnin bütün oyunları bitməyib')
      return
    }
    const { matches: nextMatches, champion } = buildNextRound(roundMatches)
    if (champion) {
      await update(ref(db, `tournaments/${tournamentId}`), { champion, status: 'FINISHED', finishedAt: Date.now() })
      notify('Çempion müəyyənləşdi! 🏆')
      return
    }
    const newObj = {}
    nextMatches.forEach((m) => { newObj[uid('m')] = m })
    await update(ref(db, `tournaments/${tournamentId}/matches`), newObj)
    notify('Növbəti mərhələ formalaşdı')
  }, [tournaments, notify])

  const value = {
    players, playerList, teams, teamList, tournaments, tournamentList,
    activeTournament, activeTournamentId, loading, theme, toggleTheme, notify, toast,
    addPlayer, updatePlayer, deletePlayer, addTeam, updateTeam, deleteTeam,
    createTournament, setActiveTournament, deleteTournament, updateTournament, generateDraw, startChampionship,
    recordResult, setMatchLive, updateMatch, deleteMatch, addMatch, advanceRound,
    computeStandings,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
