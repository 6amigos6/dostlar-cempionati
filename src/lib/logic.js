// Turnirin bütün "biznes məntiqi" bu fayldadır: püşkatma, cədvəl hesablanması,
// avtomatik yüksəliş, statistika və reytinq.

export const AVATAR_PALETTE = ['#1FA35C', '#D4AF37', '#2563EB', '#DC2626', '#7C3AED', '#EA580C', '#0D9488', '#DB2777']

export function playerName(p) {
  if (!p) return ''
  return p.name || [p.firstName, p.lastName].filter(Boolean).join(' ')
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  const first = (parts[0]?.[0] || '').toUpperCase()
  const second = (parts[1]?.[0] || '').toUpperCase()
  return `${first}${second}` || '?'
}

export function avatarColorFor(seedStr = '') {
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) hash = seedStr.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

// Fisher-Yates shuffle — ədalətli təsadüfi püşkatma
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ROUND_NAMES = {
  2: 'Final',
  4: 'Yarımfinal',
  8: 'Rübfinal',
  16: '1/8 Final',
  32: '1/16 Final',
}

export function roundNameForSize(teamCount) {
  return ROUND_NAMES[teamCount] || `${teamCount} komandalıq mərhələ`
}

// N komanda üçün ilk playoff mərhələsinin qarşılaşmalarını yaradır (seed və ya təsadüfi)
export function generatePlayoffRound(teamIds, { seeded = false } = {}) {
  const ordered = seeded ? teamIds : shuffle(teamIds)
  const matches = []
  for (let i = 0; i < ordered.length; i += 2) {
    matches.push({
      teamA: ordered[i] || null,
      teamB: ordered[i + 1] || null,
      round: roundNameForSize(ordered.length),
      status: 'UPCOMING',
      scoreA: null,
      scoreB: null,
    })
  }
  return matches
}

// Bir mərhələnin bütün oyunları bitdikdən sonra qaliblərdən növbəti mərhələni qurur
export function buildNextRound(finishedMatches) {
  const winners = finishedMatches.map((m) => winnerOf(m)).filter(Boolean)
  if (winners.length < 2) return { matches: [], champion: winners[0] || null }
  if (winners.length === 1) return { matches: [], champion: winners[0] }
  return { matches: generatePlayoffRound(winners, { seeded: true }), champion: null }
}

export function winnerOf(match) {
  if (match.status !== 'FINISHED') return null
  if (match.scoreA > match.scoreB) return match.teamA
  if (match.scoreB > match.scoreA) return match.teamB
  if (match.penA != null && match.penB != null) {
    return match.penA > match.penB ? match.teamA : match.teamB
  }
  return null // heç-heçə, uzatma/penalti gözlənilir
}

// Liqa/qrup sistemi üçün round-robin qarşılaşma cədvəli
export function generateRoundRobin(teamIds) {
  const teams = [...teamIds]
  if (teams.length % 2 !== 0) teams.push(null) // bye
  const rounds = teams.length - 1
  const half = teams.length / 2
  const matches = []
  let arr = [...teams]
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i]
      const b = arr[arr.length - 1 - i]
      if (a && b) {
        matches.push({ teamA: a, teamB: b, round: `Tur ${r + 1}`, status: 'UPCOMING', scoreA: null, scoreB: null })
      }
    }
    arr = [arr[0], ...arr.slice(-1), ...arr.slice(1, -1)]
  }
  return matches
}

const DEFAULT_POINTS = { win: 3, draw: 1, loss: 0 }

// Bir qrup/liqa üçün POS/O/W/D/L/GF/GA/GD/PTS cədvəli
export function computeStandings(teamIds, matches, pointsRule = DEFAULT_POINTS) {
  const table = {}
  teamIds.forEach((id) => {
    table[id] = { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] }
  })
  matches
    .filter((m) => m.status === 'FINISHED' && m.teamA && m.teamB && table[m.teamA] && table[m.teamB])
    .sort((a, b) => (a.playedAt || 0) - (b.playedAt || 0))
    .forEach((m) => {
      const A = table[m.teamA]
      const B = table[m.teamB]
      A.played++; B.played++
      A.gf += m.scoreA; A.ga += m.scoreB
      B.gf += m.scoreB; B.ga += m.scoreA
      if (m.scoreA > m.scoreB) {
        A.won++; B.lost++; A.pts += pointsRule.win; B.pts += pointsRule.loss
        A.form.push('W'); B.form.push('L')
      } else if (m.scoreB > m.scoreA) {
        B.won++; A.lost++; B.pts += pointsRule.win; A.pts += pointsRule.loss
        B.form.push('W'); A.form.push('L')
      } else {
        A.drawn++; B.drawn++; A.pts += pointsRule.draw; B.pts += pointsRule.draw
        A.form.push('D'); B.form.push('D')
      }
    })
  Object.values(table).forEach((t) => { t.gd = t.gf - t.ga; t.form = t.form.slice(-5) })
  return Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

export function formatDateTimeBaku(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('az-AZ', {
    timeZone: 'Asia/Baku', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
