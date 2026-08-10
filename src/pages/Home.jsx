import React from 'react'
import { useApp } from '../store.jsx'
import TournamentView from '../components/TournamentView.jsx'
import { EmptyState } from '../components.jsx'

export default function Home() {
  const { activeTournament, teams, archiveList } = useApp()

  // Aktiv turnir yoxdursa, son bitmiş turnir (çempion) göstərilir
  const t = activeTournament || archiveList[0]

  if (!t) {
    return (
      <EmptyState
        emoji="🏆"
        title="Hələ çempionat yoxdur"
        sub="Çempionat yaradıldıqda turnir görünüşü burada göstəriləcək."
      />
    )
  }

  return (
    <div>
      <TournamentView tournament={t} teams={teams} />
    </div>
  )
}
