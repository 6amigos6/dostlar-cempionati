import React, { useMemo, useState } from 'react'
import { TeamLogo, EmptyState } from '../components.jsx'
import { computeStandings, matchPlayed, DEFAULT_POINTS } from './logic.js'

// Həm user, həm admin panelində işlənən Tarixçə bölməsi.
// Hər arxivlənmiş turnir: komandalar, qarşılaşmalar, nəticələr, xal cədvəli və çempion.
export function ArchiveSection({ items, teams, onDelete }) {
  const [open, setOpen] = useState(null)
  if (!items || items.length === 0) {
    return <EmptyState title="Bitmiş turnir yoxdur" sub="Yeni turnir başlayanda əvvəlki avtomatik arxivləşir." />
  }
  return (
    <div className="stack">
      {items.map((t) => (
        <ArchiveCard
          key={t.id}
          t={t}
          teams={teams}
          open={open === t.id}
          onToggle={() => setOpen(open === t.id ? null : t.id)}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function ArchiveCard({ t, teams, open, onToggle, onDelete }) {
  const nameOf = (id) => t.teamsInfo?.[id]?.name || teams?.[id]?.name || 'TBD'
  const matches = useMemo(() => Object.values(t.matches || {}), [t])
  const standings = useMemo(
    () => computeStandings(t.teamIds || [], matches, { ...DEFAULT_POINTS, ...(t.pointsRule || {}) }),
    [t, matches],
  )
  const rounds = useMemo(() => {
    const map = {}
    matches.forEach((m) => {
      const key = typeof m.round === 'number' ? `Tur ${m.round}` : (m.round || 'Oyunlar')
      ;(map[key] = map[key] || []).push(m)
    })
    return Object.entries(map)
  }, [matches])
  const champ = t.teamsInfo?.[t.champion] || teams?.[t.champion]

  return (
    <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
      <button type="button" className="arch-head" onClick={onToggle}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{t.name} · {t.season}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            {champ ? <>Çempion: <b style={{ color: 'var(--gold)' }}>{champ.name}</b></> : 'Çempion yoxdur'} · {t.teamIds?.length || 0} komanda
          </div>
        </div>
        <span className="arch-chevron" style={{ transform: open ? 'rotate(180deg)' : undefined }}>▾</span>
      </button>

      {open && (
        <div className="arch-body">
          {champ && (
            <div className="arch-champ">
              <TeamLogo team={champ} size={30} />
              <div>
                <div className="muted" style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Çempion</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{champ.name}</div>
              </div>
            </div>
          )}

          <div className="card-title" style={{ marginTop: 12 }}>Xal cədvəli</div>
          <div className="table">
            <div className="table-head">
              <span className="c-pos">#</span>
              <span className="c-team">Komanda</span>
              <span className="c-num">O</span>
              <span className="c-num">Q</span>
              <span className="c-num">H</span>
              <span className="c-num">M</span>
              <span className="c-pts">Xal</span>
            </div>
            {standings.map((r, i) => (
              <div className="table-row" key={r.teamId}>
                <span className="c-pos">{i + 1}</span>
                <span className="c-team">
                  <TeamLogo team={teams?.[r.teamId] || { name: nameOf(r.teamId) }} size={22} />
                  <span className="c-name">{nameOf(r.teamId)}</span>
                </span>
                <span className="c-num">{r.played}</span>
                <span className="c-num">{r.won}</span>
                <span className="c-num">{r.drawn}</span>
                <span className="c-num">{r.lost}</span>
                <span className="c-pts">{r.pts}</span>
              </div>
            ))}
          </div>

          {rounds.map(([label, ms]) => (
            <div key={label} style={{ marginTop: 12 }}>
              <div className="card-title">{label}</div>
              <div className="stack">
                {ms.map((m) => {
                  const played = matchPlayed(m)
                  return (
                    <div className={`match-row ${played ? 'played' : ''}`} key={m.id}>
                      <span className="match-team">{nameOf(m.teamA)}</span>
                      <span className="match-score">
                        {played ? `${m.scoreA} : ${m.scoreB}` : 'VS'}
                      </span>
                      <span className="match-team right">{nameOf(m.teamB)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {onDelete && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(t.id)}>🗑 Arxivdən sil</button>
        </div>
      )}
    </div>
  )
}
