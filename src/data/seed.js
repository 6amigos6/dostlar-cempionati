import { db } from '../firebase'
import { ref, set } from 'firebase/database'
import { uid, AVATAR_PALETTE, splitIntoGroups, generateGroupMatches } from '../lib/logic'

const TEAM_NAMES = ['Alov FC', 'Zümrüd United', 'Qartallar', 'Şimşək', 'Dəniz Kənarı', 'Polad Gücü', 'Ulduz FK', 'Tufan City']

export async function seedDemoData() {
  const teamIds = []
  const teamsObj = {}
  TEAM_NAMES.forEach((name, i) => {
    const id = uid('team')
    teamIds.push(id)
    teamsObj[id] = {
      name, color: AVATAR_PALETTE[i % AVATAR_PALETTE.length], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0,
      createdAt: Date.now(),
    }
  })

  const groups = splitIntoGroups(teamIds)
  const matches = generateGroupMatches(groups)
  const matchesObj = {}
  const now = Date.now()
  matches.forEach((m, i) => {
    matchesObj[uid('m')] = { ...m, startTime: now + (i + 1) * 3600 * 1000 * 6, venue: 'Olimpiya Stadionu' }
  })

  const tourId = uid('tour')
  const tournament = {
    name: 'Çempionlar Liqası 2026',
    season: 2026,
    format: 'groups',
    groups,
    stage: 'groups',
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
    set(ref(db, 'teams'), teamsObj),
    set(ref(db, `tournaments/${tourId}`), tournament),
    set(ref(db, 'settings/activeTournamentId'), tourId),
  ])
  return tourId
}

export async function wipeAllData() {
  await Promise.all([
    set(ref(db, 'teams'), null),
    set(ref(db, 'players'), null),
    set(ref(db, 'tournaments'), null),
    set(ref(db, 'archive'), null),
    set(ref(db, 'settings'), null),
  ])
}
