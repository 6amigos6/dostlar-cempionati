import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, EmptyState, StandingsTable } from '../components.jsx'
import { Bracket } from '../lib/bracket.jsx'
import { ArchiveSection } from '../lib/archive.jsx'
import { computeStandings, matchPlayed } from '../lib/logic.js'

export default function Home() {
  const { activeTournament, teams, archiveList } = useApp()
  const t = activeTournament

  const matches = useMemo(() => Object.values(t?.matches || {}), [t])
  const standings = useMemo(() => computeStandings(t?.teamIds || [], matches, t?.pointsRule), [t, matches])

  const rounds = useMemo(() => {
    const map = {}
    matches.forEach((m) => {
      const key = typeof m.round === 'number' ? `Tur ${m.round}` : (m.round || 'Oyunlar')
      ;(map[key] = map[key] || []).push(m)
    })
    return Object.entries(map)
  }, [matches])

  const currentRoundLabel = useMemo(() => {
    const pending = rounds.find(([, ms]) => ms.some((m) => !matchPlayed(m)))
    return pending ? pending[0] : null
  }, [rounds])

  return (
    <div className="tv">
      {!t ? (
        <>
          <NoTournament archiveList={archiveList} teams={teams} />
          {archiveList.length > 0 && (
            <div className="card">
              <div className="card-title">Tarixçə</div>
              <ArchiveSection items={archiveList} teams={teams} />
            </div>
          )}
        </>
      ) : (
        <>
          <TournamentHeader t={t} currentRoundLabel={currentRoundLabel} />
          {t.finished && <ChampionSection t={t} teams={teams} standings={standings} />}

          <div className="card">
            <div className="card-title">Xal cədvəli</div>
            <StandingsTable
              standings={standings}
              nameOf={(id) => teams?.[id]?.name || t.teamsInfo?.[id]?.name || 'TBD'}
              logoOf={(id) => teams?.[id] || { name: t.teamsInfo?.[id]?.name || 'TBD' }}
            />
          </div>

          <PairingsSection t={t} matches={matches} teams={teams} rounds={rounds} />

          {archiveList.length > 0 && (
            <div className="card">
              <div className="card-title">Tarixçə</div>
              <ArchiveSection items={archiveList} teams={teams} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TournamentHeader({ t, currentRoundLabel }) {
  return (
    <div className="tournament-head">
      <div className="tournament-eyebrow">DOSTLAR ÇEMPİONATI</div>
      <div className="tournament-name">{t.name} {t.season}</div>
      <div className={`tournament-status ${t.finished ? 'done' : ''}`}>
        {t.finished ? 'Bitdi' : currentRoundLabel ? `Cari tur: ${currentRoundLabel}` : 'Turnir bitdi'}
      </div>
    </div>
  )
}

// Çempion bölməsi: böyük və vizual — şəkil, ad, turnir, ümumi statistika.
function ChampionSection({ t, teams, standings }) {
  const champ = t.champion ? (t.teamsInfo?.[t.champion] || teams?.[t.champion]) : null
  if (!champ) return null
  const row = standings.find((r) => r.teamId === t.champion)

  return (
    <div className="champion-section">
      <div className="champion-ring" aria-hidden="true" />
      <div className="champion-eyebrow">ÇEMPİON</div>
      <div className="champion-logo">
        <TeamLogo team={champ} size={92} />
      </div>
      <div className="champion-name">{champ.name}</div>
      <div className="champion-tourney">{t.name} {t.season}</div>
      <div className="champion-stats">
        <ChampionStat label="Oyun" value={row?.played ?? '–'} />
        <ChampionStat label="Qələbə" value={row?.won ?? '–'} />
        <ChampionStat label="Heç-heçə" value={row?.drawn ?? '–'} />
        <ChampionStat label="Məğlubiyyət" value={row?.lost ?? '–'} />
        <ChampionStat label="Xal" value={row?.pts ?? '–'} gold />
      </div>
    </div>
  )
}

function ChampionStat({ label, value, gold }) {
  return (
    <div className={`champion-stat ${gold ? 'gold' : ''}`}>
      <div className="champion-stat-value">{value}</div>
      <div className="champion-stat-label">{label}</div>
    </div>
  )
}

function NoTournament({ archiveList, teams }) {
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

// ================= EŞLƏŞMƏ =================
function PairingsSection({ t, matches, teams, rounds }) {
  const { notify } = useApp()
  const bracketRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const pendingRounds = useMemo(
    () => [...new Set(matches.filter((m) => !matchPlayed(m)).map((m) => m.round))].sort((a, b) => a - b),
    [matches],
  )
  const currentRound = pendingRounds.length ? pendingRounds[0] : null
  const revealKey = t.id + ':' + currentRound
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    if (currentRound == null) return
    const stored = localStorage.getItem(`eslesme_reveal_${t.id}_${currentRound}`)
    if (stored) return
    localStorage.setItem(`eslesme_reveal_${t.id}_${currentRound}`, '1')
    setRevealing(true)
  }, [currentRound, t.id])

  const nameOf = (id) => teams?.[id]?.name || t.teamsInfo?.[id]?.name || 'TBD'

  async function download() {
    if (!bracketRef.current) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(bracketRef.current, {
        useCORS: true,
        backgroundColor: '#0C1424',
        scale: 2,
      })
      const a = document.createElement('a')
      a.download = `eslesme-${t.season || 'cempionat'}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
      notify('Şəkil yükləndi')
    } catch (e) {
      notify('Şəkil yaradıla bilmədi')
    } finally {
      setDownloading(false)
    }
  }

  // Son tur "Final", qalan turlar "Tur N" olaraq göstərilir.
  const maxRound = useMemo(() => {
    let mx = 0
    matches.forEach((m) => { if (typeof m.round === 'number' && m.round > mx) mx = m.round })
    return mx
  }, [matches])

  const bracketRounds = rounds.map(([label, ms]) => {
    const num = typeof ms[0]?.round === 'number' ? ms[0].round : null
    const name = num != null && num === maxRound ? 'Final' : label
    return { id: String(label), name, matches: ms }
  })

  const champ = t.champion ? (t.teamsInfo?.[t.champion] || teams?.[t.champion]) : null

  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div className="card-title" style={{ margin: 0 }}>Eşləşmə</div>
        {matches.length > 0 && !revealing && (
          <button className="btn btn-gold btn-sm" onClick={download} disabled={downloading}>
            {downloading ? 'Hazırlanır...' : 'Yüklə'}
          </button>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="muted" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>
          Hələ qarşılaşma yoxdur.
        </div>
      ) : revealing && currentRound != null ? (
        <PairingReveal
          key={revealKey}
          pairs={rounds.find(([label]) => label === `Tur ${currentRound}`)?.[1] || []}
          nameOf={nameOf}
          teams={teams}
          onDone={() => setRevealing(false)}
        />
      ) : (
        <>
          <div className="bk-scroll">
            <div className="board" ref={bracketRef}>
              <Bracket
                rounds={bracketRounds}
                matchWidth={190}
                connectorWidth={32}
                matchGap={8}
                renderRoundHeader={(r) => <div className="round-header">{r.name}</div>}
                renderMatch={(m) => <BracketMatchCard m={m} nameOf={nameOf} teams={teams} />}
              />
            </div>
          </div>

          {t.finished && champ && (
            <div className="pairing-champion">
              <div className="pairing-champion-eyebrow">CHAMPION</div>
              <div className="pairing-champion-main">
                <TeamLogo team={champ} size={44} />
                <div className="pairing-champion-name">{champ.name}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BracketMatchCard({ m, nameOf, teams }) {
  const played = matchPlayed(m)
  const aWin = played && m.scoreA > m.scoreB
  const bWin = played && m.scoreB > m.scoreA
  const row = (teamId, score, won) => (
    <div className={`bk-team ${won ? 'won' : ''}`}>
      <TeamLogo team={teams?.[teamId]} size={18} />
      <span className="bk-name">{nameOf(teamId)}</span>
      <span className="bk-score">{score != null ? score : '–'}</span>
    </div>
  )
  return (
    <div className={`bk-match ${played ? 'played' : ''}`}>
      {row(m.teamA, played ? m.scoreA : null, aWin)}
      <div className="bk-vs">vs</div>
      {row(m.teamB, played ? m.scoreB : null, bWin)}
    </div>
  )
}

// Cütləşmələrin animasiyalı açılışı: hər cüt bir-bir "paylanır", sonra bracket görünür.
function PairingReveal({ pairs, nameOf, teams, onDone }) {
  const [count, setCount] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (count >= pairs.length) {
      const t = setTimeout(() => onDoneRef.current(), 700)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCount((c) => c + 1), 620)
    return () => clearTimeout(t)
  }, [count, pairs.length])

  return (
    <div className="reveal">
      <div className="reveal-title">EŞLƏŞMƏ</div>
      {pairs.slice(0, count).map((p, i) => (
        <div className="reveal-card" key={i}>
          <div className="reveal-team">
            <TeamLogo team={teams?.[p.teamA]} size={34} />
            <span>{nameOf(p.teamA)}</span>
          </div>
          <div className="reveal-vs">VS</div>
          <div className="reveal-team">
            <TeamLogo team={teams?.[p.teamB]} size={34} />
            <span>{nameOf(p.teamB)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
