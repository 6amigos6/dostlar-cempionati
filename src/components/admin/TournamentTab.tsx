"use client";

import { useState } from "react";
import { TeamsMap, Tournament } from "@/lib/types";
import { createTournament, manualFinishTournament, saveScore, startNewTournamentFlow } from "@/lib/tournamentActions";
import { matchCount, playedCount, teamImg } from "@/lib/standings";
import GroupsSection from "../GroupsSection";

export default function TournamentTab({ teams, tournament }: { teams: TeamsMap; tournament: Tournament | null }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [numGroups, setNumGroups] = useState(2);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});

  function toggleTeam(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleCreate() {
    if (selected.length < 2) {
      setError("Ən azı 2 komanda seçin.");
      return;
    }
    setError("");
    createTournament(name, selected, numGroups);
    setSelected([]);
    setName("");
  }

  function handleSaveScore(matchId: string) {
    const s = scores[matchId];
    if (!s) return;
    saveScore(matchId, s.a, s.b);
  }

  if (!tournament) {
    const entries = Object.entries(teams || {});
    if (!entries.length) {
      return (
        <div className="text-chalkDim text-sm text-center py-8 border border-dashed border-white/10 rounded-2xl">
          Turnir yaratmaq üçün əvvəlcə &quot;Komandalar&quot; bölməsindən komanda əlavə edin.
        </div>
      );
    }
    return (
      <div className="bg-pitch border border-white/10 rounded-2xl p-5">
        <h3 className="text-[18px] mb-3.5">Yeni çempionat yarat</h3>
        {error && <div className="text-[13px] px-3 py-2.5 rounded-lg mb-3.5 bg-red-500/10 text-red-300 border border-red-500/30">{error}</div>}
        <div className="mb-3.5">
          <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-1.5">Turnir adı</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Dostlar Çempionatı ${new Date().getFullYear()}`}
            className="w-full bg-pitchDark border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-2">Komandaları seç</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4.5">
          {entries.map(([id, t]) => (
            <div
              key={id}
              onClick={() => toggleTeam(id)}
              className={`flex items-center gap-2 px-2.5 py-2.5 rounded-lg border cursor-pointer text-[13px] ${
                selected.includes(id) ? "border-gold bg-gold/10" : "border-white/10"
              }`}
            >
              <img src={teamImg(t)} alt="" className="w-[26px] h-[26px] rounded-full object-cover bg-pitch2 flex-shrink-0" />
              {t.name}
            </div>
          ))}
        </div>
        <div className="mb-4.5 max-w-[160px]">
          <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-1.5">Qrup sayı</label>
          <input
            type="number"
            min={1}
            max={8}
            value={numGroups}
            onChange={(e) => setNumGroups(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-pitchDark border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <button onClick={handleCreate} className="w-full rounded-md py-3 font-bold text-[13px] text-ink bg-gradient-to-b from-gold to-goldDeep">
          Çempionatı başlat
        </button>
      </div>
    );
  }

  const groupKeys = Object.keys(tournament.groups || {}).sort();

  return (
    <div>
      <h3 className="text-[20px] mb-1">{tournament.name}</h3>
      <div className="text-[12px] text-chalkDim mb-4.5 uppercase tracking-wide">
        {tournament.status === "active" ? "Davam edir" : "Bitdi"} · {playedCount(tournament.matches)}/{matchCount(tournament.matches)} oyun
      </div>

      <GroupsSection tournament={tournament} teamsData={teams} />

      <div className="mt-7">
        <div className="flex items-center gap-2.5 text-[13px] tracking-[0.2em] uppercase text-gold font-bold mb-3.5">
          Nəticə daxil et
          <span className="flex-1 h-px bg-white/10" />
        </div>
        {groupKeys.map((g) => (
          <div key={g}>
            <div className="text-[12px] text-goldDeep tracking-[0.12em] uppercase font-bold mt-4 mb-2 first:mt-0">{g} Qrupu</div>
            {Object.entries(tournament.matches || {})
              .filter(([, m]) => m.group === g)
              .map(([mid, m]) => {
                const a = teams[m.teamA] || {};
                const b = teams[m.teamB] || {};
                const current = scores[mid] || { a: m.played ? String(m.scoreA) : "", b: m.played ? String(m.scoreB) : "" };
                return (
                  <div key={mid} className="flex items-center gap-2.5 p-3 bg-pitch border border-white/10 rounded-xl mb-2.5 flex-wrap">
                    <div className="flex-1 min-w-[140px] text-[13px]">
                      <b className="text-gold">{a.name || "—"}</b> vs <b className="text-gold">{b.name || "—"}</b>
                      {m.played && <div className="text-[10px] text-goldDeep uppercase tracking-wide">Nəticə daxil edilib</div>}
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={current.a}
                      onChange={(e) => setScores((prev) => ({ ...prev, [mid]: { a: e.target.value, b: current.b } }))}
                      className="w-11 text-center bg-pitchDark border border-white/10 rounded-md py-1.5 text-[15px]"
                    />
                    <span className="text-chalkDim">-</span>
                    <input
                      type="number"
                      min={0}
                      value={current.b}
                      onChange={(e) => setScores((prev) => ({ ...prev, [mid]: { a: current.a, b: e.target.value } }))}
                      className="w-11 text-center bg-pitchDark border border-white/10 rounded-md py-1.5 text-[15px]"
                    />
                    <button
                      onClick={() => handleSaveScore(mid)}
                      className="rounded-md px-3 py-1.5 text-[12px] font-bold text-ink bg-gold"
                    >
                      Yadda saxla
                    </button>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {tournament.status === "finished" ? (
        <div className="text-center rounded-2xl px-4.5 pt-6.5 pb-5.5 mt-5 border border-gold/35" style={{ background: "linear-gradient(180deg, rgba(244,196,48,0.14), rgba(244,196,48,0.02))" }}>
          <div className="text-[12px] tracking-[0.3em] uppercase text-gold font-bold">Çempion</div>
          <img src={teamImg(teams[tournament.champion || ""])} alt="" className="w-[84px] h-[84px] rounded-full object-cover border-[3px] border-gold mx-auto mt-3.5 mb-2.5" />
          <div className="font-display text-[30px] tracking-wide">{teams[tournament.champion || ""]?.name || "—"}</div>
          <button
            onClick={() => startNewTournamentFlow()}
            className="mt-3.5 rounded-md px-4 py-2.5 font-bold text-[13px] text-ink bg-gold"
          >
            Yeni çempionat yarat
          </button>
        </div>
      ) : (
        <button
          onClick={() => confirm("Turniri indi bitirmək istədiyinizə əminsiniz?") && manualFinishTournament()}
          className="w-full mt-5 rounded-md py-3 text-[13px] border border-white/10"
        >
          Turniri bitir
        </button>
      )}
    </div>
  );
}
