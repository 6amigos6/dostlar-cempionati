// Turnirin sadə biznes məntiqi: təsadüfi püşkatma, xal cədvəli və
// nəticələrə görə növbəti turun avtomatik qurulması (Swiss sistemi).

export const DEFAULT_POINTS = { win: 3, draw: 1, loss: 0 }

// Saytda yalnız "Çempionat" sözü istifadə olunur.
// Köhnə turnirlərdəki adlardan asılı olmayaraq vahid etiket qaytarır.
export function tournamentLabel(t) {
  const season = t?.season
  return season ? `Çempionat ${season}` : 'Çempionat'
}

const PALETTE = ['#1FA35C', '#D4AF37', '#2563EB', '#DC2626', '#7C3AED', '#EA580C', '#0D9488', '#DB2777']

// Komanda avatarsı üçün ad əsasında sabit rəng
export function avatarColorFor(seedStr = '') {
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) hash = seedStr.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function matchPlayed(m) {
  return !!m && m.scoreA != null && m.scoreB != null
}

export function pairKey(a, b) {
  return [a, b].sort().join('|')
}

// Fisher-Yates shuffle
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// İlk tur: komandalar təsadüfi cütlənir. Tək sayda komanda varsa biri bu turda istirahət edir.
export function buildFirstRound(teamIds) {
  const ordered = shuffle(teamIds)
  const pairs = []
  for (let i = 0; i + 1 < ordered.length; i += 2) pairs.push([ordered[i], ordered[i + 1]])
  return pairs
}

// Növbəti tur: komandalar cədvələ görə sıralanır (ən güclü başda) və
// ən yaxın gücdəki cütlər bir-biri ilə oynayır (1-ci ilə 2-ci, 3-cü ilə 4-cü ...).
// Əvvəllər oynamış cütlər təkrarlanmır. Ola bilməyən komanda (tək sayda) istirahət edir.
export function buildNextRound(teamIds, matches, pointsRule = DEFAULT_POINTS) {
  const played = new Set()
  matches.forEach((m) => {
    if (m.teamA && m.teamB) played.add(pairKey(m.teamA, m.teamB))
  })
  const ordered = computeStandings(teamIds, matches, pointsRule).map((r) => r.teamId)
  const n = ordered.length
  if (n < 2) return []

  // avail[i][j] = bu cütlük hələ oynamayıb
  const avail = Array.from({ length: n }, () => new Array(n).fill(false))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!played.has(pairKey(ordered[i], ordered[j]))) { avail[i][j] = true; avail[j][i] = true }
    }
  }

  // Maksimum cütlük axtarışı (backtracking). Kiçik N üçün sürətli və dəqiqdir.
  // Məqsəd: mümkün olan ən çox cüt, cütlər arası cədvəl məsafəsi isə ən az (ən güclülər bir-biri ilə).
  const mate = new Array(n).fill(-1)
  let best = []
  let bestSize = 0
  let bestGap = Infinity
  let nodes = 0

  function record() {
    const pairs = []
    let gap = 0
    for (let i = 0; i < n; i++) {
      if (mate[i] !== -1 && i < mate[i]) { pairs.push([ordered[i], ordered[mate[i]]]); gap += mate[i] - i }
    }
    const size = pairs.length
    if (size > bestSize || (size === bestSize && gap < bestGap)) {
      bestSize = size
      bestGap = gap
      best = pairs
    }
  }

  function dfs(i) {
    if (++nodes > 200000) return
    if (i === n) { record(); return }
    if (mate[i] !== -1) { dfs(i + 1); return }
    // Prune: qalan komandalardan mümkün olan maksimum cüt sayı rekordu keçə bilmirsə dayan
    let unmatched = 0
    let matched = 0
    for (let k = 0; k < n; k++) { if (mate[k] !== -1) matched++; else if (k >= i) unmatched++ }
    if (matched / 2 + Math.floor(unmatched / 2) < bestSize) return
    // i istirahət edir (cüt olmadan)
    dfs(i + 1)
    // i hər uyğun partnere cütləşir
    for (let u = i + 1; u < n; u++) {
      if (mate[u] === -1 && avail[i][u]) {
        mate[i] = u
        mate[u] = i
        dfs(i + 1)
        mate[i] = -1
        mate[u] = -1
      }
    }
  }

  dfs(0)
  return best
}

// Xal cədvəli: Oyun / Qələbə / Heç-heçə / Məğlubiyyət / Vurulan / Buraxılan / Xal
// Sıralama: xal → top fərqi → vurulan qol.
export function computeStandings(teamIds, matches, pointsRule = DEFAULT_POINTS) {
  const table = {}
  teamIds.forEach((id) => {
    table[id] = { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }
  })
  matches
    .filter((m) => matchPlayed(m) && m.teamA && m.teamB && table[m.teamA] && table[m.teamB])
    .forEach((m) => {
      const A = table[m.teamA]
      const B = table[m.teamB]
      A.played++; B.played++
      A.gf += m.scoreA; A.ga += m.scoreB
      B.gf += m.scoreB; B.ga += m.scoreA
      if (m.scoreA > m.scoreB) {
        A.won++; B.lost++; A.pts += pointsRule.win; B.pts += pointsRule.loss
      } else if (m.scoreB > m.scoreA) {
        B.won++; A.lost++; B.pts += pointsRule.win; A.pts += pointsRule.loss
      } else {
        A.drawn++; B.drawn++; A.pts += pointsRule.draw; B.pts += pointsRule.draw
      }
    })
  return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
}
