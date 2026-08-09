import { MatchesMap, StandingRow, Team, TeamsMap } from "./types";

export function placeholderImg(name?: string) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name || "team")}`;
}

export function teamImg(t?: Partial<Team>) {
  return t && t.image ? t.image : placeholderImg(t && t.name);
}

/**
 * Computes standings (points, played, goal difference) for a set of team ids
 * from a matches map. Used both for a single group's table and for the
 * overall championship ranking (which determines the champion).
 */
export function standingsForTeams(
  teamIds: string[],
  matches: MatchesMap | undefined,
  teamsData: TeamsMap | undefined
): StandingRow[] {
  const table: Record<string, StandingRow> = {};

  (teamIds || []).forEach((id) => {
    const t: Partial<Team> = (teamsData && teamsData[id]) || {};
    table[id] = {
      id,
      name: t.name || "—",
      image: teamImg(t),
      played: 0,
      points: 0,
      gf: 0,
      ga: 0,
      gd: 0
    };
  });

  Object.values(matches || {}).forEach((m) => {
    if (!m.played || m.scoreA === null || m.scoreB === null) return;
    if (table[m.teamA] && table[m.teamB]) {
      table[m.teamA].played++;
      table[m.teamB].played++;
      table[m.teamA].gf += m.scoreA;
      table[m.teamA].ga += m.scoreB;
      table[m.teamB].gf += m.scoreB;
      table[m.teamB].ga += m.scoreA;

      if (m.scoreA > m.scoreB) table[m.teamA].points += 3;
      else if (m.scoreA < m.scoreB) table[m.teamB].points += 3;
      else {
        table[m.teamA].points += 1;
        table[m.teamB].points += 1;
      }
    }
  });

  const arr = Object.values(table);
  arr.forEach((r) => (r.gd = r.gf - r.ga));
  arr.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  return arr;
}

export function matchCount(matches?: MatchesMap) {
  return Object.keys(matches || {}).length;
}

export function playedCount(matches?: MatchesMap) {
  return Object.values(matches || {}).filter((m) => m.played).length;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
