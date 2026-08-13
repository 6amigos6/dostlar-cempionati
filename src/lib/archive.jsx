import React, { useMemo, useState } from 'react'
import { TeamLogo, EmptyState, StandingsTable, ChevronIcon } from '../components.jsx'
import { computeStandings, matchPlayed, DEFAULT_POINTS } from './logic.js'

// Həm user, həm admin panelində işlənən Tarixçə bölməsi.
// Hər arxivlənmiş turnir: komandalar, qarşılaşmalar, nəticələr, xal cədvəli,
// final nəticəsi, çempion və statistikalar.
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
  const logoOf = (id) => (t.teamsInfo?.[id] && teams?.[id]) ? teams?.[id] : { name: nameOf(id) }
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

  const stats = useMemo(() => {
    const played = matches.filter((m) => matchPlayed(m))
    const goals = played.reduce((s, m) => s + (m.scoreA || 0) + (m.scoreB || 0), 0)
    let lastRound = 0
    matches.forEach((m) => { if (typeof m.round === 'number' && m.round > lastRound) lastRound = m.round })
    const finals = matches.filter((m) => m.round === lastRound)
    const champRow = standings.find((r) => r.teamId === t.champion)
    return { played, goals, finals, champRow, lastRound }
  }, [matches, standings, t.champion])

  const champStats = stats.champRow

  return (
    <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
      <button type="button" className="arch-head" onClick={onToggle}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{t.name} · {t.season}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            {champ ? <>Çempion: <b style={{ color: 'var(--gold)' }}>{champ.name}</b></> : 'Çempion yoxdur'} · {t.teamIds?.length || 0} komanda
          </div>
        </div>
        <ChevronIcon className={`arch-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="arch-body">
          {champ && (
            <div className="arch-champ">
              <TeamLogo team={champ} size={34} />
              <div style={{ minWidth: 0 }}>
                <div className="muted" style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Çempion</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{champ.name}</div>
                {champStats && (
                  <div className="arch-champ-stats">
                    <span>Oyun {champStats.played}</span>
                    <span>Qələbə {champStats.won}</span>
                    <span>Heç-heçə {champStats.drawn}</span>
                    <span>Məğlubiyyət {champStats.lost}</span>
                    <span className="pts">Xal {champStats.pts}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(t.teamIds?.length > 0) && (
            <>
              <div className="card-title" style={{ marginTop: 12 }}>Komandalar</div>
              <div className="arch-teams">
                {t.teamIds.map((id) => (
                  <span className="arch-team" key={id}>
                    <TeamLogo team={logoOf(id)} size={18} />
                    {nameOf(id)}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="card-title" style={{ marginTop: 12 }}>Xal cədvəli</div>
          <StandingsTable standings={standings} nameOf={nameOf} logoOf={logoOf} />

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

          {stats.finals.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="card-title">Final nəticəsi</div>
              <div className="stack">
                {stats.finals.map((m) => {
                  const played = matchPlayed(m)
                  return (
                    <div className="match-row final" key={m.id}>
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
          )}

          <div style={{ marginTop: 12 }}>
            <div className="card-title">Statistika</div>
            <div className="arch-stats">
              <div className="arch-stat"><span className="v">{stats.played.length}</span><span className="l">Oyun</span></div>
              <div className="arch-stat"><span className="v">{stats.goals}</span><span className="l">Qol</span></div>
              <div className="arch-stat"><span className="v">{t.teamIds?.length || 0}</span><span className="l">Komanda</span></div>
              <div className="arch-stat"><span className="v">{rounds.length}</span><span className="l">Tur</span></div>
            </div>
          </div>
        </div>
      )}

      {onDelete && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(t.id)}>Arxivdən sil</button>
        </div>
      )}
    </div>
  )
}
