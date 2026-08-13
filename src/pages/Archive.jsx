import React from 'react'
import { useApp } from '../store.jsx'
import { ArchiveSection } from '../lib/archive.jsx'
import { EmptyState } from '../components.jsx'

// Ayrıca Arxiv bölməsi: yalnız bitmiş turnirlər burada göstərilir.
// Aktiv turnirlə qarışmır — hər turnir tam müstəqil saxlanılır.
export default function Archive() {
  const { archive, archiveList, teams } = useApp()

  if (archive === null) {
    return <div className="loading"><div className="spinner" />Yüklənir...</div>
  }

  return (
    <div>
      <div className="section-title">
        <h2>Arxiv</h2>
      </div>
      {archiveList.length === 0 ? (
        <EmptyState title="Arxiv boşdur" sub="Bitmiş turnirlər avtomatik olaraq burada saxlanılır." />
      ) : (
        <div className="stack">
          <p className="muted" style={{ fontSize: 12.5, margin: '0 0 8px' }}>
            Keçmiş turnirə toxunaraq komandaları, qarşılaşmaları, nəticələri, xal cədvəlini və çempionu görə bilərsiniz.
          </p>
          <ArchiveSection items={archiveList} teams={teams} />
        </div>
      )}
    </div>
  )
}
