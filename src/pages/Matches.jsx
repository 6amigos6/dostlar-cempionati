import React, { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import { MatchCard, EmptyState } from '../components.jsx'

const FILTERS = ['Hamısı', 'Canlı', 'Planlaşdırılıb', 'Bitib']
const STATUS_MAP = { 'Canlı': 'LIVE', 'Planlaşdırılıb': 'UPCOMING', 'Bitib': 'FINISHED' }

export default function Matches() {
  const { activeTournament, teams } = useApp()
  const [filter, setFilter] = useState('Hamısı')

  const matches = useMemo(() => (activeTournament?.matches ? Object.entries(activeTournament.matches).map(([id, m]) => ({ id, ...m })) : []), [activeTournament])
  const filtered = filter === 'Hamısı' ? matches : matches.filter((m) => m.status === STATUS_MAP[filter])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach((m) => { (map[m.round] = map[m.round] || []).push(m) })
    return map
  }, [filtered])

  if (!activeTournament) return <EmptyState emoji="⚽" title="Aktiv çempionat yoxdur" />

  return (
    <div>
      <div className="section-title"><h2>Qarşılaşmalar</h2></div>
      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {Object.keys(grouped).length === 0
        ? <EmptyState emoji="⚽" title="Bu filtrə uyğun oyun yoxdur" />
        : Object.entries(grouped).map(([round, ms]) => (
          <div key={round}>
            <div className="section-title"><h2>{round}</h2></div>
            {ms.map((m) => <MatchCard key={m.id} match={m} teams={teams} />)}
          </div>
        ))}
    </div>
  )
}
