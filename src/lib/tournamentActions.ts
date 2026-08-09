import { get, push, ref, remove, set, update } from "firebase/database";
import { db } from "./firebase";
import { Match, MatchesMap, Tournament } from "./types";
import { shuffle, standingsForTeams } from "./standings";
import { getTeamsSnapshot } from "./teamActions";

const GROUP_LETTERS = "ABCDEFGH";

export function createTournament(name: string, selectedIds: string[], numGroupsInput: number) {
  const numGroups = Math.max(1, Math.min(numGroupsInput, selectedIds.length));
  const shuffled = shuffle(selectedIds);
  const groups: Record<string, string[]> = {};
  for (let i = 0; i < numGroups; i++) groups[GROUP_LETTERS[i]] = [];
  shuffled.forEach((id, idx) => groups[GROUP_LETTERS[idx % numGroups]].push(id));

  const matches: MatchesMap = {};
  Object.keys(groups).forEach((g) => {
    const teams = groups[g];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const key = `m${g}${i}${j}_${Date.now()}${Math.floor(Math.random() * 10000)}`;
        matches[key] = { group: g, teamA: teams[i], teamB: teams[j], scoreA: null, scoreB: null, played: false };
      }
    }
  });

  const tournament: Tournament = {
    id: `trn_${Date.now()}`,
    name: name.trim() || `Dostlar Çempionatı ${new Date().getFullYear()}`,
    status: "active",
    teams: shuffled,
    groups,
    matches,
    champion: null,
    createdAt: Date.now()
  };

  return set(ref(db, "currentTournament"), tournament);
}

export async function saveScore(matchId: string, scoreARaw: string, scoreBRaw: string) {
  const scoreA = Number(scoreARaw);
  const scoreB = Number(scoreBRaw);
  if (Number.isNaN(scoreA) || Number.isNaN(scoreB) || scoreA < 0 || scoreB < 0) return;

  await update(ref(db, `currentTournament/matches/${matchId}`), { scoreA, scoreB, played: true });
  await checkAndFinalize();
}

async function checkAndFinalize() {
  const snap = await get(ref(db, "currentTournament"));
  const t = snap.val() as Tournament | null;
  if (!t || t.status !== "active") return;
  const all = Object.values(t.matches || {});
  if (all.length > 0 && all.every((m) => m.played)) {
    await finalize(t);
  }
}

async function finalize(t: Tournament) {
  const overall = standingsForTeams(t.teams, t.matches, await getTeamsSnapshot(t.teams));
  const championId = overall.length ? overall[0].id : null;
  const teamsSnapshot = await getTeamsSnapshot(t.teams);

  await update(ref(db, "currentTournament"), {
    status: "finished",
    champion: championId,
    teamsSnapshot,
    finishedAt: Date.now()
  });
}

export async function manualFinishTournament() {
  const snap = await get(ref(db, "currentTournament"));
  const t = snap.val() as Tournament | null;
  if (!t || t.status !== "active") return;
  await finalize(t);
}

export async function startNewTournamentFlow() {
  const snap = await get(ref(db, "currentTournament"));
  const t = snap.val() as Tournament | null;
  if (t) {
    await push(ref(db, "history"), t);
    await remove(ref(db, "currentTournament"));
  }
}
