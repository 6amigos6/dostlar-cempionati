import { standingsForTeams, teamImg } from "@/lib/standings";
import { Team, Tournament } from "@/lib/types";

export default function GroupsSection({
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
        Qruplar &amp; Xal Cədvəli
        <span className="flex-1 h-px bg-white/10" />
      </div>
      <div className="flex gap-3.5 overflow-x-auto pb-1.5 md:flex-wrap md:overflow-visible">
        {groupKeys.map((g) => {
          const teamIds = tournament.groups[g];
          const standings = standingsForTeams(teamIds, tournament.matches, teamsData);
          return (
            <div
              key={g}
              className="bg-pitch border border-white/10 rounded-2xl overflow-hidden min-w-[270px] flex-none md:flex-1 md:min-w-[280px]"
            >
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-dashed border-white/10">
                <h3 className="font-display text-[20px] text-gold tracking-wide">{g} Qrupu</h3>
                <div className="flex">
                  {teamIds.map((id) => (
                    <img
                      key={id}
                      src={teamImg(teamsData[id])}
                      alt=""
                      className="w-[26px] h-[26px] rounded-full object-cover border-2 border-pitch bg-pitch2 -ml-2 first:ml-0"
                    />
                  ))}
                </div>
              </div>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left font-semibold text-chalkDim text-[10px] tracking-[0.1em] uppercase px-2 pt-2 pb-1.5 border-b border-white/10 w-6">
                      #
                    </th>
                    <th className="text-left font-semibold text-chalkDim text-[10px] tracking-[0.1em] uppercase px-2 pt-2 pb-1.5 border-b border-white/10">
                      Komanda
                    </th>
                    <th className="text-right font-semibold text-chalkDim text-[10px] tracking-[0.1em] uppercase px-2 pt-2 pb-1.5 border-b border-white/10">
                      O
                    </th>
                    <th className="text-right font-semibold text-chalkDim text-[10px] tracking-[0.1em] uppercase px-2 pt-2 pb-1.5 border-b border-white/10">
                      Xal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((r, idx) => (
                    <tr key={r.id}>
                      <td className={`px-2 py-2.5 border-b border-white/5 font-bold ${idx === 0 ? "text-gold" : "text-chalkDim"}`}>
                        {idx + 1}
                      </td>
                      <td className="px-2 py-2.5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <img src={r.image} alt="" className="w-[22px] h-[22px] rounded-full object-cover bg-pitch2 flex-shrink-0" />
                          {r.name}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 border-b border-white/5 text-right text-chalkDim">{r.played}</td>
                      <td className="px-2 py-2.5 border-b border-white/5 text-right font-extrabold text-gold">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
