import { teamImg } from "@/lib/standings";
import { Team, Tournament } from "@/lib/types";

export default function MatchesSection({
  tournament,
  teamsData
}: {
  tournament: Tournament;
  teamsData: Record<string, Team>;
}) {
  const groupKeys = Object.keys(tournament.groups || {}).sort();

  return (
    <div className="mt-7">
      <div className="flex items-center gap-2.5 text-[13px] tracking-[0.2em] uppercase text-gold font-bold mb-3.5">
        Qarşılaşmalar
        <span className="flex-1 h-px bg-white/10" />
      </div>
      {groupKeys.map((g) => {
        const matches = Object.entries(tournament.matches || {}).filter(([, m]) => m.group === g);
        return (
          <div key={g}>
            <div className="text-[12px] text-goldDeep tracking-[0.12em] uppercase font-bold mt-4 mb-2 first:mt-0">
              {g} Qrupu
            </div>
            <div className="flex flex-col gap-3">
              {matches.map(([mid, m]) => {
                const a = teamsData[m.teamA] || {};
                const b = teamsData[m.teamB] || {};
                return (
                  <div key={mid} className="match-notch relative flex items-center justify-between bg-pitch border border-white/10 rounded-xl px-4.5 py-4">
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <img src={teamImg(a)} alt="" className="w-10 h-10 rounded-full object-cover bg-pitch2" />
                      <span className="text-[12px] text-center max-w-[80px] truncate">{a.name || "—"}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2.5">
                      {m.played ? (
                        <div className="font-display text-[26px] tracking-wide text-gold">
                          {m.scoreA} - {m.scoreB}
                        </div>
                      ) : (
                        <div className="text-[11px] text-chalkDim tracking-wide">vs</div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <img src={teamImg(b)} alt="" className="w-10 h-10 rounded-full object-cover bg-pitch2" />
                      <span className="text-[12px] text-center max-w-[80px] truncate">{b.name || "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
