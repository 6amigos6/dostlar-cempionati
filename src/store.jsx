import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { db, auth } from './firebase'
import { ref, onValue, push, set, update, remove } from 'firebase/database'
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth'
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
  const [archive] = useCollection('archive')
  const [settings, settingsLoaded] = useCollection('settings')
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [toast, setToast] = useState(null)

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), [])
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
  const archiveList = useMemo(() => Object.entries(archive).map(([id, t]) => ({ id, ...t })).sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)), [archive])

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
  const assignPlayerToTeam = useCallback((playerId, teamId) => update(ref(db, `players/${playerId}`), { teamId }), [])

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

  // Oyun hadisəsi (qol/assist/kart) əlavə et — həm matç tarixçəsinə, həm oyunçu statistikasına yazılır
  const addMatchEvent = useCallback(async (tournamentId, matchId, event) => {
    const t = tournaments[tournamentId]
    const m = t?.matches?.[matchId]
    const events = [...(m?.events || []), { ...event, id: uid('ev'), createdAt: Date.now() }]
    await update(ref(db, `tournaments/${tournamentId}/matches/${matchId}`), { events })
    if (event.playerId) {
      const p = players[event.playerId]
      if (p) {
        const field = { goal: 'goals', assist: 'assists', yellow: 'yellowCards', red: 'redCards' }[event.type]
        if (field) await update(ref(db, `players/${event.playerId}`), { [field]: (p[field] || 0) + 1 })
      }
    }
    notify('Hadisə əlavə edildi')
  }, [tournaments, players, notify])

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

  const completeTournament = useCallback(async (tournamentId, { finalMvp } = {}) => {
    const t = tournaments[tournamentId]
    if (!t) return
    const archiveId = tournamentId
    await set(ref(db, `archive/${archiveId}`), {
      ...t, finalMvp: finalMvp || t.finalMvp || null, status: 'ARCHIVED', finishedAt: t.finishedAt || Date.now(),
    })
    await update(ref(db, `tournaments/${tournamentId}`), { status: 'ARCHIVED' })
    if (t.champion) {
      const champ = teams[t.champion]
      const champs = champ?.championships || []
      await update(ref(db, `teams/${t.champion}`), { championships: [...champs, t.season || t.name] })
    }
    const cur = await new Promise((res) => onValue(ref(db, 'settings/activeTournamentId'), (s) => res(s.val()), { onlyOnce: true }))
    if (cur === tournamentId) await set(ref(db, 'settings/activeTournamentId'), null)
    notify('Turnir arxivə köçürüldü')
  }, [tournaments, teams, notify])

  // ---------- Auth ----------
  const login = useCallback((email, password) => signInWithEmailAndPassword(auth, email, password), [])
  const logout = useCallback(() => signOut(auth), [])

  const value = {
    players, playerList, teams, teamList, tournaments, tournamentList, archive, archiveList,
    activeTournament, activeTournamentId, loading, user, theme, toggleTheme, notify, toast,
    addPlayer, updatePlayer, deletePlayer, addTeam, updateTeam, deleteTeam, assignPlayerToTeam,
    createTournament, setActiveTournament, updateTournament, generateDraw, recordResult, setMatchLive,
    updateMatch, deleteMatch, addMatch, addMatchEvent, advanceRound, completeTournament, login, logout,
    computeStandings,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
