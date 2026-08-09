import { teamImg } from "@/lib/standings";
import { Team, Tournament } from "@/lib/types";

export default function ChampionBanner({
  tournament,
  teamsData
}: {
  tournament: Tournament;
  teamsData: Record<string, Team>;
}) {
  if (tournament.status !== "finished" || !tournament.champion) return null;
  const team = teamsData[tournament.champion] || {};

  return (
    <div className="relative text-center rounded-2xl px-4.5 pt-6.5 pb-5.5 my-1.5 mb-7 border border-gold/35"
      style={{ background: "linear-gradient(180deg, rgba(244,196,48,0.14), rgba(244,196,48,0.02))" }}
    >
      <div className="text-[12px] tracking-[0.3em] uppercase text-gold font-bold">Çempion</div>
      <img
        src={teamImg(team)}
        alt=""
        className="w-[84px] h-[84px] rounded-full object-cover border-[3px] border-gold mx-auto mt-3.5 mb-2.5 shadow-[0_6px_20px_rgba(244,196,48,0.4)]"
      />
      <div className="font-display text-[30px] tracking-wide">{team.name || "—"}</div>
    </div>
  );
}
