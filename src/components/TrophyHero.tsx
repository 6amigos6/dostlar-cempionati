import { matchCount, playedCount } from "@/lib/standings";
import { Tournament } from "@/lib/types";

export default function TrophyHero({ tournament }: { tournament: Tournament | null }) {
  const isFinished = tournament?.status === "finished";
  const isActive = tournament?.status === "active";
  const total = tournament ? matchCount(tournament.matches) : 0;
  const played = tournament ? playedCount(tournament.matches) : 0;
  const pct = total ? Math.round((played / total) * 100) : 0;

  return (
    <div className="relative text-center pt-9 pb-5 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[340px] h-[340px] blur-[2px]"
        style={{
          background:
            "radial-gradient(circle, rgba(244,196,48,0.35) 0%, rgba(244,196,48,0.08) 45%, transparent 70%)"
        }}
      />
      <div className="text-[11px] tracking-[0.22em] uppercase text-gold font-bold mb-1.5 relative">
        Dostlar Çempionatı
      </div>
      <div
        className={`relative inline-block leading-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] ${
          isFinished ? "text-[104px] animate-championPulse" : "text-[88px] animate-float"
        }`}
      >
        🏆
      </div>
      <h1 className="font-display text-[34px] tracking-wide mt-1.5">
        {tournament ? tournament.name : "Dostlar Çempionatı"}
      </h1>

      {tournament ? (
        <div
          className={`inline-block mt-2.5 px-3.5 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase border ${
            isActive ? "border-gold text-gold" : "border-white/10 text-chalkDim"
          }`}
        >
          {isActive ? "Davam edir" : "Bitdi"}
        </div>
      ) : (
        <div className="inline-block mt-2.5 px-3.5 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase border border-white/10 text-chalkDim">
          Aktiv turnir yoxdur
        </div>
      )}

      {isActive && (
        <div className="mt-4">
          <div className="max-w-[260px] mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-goldDeep to-gold transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[11px] text-chalkDim tracking-wide mt-1.5">
            {played}/{total} qarşılaşma tamamlandı
          </div>
        </div>
      )}
    </div>
  );
}
