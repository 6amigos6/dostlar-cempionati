import { get, push, ref, remove, update } from "firebase/database";
import { db } from "./firebase";
import { Team } from "./types";

export function addTeam(name: string, image: string) {
  if (!name.trim()) return;
  return push(ref(db, "teams"), { name: name.trim(), image: image.trim() || null });
}

export function updateTeam(id: string, name: string, image: string) {
  if (!name.trim()) return;
  return update(ref(db, `teams/${id}`), { name: name.trim(), image: image.trim() || null });
}

export function deleteTeam(id: string) {
  return remove(ref(db, `teams/${id}`));
}

export async function getTeamsSnapshot(teamIds: string[]): Promise<Record<string, Team>> {
  const snap = await get(ref(db, "teams"));
  const all = (snap.val() || {}) as Record<string, Team>;
  const out: Record<string, Team> = {};
  teamIds.forEach((id) => {
    if (all[id]) out[id] = all[id];
  });
  return out;
}
