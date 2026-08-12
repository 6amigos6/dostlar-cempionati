import React, { useMemo } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState } from '../components.jsx'
import { computeStandings, matchPlayed } from '../lib/logic.js'

export default function Home() {
  const { activeTournament, teams, archiveList } = useApp()
  const t = activeTournament

  const matches = useMemo(() => Object.values(t?.matches || {}), [t])
  const standings = useMemo(() => computeStandings(t?.teamIds || [], matches, t?.pointsRule), [t, matches])

  // Turlara görə qruplaşdırma
  const rounds = useMemo(() => {
    const map = {}
    matches.forEach((m) => {
      const key = typeof m.round === 'number' ? `Tur ${m.round}` : (m.round || 'Oyunlar')
      ;(map[key] = map[key] || []).push(m)
    })
    return Object.entries(map)
  }, [matches])

  // Cari tur = hələ oynanılmamış ən aşağı tur
  const currentRoundLabel = useMemo(() => {
    const pending = rounds.find(([, ms]) => ms.some((m) => !matchPlayed(m)))
    return pending ? pending[0] : null
  }, [rounds])

  if (!t) {
    const last = archiveList[0]
    const champ = last ? (last.teamsInfo?.[last.champion] || teams?.[last.champion]) : null
    if (!champ) {
      return (
        <EmptyState
          title="Aktiv turnir yoxdur"
          sub="Admin panelindən komandaları əlavə edib turniri başlada bilərsiniz."
        />
      )
    }
    return (
      <div className="card card-elevated" style={{ textAlign: 'center', padding: 24 }}>
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Son çempion</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
          <TeamLogo team={champ} size={40} />
          <span style={{ fontSize: 20, fontWeight: 800 }}>{champ.name}</span>
        </div>
        <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{last.name} · {last.season}</div>
      </div>
    )
  }

  const nameOf = (id) => teams?.[id]?.name || t.teamsInfo?.[id]?.name || 'TBD'
  const champ = t.champion ? (t.teamsInfo?.[t.champion] || teams?.[t.champion]) : null

  return (
    <div className="tv">
      <div className="tournament-head">
        <div className="tournament-eyebrow">DOSTLAR ÇEMPİONATI</div>
        <div className="tournament-name">{t.name} {t.season}</div>
        <div className={`tournament-status ${t.finished ? 'done' : ''}`}>
          {t.finished ? 'Bitdi' : currentRoundLabel ? `Cari tur: ${currentRoundLabel}` : 'Turnir bitdi'}
        </div>
      </div>

      {champ && (
        <div className="champion-banner">
          <TeamLogo team={champ} size={48} />
          <div>
            <div className="champion-label">ÇEMPİON</div>
            <div className="champion-name">{champ.name}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Xal cədvəli</div>
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
                <TeamLogo team={teams?.[r.teamId]} size={22} />
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
      </div>

      {rounds.map(([label, ms]) => (
        <div className="card" key={label}>
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <div className="card-title" style={{ margin: 0 }}>{label}</div>
            {label === currentRoundLabel && !t.finished && <span className="chip chip-live">NÖVBƏDƏ</span>}
          </div>
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
                  <span className={`chip ${played ? 'chip-done' : 'chip-pending'}`}>{played ? 'BİTDİ' : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
