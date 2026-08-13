import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { db, auth } from './firebase'
import { ref, onValue, set, update, remove, get } from 'firebase/database'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { uid, computeStandings, buildFirstRound, buildNextRound, matchPlayed, DEFAULT_POINTS } from './lib/logic'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

// Firebase Realtime Database-yə canlı abunə: hər dəyişiklikdə bütün cihazlarda ani yenilənir.
function useCollection(path) {
  const [data, setData] = useState(null)
  useEffect(() => {
    const r = ref(db, path)
    const unsub = onValue(r, (snap) => setData(snap.val() || {}), () => setData({}))
    return () => unsub()
  }, [path])
  return data
}

export function AppProvider({ children }) {
  const teams = useCollection('teams')
  const tournaments = useCollection('tournaments')
  const archive = useCollection('archive')
  const settings = useCollection('settings')
  const [toast, setToast] = useState(null)
  const [authUid, setAuthUid] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Anonim giriş: hər brauzerdə sabit istifadəçi kimliyi yaradır.
  // Bu kimlik komanda sahibliyini (ownerId) təmin edir və
  // Firebase Security Rules backend-də "yalnız sahib dəyişə bilər" qaydasını tətbiq edir.
  // Əgər Firebase Console-da Anonymous sign-in aktiv deyilsə, cihaz əsaslı
  // identifikatora keçir (app yenə tam işləyir; real qorunma üçün
  // Anonymous aktiv edilib rules tətbiq edilməlidir — README-ə baxın).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUid(user.uid)
        setAuthReady(true)
      } else {
        signInAnonymously(auth)
          .then((cred) => { setAuthUid(cred.user.uid); setAuthReady(true) })
          .catch(() => {
            try {
              let did = localStorage.getItem('dc_device_uid')
              if (!did) {
                did = 'dev_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36)
                localStorage.setItem('dc_device_uid', did)
              }
              setAuthUid(did)
            } catch { /* no-op */ }
            setAuthReady(true)
          })
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const notify = useCallback((msg) => setToast(msg), [])

  const loading = !authReady || teams === null || tournaments === null || settings === null

  const activeTournamentId = settings?.activeTournamentId || null
  const rawActive = activeTournamentId && tournaments?.[activeTournamentId]
    ? { id: activeTournamentId, ...tournaments[activeTournamentId], pointsRule: { ...DEFAULT_POINTS, ...(tournaments[activeTournamentId]?.pointsRule || {}) } }
    : null

  // Köhnə (qrup/playoff) formatlı turnir yeni sadə sistemə uyğun deyil —
  // aktiv sayılmır və yüklənmədə avtomatik arxivlənir (məlumat itirilmir).
  const legacyActive = rawActive
    ? Object.values(rawActive.matches || {}).some((m) => typeof m.round !== 'number')
    : false
  const activeTournament = legacyActive ? null : rawActive

  const teamList = useMemo(() => Object.entries(teams || {}).map(([id, t]) => ({ id, ...t })), [teams])

  const archiveList = useMemo(() => Object.entries(archive || {})
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => (b.archivedAt || b.finishedAt || 0) - (a.archivedAt || a.finishedAt || 0)), [archive])

  // Köhnə məlumatlarda hər qarşılaşmanın öz id-si olmayıb (nəticə "matches/undefined"-ə yazılırdı).
  // Yüklənərkən id-lər avtomatik bərpa edilir; köhnə formatlı (qrup/playoff) turnir isə arxivlənir.
  useEffect(() => {
    if (loading) return
    const legacyIds = new Set()
    Object.entries(tournaments || {}).forEach(([tid, t]) => {
      if (!t || !t.matches) return
      const ms = Object.values(t.matches)
      if (ms.some((m) => typeof m.round !== 'number')) { legacyIds.add(tid); return }
      const upd = {}
      Object.entries(t.matches).forEach(([mid, m]) => {
        if (m && !m.id) upd[`${mid}/id`] = mid
      })
      if (Object.keys(upd).length) update(ref(db, `tournaments/${tid}/matches`), upd).catch(() => {})
    })
    if (activeTournamentId && legacyIds.has(activeTournamentId) && tournaments[activeTournamentId]) {
      const t = tournaments[activeTournamentId]
      const now = Date.now()
      const teamsInfo = {}
      ;(t.teamIds || []).forEach((id) => {
        const tm = teams?.[id]
        if (tm) teamsInfo[id] = { name: tm.name }
      })
      Promise.all([
        set(ref(db, `archive/${activeTournamentId}`), {
          ...t, teamsInfo, finishedAt: t.finishedAt || now, archivedAt: now,
        }),
        remove(ref(db, `tournaments/${activeTournamentId}`)),
        set(ref(db, 'settings/activeTournamentId'), null),
      ]).catch(() => {})
    }
  }, [tournaments, settings, teams, loading, legacyActive, activeTournamentId])

  // ---------- Komandalar ----------
  // Komanda sahibinə (ownerId) bağlanır — yalnız sahib onu redaktə/silə bilər
  // (həm UI, həm Firebase Security Rules səviyyəsində).
  const addTeam = useCallback(async (name, logoUrl, info) => {
    if (!authUid) return
    const id = uid('team')
    const t = { name: name.trim(), createdAt: Date.now(), ownerId: authUid }
    if (logoUrl) t.logoUrl = logoUrl
    if (info != null && info.trim()) t.info = info.trim()
    await set(ref(db, `teams/${id}`), t)
    return id
  }, [authUid])

  const updateTeam = useCallback(async (id, patch) => {
    const upd = {}
    if (patch.name != null) upd.name = patch.name.trim()
    if (patch.logoUrl !== undefined) {
      if (patch.logoUrl) upd.logoUrl = patch.logoUrl
      else upd.logoUrl = null
    }
    if (patch.info !== undefined) {
      if (patch.info != null && patch.info.trim()) upd.info = patch.info.trim()
      else upd.info = null
    }
    if (Object.keys(upd).length) await update(ref(db, `teams/${id}`), upd)
  }, [])

  const deleteTeam = useCallback((id) => remove(ref(db, `teams/${id}`)), [])

  // ---------- Turnir ----------
  // Aktiv turniri tam məlumatı ilə arxivə köçürür və aktiv turniri boşaldır.
  const archiveCurrent = useCallback(async () => {
    const activeId = settings?.activeTournamentId
    if (!activeId) return
    const snap = await get(ref(db, `tournaments/${activeId}`))
    const prev = snap.val()
    if (!prev || !(prev.teamIds?.length || Object.keys(prev.matches || {}).length)) return
    const now = Date.now()
    const teamsInfo = {}
    ;(prev.teamIds || []).forEach((id) => {
      const tm = teams?.[id]
      if (tm) teamsInfo[id] = { name: tm.name }
    })
    await Promise.all([
      set(ref(db, `archive/${activeId}`), {
        ...prev, teamsInfo, finishedAt: prev.finishedAt || now, archivedAt: now,
      }),
      remove(ref(db, `tournaments/${activeId}`)),
      set(ref(db, 'settings/activeTournamentId'), null),
    ])
  }, [settings, teams])

  // Yeni turnir başlayanda köhnə aktiv turnir avtomatik arxivlənir.
  const startTournament = useCallback(async (teamIds) => {
    if (!teamIds || teamIds.length < 2) return
    await archiveCurrent()
    const id = uid('tour')
    const now = Date.now()
    const matches = {}
    buildFirstRound(teamIds).forEach(([a, b]) => {
      const mid = uid('m')
      matches[mid] = { id: mid, round: 1, teamA: a, teamB: b, scoreA: null, scoreB: null, playedAt: null }
    })
    const tour = {
      name: 'Dostlar Çempionatı',
      season: new Date().getFullYear(),
      teamIds,
      round: 1,
      matches,
      champion: null,
      finished: false,
      createdAt: now,
      finishedAt: null,
    }
    await Promise.all([
      set(ref(db, `tournaments/${id}`), tour),
      set(ref(db, 'settings/activeTournamentId'), id),
    ])
    return id
  }, [archiveCurrent])

  // Nəticə daxil edilir → xal cədvəli ani yenilənir. Cari tur bitdikdə növbəti tur avtomatik qurulur.
  // Daha qarşılaşma qalmadıqda turnir bitir və çempion müəyyənləşir.
  const recordResult = useCallback(async (tournamentId, matchId, scoreA, scoreB) => {
    const snap = await get(ref(db, `tournaments/${tournamentId}`))
    const t = snap.val()
    const m = t?.matches?.[matchId]
    if (!t || !m) return
    await update(ref(db, `tournaments/${tournamentId}/matches/${matchId}`), {
      scoreA, scoreB, playedAt: Date.now(),
    })
    const snap2 = await get(ref(db, `tournaments/${tournamentId}`))
    const t2 = snap2.val()
    if (!t2 || t2.finished || typeof m.round !== 'number') return
    const matches = Object.values(t2.matches || {})
    const roundMatches = matches.filter((mm) => mm.round === m.round)
    if (roundMatches.length === 0 || !roundMatches.every(matchPlayed)) return
    if (matches.some((mm) => mm.round === m.round + 1)) return // artıq növbəti tur qurulub
    const pairs = buildNextRound(t2.teamIds || [], matches, t2.pointsRule)
    if (pairs.length === 0) {
      const standings = computeStandings(t2.teamIds || [], matches, t2.pointsRule)
      const champion = standings[0]?.teamId || null
      await update(ref(db, `tournaments/${tournamentId}`), { champion, finished: true, finishedAt: Date.now() })
    } else {
      const newMatches = {}
      pairs.forEach(([a, b]) => {
        const mid = uid('m')
        newMatches[mid] = { id: mid, round: m.round + 1, teamA: a, teamB: b, scoreA: null, scoreB: null, playedAt: null }
      })
      await update(ref(db, `tournaments/${tournamentId}/matches`), newMatches)
    }
  }, [])

  // Cari cədvələ görə turniri indi bitir (çempion cədvəlin birincisidir).
  const finishTournament = useCallback(async (tournamentId) => {
    const snap = await get(ref(db, `tournaments/${tournamentId}`))
    const t = snap.val()
    if (!t || t.finished) return
    const matches = Object.values(t.matches || {})
    const standings = computeStandings(t.teamIds || [], matches, t.pointsRule)
    const champion = standings[0]?.teamId || null
    await update(ref(db, `tournaments/${tournamentId}`), { champion, finished: true, finishedAt: Date.now() })
  }, [])

  const deleteTournament = useCallback(async (tournamentId) => {
    await Promise.all([
      remove(ref(db, `tournaments/${tournamentId}`)),
      set(ref(db, 'settings/activeTournamentId'), null),
    ])
  }, [])

  const deleteArchivedTournament = useCallback((id) => remove(ref(db, `archive/${id}`)), [])

  const value = {
    teams, teamList, tournaments, archive, archiveList,
    activeTournament, activeTournamentId, loading, notify, toast,
    authUid,
    addTeam, updateTeam, deleteTeam,
    archiveCurrent, startTournament, recordResult, finishTournament, deleteTournament, deleteArchivedTournament,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
