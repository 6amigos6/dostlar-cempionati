import { db } from '../firebase'
import { ref, set } from 'firebase/database'
import { uid, generatePlayoffRound, AVATAR_PALETTE } from '../lib/logic'

const TEAM_NAMES = ['Alov FC', 'Zümrüd United', 'Qartallar', 'Şimşək', 'Dəniz Kənarı', 'Polad Gücü', 'Ulduz FK', 'Tufan City']
const PLAYER_NAMES = ['Elvin Əliyev', 'Kamran Məmmədov', 'Tural Hüseynov', 'Vüsal Quliyev', 'Orxan Rəhimov', 'Rəşad İbrahimov', 'Anar Cəfərov', 'Nicat Nəbiyev', 'Fərid Abbasov', 'Murad Vəliyev', 'Emin Qarayev', 'Ceyhun Səfərov', 'Samir Nəsirov', 'Ruslan Həsənov', 'Elnur Qasımov', 'Kənan Rzayev', 'Toğrul Ağayev', 'Nurlan Səlimov', 'Sənan Qurbanov', 'Vasif Orucov', 'Elgün Mustafayev', 'Rauf Hacıyev', 'Ayxan İsmayılov', 'Turqut Süleymanov', 'Mahir Talıbov', 'Rövşən Bağırov', 'Fuad Qocayev', 'Zaur Əhmədov', 'Cavid Vəliyev', 'Elmar Hümbətov', 'Xəyal Məlikov', 'Namiq Şərifov']
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
        name: pick(PLAYER_NAMES, idx),
        number: j + 1,
        position: pick(POSITIONS, j),
        teamId,
        goals: j === 3 ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3),
        assists: Math.floor(Math.random() * 4),
        yellowCards: Math.floor(Math.random() * 2),
        redCards: 0,
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
    name: 'Çempionlar Liqası 2026',
    season: 2026,
    startDate: null,
    endDate: null,
    format: 'knockout',
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
