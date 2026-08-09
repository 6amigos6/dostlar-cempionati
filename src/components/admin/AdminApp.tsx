"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFirebaseValue } from "@/hooks/useFirebaseValue";
import { HistoryMap, TeamsMap, Tournament } from "@/lib/types";
import TeamsTab from "./TeamsTab";
import TournamentTab from "./TournamentTab";
import HistorySection from "../HistorySection";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "gasham";
type Tab = "teams" | "tournament" | "history";

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("teams");

  const teams = useFirebaseValue<TeamsMap>("teams", {});
  const tournament = useFirebaseValue<Tournament | null>("currentTournament", null);
  const history = useFirebaseValue<HistoryMap>("history", {});

  useEffect(() => {
    setAuthed(sessionStorage.getItem("isAdmin") === "1");
  }, []);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("isAdmin", "1");
      setAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Şifrə yanlışdır.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("isAdmin");
    setAuthed(false);
  }

  if (authed === null) return null;

  if (!authed) {
    return (
      <div className="max-w-[480px] mx-auto px-4">
        <div className="max-w-[340px] mx-auto mt-20 text-center">
          <div className="text-[56px] mb-2">🏆</div>
          <h2 className="text-[26px] font-display mb-4.5">Admin Girişi</h2>
          {loginError && (
            <div className="text-[13px] px-3 py-2.5 rounded-lg mb-3.5 bg-red-500/10 text-red-300 border border-red-500/30">
              {loginError}
            </div>
          )}
          <div className="text-left mb-3.5">
            <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-1.5">Şifrə</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••"
              className="w-full bg-pitchDark border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <button onClick={handleLogin} className="w-full rounded-md py-3 font-bold text-[13px] text-ink bg-gradient-to-b from-gold to-goldDeep">
            Daxil ol
          </button>
          <Link href="/" className="inline-block mt-4.5 text-[12px] text-chalkDim hover:text-gold uppercase tracking-wide">
            ◀ Sayta qayıt
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "teams", label: "Komandalar" },
    { key: "tournament", label: "Çempionat" },
    { key: "history", label: "Tarixçə" }
  ];

  return (
    <div className="max-w-[480px] md:max-w-[900px] mx-auto px-4 pb-16">
      <div className="flex items-center justify-between py-4 border-b border-white/10 mb-5">
        <div className="text-[11px] tracking-[0.22em] uppercase text-gold font-bold">🏆 Admin Panel</div>
        <div className="flex gap-3.5">
          <Link href="/" className="text-[12px] text-chalkDim hover:text-gold uppercase tracking-wide">
            Sayt
          </Link>
          <button onClick={handleLogout} className="text-[12px] text-chalkDim hover:text-gold uppercase tracking-wide">
            Çıxış
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-5.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-full text-[12px] tracking-wide uppercase border whitespace-nowrap ${
              tab === t.key ? "bg-gold text-ink border-gold font-bold" : "border-white/10 text-chalkDim"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "teams" && <TeamsTab teams={teams} />}
      {tab === "tournament" && <TournamentTab teams={teams} tournament={tournament} />}
      {tab === "history" && <HistorySection history={history} onClose={() => setTab("tournament")} />}
    </div>
  );
}
