"use client";

import { useState } from "react";
import Link from "next/link";
import { useFirebaseValue } from "@/hooks/useFirebaseValue";
import { HistoryMap, TeamsMap, Tournament } from "@/lib/types";
import TrophyHero from "./TrophyHero";
import ChampionBanner from "./ChampionBanner";
import GroupsSection from "./GroupsSection";
import MatchesSection from "./MatchesSection";
import HistorySection from "./HistorySection";
import Confetti from "./Confetti";

export default function PublicSite() {
  const teams = useFirebaseValue<TeamsMap>("teams", {});
  const tournament = useFirebaseValue<Tournament | null>("currentTournament", null);
  const history = useFirebaseValue<HistoryMap>("history", {});
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="max-w-[480px] md:max-w-[900px] mx-auto px-4 pb-16">
      <Confetti triggerKey={tournament?.status === "finished" ? tournament.id : null} />

      {showHistory ? (
        <HistorySection history={history} onClose={() => setShowHistory(false)} />
      ) : !tournament ? (
        <>
          <TrophyHero tournament={null} />
          <div className="text-chalkDim text-sm text-center py-8 border border-dashed border-white/10 rounded-2xl">
            Hazırda aktiv çempionat yoxdur. Tezliklə yeni turnir başlayacaq — gözlə! ⚽
          </div>
        </>
      ) : (
        <>
          <TrophyHero tournament={tournament} />
          <ChampionBanner tournament={tournament} teamsData={teams} />
          <GroupsSection tournament={tournament} teamsData={teams} />
          <MatchesSection tournament={tournament} teamsData={teams} />
        </>
      )}

      <div className="mt-11 flex justify-center gap-6">
        <button
          onClick={() => setShowHistory(true)}
          className="text-[12px] text-chalkDim hover:text-gold uppercase tracking-wide"
        >
          Tarixçə
        </button>
        <Link href="/admin" className="text-[12px] text-chalkDim hover:text-gold uppercase tracking-wide">
          Admin
        </Link>
      </div>
    </div>
  );
}
