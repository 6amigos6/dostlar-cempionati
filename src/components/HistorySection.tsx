"use client";

import { useState } from "react";
import { HistoryMap } from "@/lib/types";
import TrophyHero from "./TrophyHero";
import ChampionBanner from "./ChampionBanner";
import GroupsSection from "./GroupsSection";
import MatchesSection from "./MatchesSection";

export default function HistorySection({ history, onClose }: { history: HistoryMap; onClose: () => void }) {
  const [detailId, setDetailId] = useState<string | null>(null);

  const entries = Object.entries(history || {}).sort(
    (a, b) => (b[1].finishedAt || 0) - (a[1].finishedAt || 0)
  );

  if (detailId) {
    const t = history[detailId];
    const teamsData = t?.teamsSnapshot || {};
    return (
      <div>
        <button
          onClick={() => setDetailId(null)}
          className="inline-block mb-4 text-[12px] text-chalkDim hover:text-gold uppercase tracking-wide"
        >
          ◀ Tarixçəyə qayıt
        </button>
        {t && (
          <>
            <TrophyHero tournament={t} />
            <ChampionBanner tournament={t} teamsData={teamsData} />
            <GroupsSection tournament={t} teamsData={teamsData} />
            <MatchesSection tournament={t} teamsData={teamsData} />
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={onClose} className="inline-block mb-4 text-[12px] text-chalkDim hover:text-gold uppercase tracking-wide">
        ◀ Geri
      </button>
      <div className="text-[13px] tracking-[0.2em] uppercase text-gold font-bold mb-3.5">Tarixçə</div>
      {entries.length === 0 && (
        <div className="text-chalkDim text-sm text-center py-8 border border-dashed border-white/10 rounded-2xl">
          Hələ heç bir turnir tarixçəyə düşməyib.
        </div>
      )}
      {entries.map(([id, h]) => {
        const teamsData = h.teamsSnapshot || {};
        const champ = h.champion ? teamsData[h.champion] : undefined;
        const date = h.finishedAt ? new Date(h.finishedAt).toLocaleDateString("az-AZ") : "";
        return (
          <div
            key={id}
            onClick={() => setDetailId(id)}
            className="flex items-center justify-between px-4 py-3.5 bg-pitch border border-white/10 rounded-xl mb-2.5 cursor-pointer hover:border-goldDeep"
          >
            <div>
              <div>{h.name}</div>
              <div className="text-[11px] text-gold uppercase tracking-wide mt-0.5">🏆 {champ?.name || "—"}</div>
            </div>
            <div className="text-[12px] text-chalkDim">{date}</div>
          </div>
        );
      })}
    </div>
  );
}
