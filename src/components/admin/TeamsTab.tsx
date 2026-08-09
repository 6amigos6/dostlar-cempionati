"use client";

import { useState } from "react";
import { TeamsMap } from "@/lib/types";
import { addTeam, deleteTeam, updateTeam } from "@/lib/teamActions";
import { teamImg } from "@/lib/standings";

export default function TeamsTab({ teams }: { teams: TeamsMap }) {
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");

  const entries = Object.entries(teams || {});

  function handleAdd() {
    if (!newName.trim()) return;
    addTeam(newName, newImage);
    setNewName("");
    setNewImage("");
  }

  function startEdit(id: string) {
    setEditingId(id);
    setEditName(teams[id]?.name || "");
    setEditImage(teams[id]?.image || "");
  }

  function saveEdit(id: string) {
    updateTeam(id, editName, editImage);
    setEditingId(null);
  }

  return (
    <div>
      <div className="bg-pitch border border-white/10 rounded-2xl p-5 mb-5">
        <h3 className="text-[18px] mb-3.5">Yeni komanda əlavə et</h3>
        <div className="mb-3.5">
          <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-1.5">Komanda adı</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Məs: Team A"
            className="w-full bg-pitchDark border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <div className="mb-3.5">
          <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-1.5">Şəkil linki (istəyə bağlı)</label>
          <input
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="https://..."
            className="w-full bg-pitchDark border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <button
          onClick={handleAdd}
          className="w-full rounded-md py-3 font-bold text-[13px] text-ink bg-gradient-to-b from-gold to-goldDeep"
        >
          Komanda əlavə et
        </button>
      </div>

      <h3 className="text-[16px] mb-2.5 text-chalkDim">Bütün komandalar ({entries.length})</h3>
      {entries.length === 0 && <div className="text-chalkDim text-sm text-center py-6 border border-dashed border-white/10 rounded-2xl">Hələ komanda yoxdur.</div>}
      {entries.map(([id, t]) =>
        editingId === id ? (
          <div key={id} className="bg-pitch border border-white/10 rounded-2xl p-4 mb-2.5">
            <div className="mb-3">
              <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-1.5">Komanda adı</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-pitchDark border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div className="mb-3">
              <label className="block text-[11px] uppercase tracking-wide text-chalkDim mb-1.5">Şəkil linki</label>
              <input
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                className="w-full bg-pitchDark border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveEdit(id)} className="rounded-md px-3.5 py-2 text-[12px] font-bold text-ink bg-gold">
                Yadda saxla
              </button>
              <button onClick={() => setEditingId(null)} className="rounded-md px-3.5 py-2 text-[12px] border border-white/10 text-chalk">
                Ləğv et
              </button>
            </div>
          </div>
        ) : (
          <div key={id} className="flex items-center gap-3 py-2.5 border-b border-white/10">
            <img src={teamImg(t)} alt="" className="w-[38px] h-[38px] rounded-full object-cover bg-pitch2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <strong className="block text-sm truncate">{t.name}</strong>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => startEdit(id)} className="w-[30px] h-[30px] rounded-md border border-white/10 text-chalkDim">
                ✎
              </button>
              <button
                onClick={() => confirm("Bu komandanı silmək istədiyinizə əminsiniz?") && deleteTeam(id)}
                className="w-[30px] h-[30px] rounded-md border border-white/10 text-chalkDim"
              >
                🗑
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
