import { db } from '../firebase'
import { ref, set } from 'firebase/database'
import { uid, generatePlayoffRound, AVATAR_PALETTE } from '../lib/logic'

const TEAM_NAMES = ['Alov FC', 'Zümrüd United', 'Qartallar', 'Şimşək', 'Dəniz Kənarı', 'Polad Gücü', 'Ulduz FK', 'Tufan City']
const FIRST_NAMES = ['Elvin', 'Kamran', 'Tural', 'Vüsal', 'Orxan', 'Rəşad', 'Anar', 'Nicat', 'Fərid', 'Murad', 'Emin', 'Ceyhun', 'Samir', 'Ruslan', 'Elnur', 'Kənan', 'Toğrul', 'Nurlan', 'Sənan', 'Vasif', 'Elgün', 'Rauf', 'Ayxan', 'Turqut', 'Mahir', 'Rövşən', 'Fuad', 'Zaur', 'Cavid', 'Elmar', 'Xəyal', 'Namiq']
const LAST_NAMES = ['Əliyev', 'Məmmədov', 'Hüseynov', 'Quliyev', 'Rəhimov', 'İbrahimov', 'Cəfərov', 'Nəbiyev', 'Abbasov', 'Vəliyev']
const POSITIONS = ['Qapıçı', 'Müdafiəçi', 'Yarımmüdafiəçi', 'Hücumçu']

function pick(arr, i) { return arr[i % arr.length] }

export async function seedDemoData() {
  const teamIds = []
  const teamsObj = {}
  TEAM_NAMES.forEach((name, i) => {
    const id = uid('team')
    teamIds.push(id)
    teamsObj[id] = {
      name, color: AVATAR_PALETTE[i % AVATAR_PALETTE.length], played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0,
      championships: [], createdAt: Date.now(),
    }
  })

  const playersObj = {}
  teamIds.forEach((teamId, tIdx) => {
    for (let j = 0; j < 4; j++) {
      const id = uid('player')
      const idx = tIdx * 4 + j
      playersObj[id] = {
        firstName: pick(FIRST_NAMES, idx),
        lastName: pick(LAST_NAMES, idx + tIdx),
        nickname: '',
        number: j + 1,
        position: pick(POSITIONS, j),
        teamId,
        gamesPlayed: Math.floor(Math.random() * 5) + 1,
        wins: Math.floor(Math.random() * 3),
        goals: j === 3 ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3),
        assists: Math.floor(Math.random() * 4),
        yellowCards: Math.floor(Math.random() * 2),
        redCards: 0,
        mvpCount: 0,
        createdAt: Date.now(),
      }
    }
  })

  const matches = generatePlayoffRound(teamIds, { seeded: false })
  const matchesObj = {}
  const now = Date.now()
  matches.forEach((m, i) => {
    matchesObj[uid('m')] = { ...m, startTime: now + (i + 1) * 3600 * 1000 * 6, venue: 'Olimpiya Stadionu' }
  })

  const tourId = uid('tour')
  const tournament = {
    name: 'Dostlar Çempionatı 2026',
    season: 2026,
    startDate: null,
    endDate: null,
    format: 'knockout',
    hasThirdPlace: true,
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
    set(ref(db, 'players'), playersObj),
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
