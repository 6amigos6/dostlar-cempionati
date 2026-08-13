import React, { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, Modal, DeleteGate, EmptyState } from '../components.jsx'
import { ArchiveSection } from '../lib/archive.jsx'
import { uploadImage } from '../lib/upload.js'
import { computeStandings, matchPlayed } from '../lib/logic.js'

const TABS = ['Komandalar', 'Turnir', 'Tarixçə']

export default function Admin() {
  const [tab, setTab] = useState('Turnir')
  return (
    <div>
      <div className="section-title">
        <h2>Admin Panel</h2>
      </div>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Komandalar' && <TeamsTab />}
      {tab === 'Turnir' && <TournamentTab />}
      {tab === 'Tarixçə' && <ArchiveTab />}
    </div>
  )
}

// ================= KOMANDALAR =================
function TeamsTab() {
  const { teamList, activeTournament, addTeam, updateTeam, deleteTeam, authUid, notify } = useApp()
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const inTournament = new Set(activeTournament?.teamIds || [])
  const isOwner = (t) => !!authUid && t.ownerId === authUid

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span className="muted" style={{ fontSize: 12 }}>{teamList.length} komanda</span>
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ mode: 'add' })}>+ Əlavə et</button>
      </div>

      {teamList.length === 0
        ? <EmptyState title="Komanda yoxdur" sub="'Əlavə et' düyməsi ilə komanda yaradın." />
        : (
          <div className="stack">
            {teamList.map((t) => {
              const playing = inTournament.has(t.id)
              const owner = isOwner(t)
              return (
                <div className="card team-card" key={t.id}>
                  <div className="team-card-main">
                    <TeamLogo team={t} size={40} />
                    <div className="team-card-info">
                      <div className="team-card-name">{t.name}</div>
                      <div className="team-card-sub">
                        {playing
                          ? <span className="chip chip-live">Turnirdə</span>
                          : <span className="chip chip-pending">Hazır</span>}
                        {!owner && <span className="chip">Sahib deyilsiniz</span>}
                      </div>
                    </div>
                  </div>
                  <div className="team-card-actions">
                    {owner ? (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => setForm({ mode: 'edit', team: t })}>Redaktə et</button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={playing}
                          title={playing ? 'Turnirdəki komanda silinə bilməz' : undefined}
                          onClick={() => setDeleting(t)}
                        >Sil</button>
                      </>
                    ) : (
                      <span className="muted" style={{ fontSize: 11 }}>Yalnız sahib dəyişə bilər</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {form && (
        <TeamForm
          initial={form.mode === 'edit' ? form.team : null}
          onClose={() => setForm(null)}
          onSubmit={async ({ name, logoUrl }) => {
            if (form.mode === 'edit') {
              await updateTeam(form.team.id, { name, logoUrl })
              notify('Komanda yeniləndi')
            } else {
              await addTeam(name, logoUrl)
              notify('Komanda əlavə edildi')
            }
          }}
        />
      )}

      {deleting && (
        <DeleteGate
          title="Komandanı sil"
          hint={`"${deleting.name}" komandası tam silinəcək. Bu əməliyyat geri alına bilməz.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => { await deleteTeam(deleting.id); notify('Komanda silindi') }}
        />
      )}
    </div>
  )
}

function TeamForm({ initial, onClose, onSubmit }) {
  const { notify } = useApp()
  const [name, setName] = useState(initial?.name || '')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(initial?.logoUrl || '')
  const [busy, setBusy] = useState(false)

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { notify('Yalnız şəkil faylı seçə bilərsiniz'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      let logoUrl = preview
      if (file) logoUrl = await uploadImage(file)
      await onSubmit({ name: name.trim(), logoUrl })
      onClose()
    } catch (err) {
      notify(err.message || 'Yüklənmə uğursuz oldu')
      setBusy(false)
    }
  }

  return (
    <Modal title={initial ? 'Komandanı redaktə et' : 'Komanda əlavə et'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Komanda adı</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="məs. Alov FC" autoFocus />
        </div>
        <div className="field">
          <label>Profil şəkli (isteğe bağlı)</label>
          <div className="upload-row">
            {preview && <img src={preview} className="upload-preview" alt="" />}
            <label className="btn btn-outline btn-sm">
              {preview ? 'Şəkli dəyiş' : 'Şəkil seç'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
            </label>
            {preview && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setPreview('') }}>Şəkli sil</button>
            )}
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={!name.trim() || busy}>
          {busy ? 'Yüklənir...' : initial ? 'Yadda saxla' : 'Əlavə et'}
        </button>
      </form>
    </Modal>
  )
}

// ================= TURNİR =================
function TournamentTab() {
  const { activeTournament, teamList, archiveCurrent, startTournament, finishTournament, deleteTournament, recordResult, notify } = useApp()
  const [selected, setSelected] = useState(null)
  const [resultFor, setResultFor] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const ask = (title, onConfirm) => setConfirm({ title, onConfirm })

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
  const nameOf = (id) => teamList.find((x) => x.id === id)?.name || t?.teamsInfo?.[id]?.name || 'TBD'

  if (!activeTournament) {
    const sel = selected || teamList.map((x) => x.id)
    async function start() {
      await startTournament(sel)
      setSelected(null)
      notify('Turnir başladı!')
    }
    return (
      <div>
        <EmptyState title="Aktiv turnir yoxdur" sub="Komandaları seçin — sistem təsadüfi qarşılaşmaları avtomatik quracaq." />
        {teamList.length < 2
          ? <div className="card"><EmptyState title="Ən azı 2 komanda lazımdır" sub="Əvvəlcə 'Komandalar' bölməsindən komanda əlavə edin." /></div>
          : (
            <div className="card">
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <div className="card-title" style={{ margin: 0 }}>İştirak edən komandalar</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(sel.length === teamList.length ? [] : teamList.map((x) => x.id))}>
                  {sel.length === teamList.length ? 'Hamısını sil' : 'Hamısını seç'}
                </button>
              </div>
              <div className="team-pick-grid">
                {teamList.map((tm) => {
                  const s = sel.includes(tm.id)
                  return (
                    <button
                      type="button"
                      key={tm.id}
                      className={`team-pick ${s ? 'selected' : ''}`}
                      onClick={() => setSelected((cur) => {
                        const base = cur ?? teamList.map((x) => x.id)
                        return s ? base.filter((x) => x !== tm.id) : [...base, tm.id]
                      })}
                    >
                      <TeamLogo team={tm} size={28} />
                      <span className="team-pick-name">{tm.name}</span>
                      <span className="team-pick-check">{s ? '✓' : ''}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex-between" style={{ marginTop: 12 }}>
                <span className="muted" style={{ fontSize: 12 }}>{sel.length} komanda seçildi</span>
                <button className="btn btn-primary" disabled={sel.length < 2} onClick={start}>Turniri başlat</button>
              </div>
            </div>
          )}
      </div>
    )
  }

  return (
    <div>
      <div className="card card-elevated">
        <div className="flex-between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{t.name} {t.season} <span className={`chip ${t.finished ? 'chip-done' : 'chip-pending'}`}>{t.finished ? 'BİTDİ' : `TUR ${t.round}`}</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {!t.finished && <button className="btn btn-gold btn-sm" onClick={() => ask('Turniri bitir', () => finishTournament(t.id))}>🏁 Turniri bitir</button>}
            <button className="btn btn-primary btn-sm" onClick={() => ask('Yeni turnir başlat — köhnəsi arxivlənəcək', async () => { await archiveCurrent(); notify('Köhnə turnir arxivləndi') })}>+ Yeni turnir</button>
            <button className="btn btn-danger btn-sm" onClick={() => setDeleting(true)}>🗑 Sil</button>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 11.5 }}>{t.teamIds?.length || 0} komanda · hər turda ən güclülər bir-biri ilə oynayır</div>
      </div>

      {t.champion && (
        <div className="card card-elevated" style={{ textAlign: 'center', padding: 18 }}>
          <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Çempion</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
            <TeamLogo team={{ id: t.champion, name: nameOf(t.champion) }} size={36} />
            <span style={{ fontSize: 18, fontWeight: 800 }}>{nameOf(t.champion)}</span>
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
                <TeamLogo team={teamList.find((x) => x.id === r.teamId)} size={22} />
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
          <div className="card-title">{label}</div>
          <div className="stack">
            {ms.map((m) => {
              const played = matchPlayed(m)
              return (
                <div className={`res-row ${played ? 'played' : ''}`} key={m.id}>
                  <div className="res-main">
                    <div className="res-teams">{nameOf(m.teamA)} <span className="res-vs">vs</span> {nameOf(m.teamB)}</div>
                    <div className="res-score">{played ? `${m.scoreA} : ${m.scoreB}` : 'Nəticə gözlənilir'}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setResultFor(m)}>
                    {played ? 'Düzəlt' : 'Nəticə daxil et'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {resultFor && (
        <ResultForm
          tournamentId={t.id}
          match={resultFor}
          nameOf={nameOf}
          onClose={() => setResultFor(null)}
        />
      )}

      {confirm && (
        <Modal title="Təsdiq" onClose={() => setConfirm(null)}>
          <p className="muted" style={{ margin: '0 0 16px' }}>{confirm.title}?</p>
          <div className="field-row">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirm(null)}>Ləğv et</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { confirm.onConfirm(); setConfirm(null) }}>Təsdiq et</button>
          </div>
        </Modal>
      )}

      {deleting && (
        <DeleteGate
          title="Turniri sil"
          hint="Aktiv turnir tam silinəcək (arxivə köçürülmür). Bu əməliyyat geri alına bilməz."
          onClose={() => setDeleting(false)}
          onConfirm={async () => { await deleteTournament(t.id); notify('Turnir silindi') }}
        />
      )}
    </div>
  )
}

function ResultForm({ tournamentId, match, nameOf, onClose }) {
  const { recordResult } = useApp()
  const [a, setA] = useState(match.scoreA != null ? String(match.scoreA) : '')
  const [b, setB] = useState(match.scoreB != null ? String(match.scoreB) : '')

  async function submit(e) {
    e.preventDefault()
    if (a === '' || b === '' || Number(a) < 0 || Number(b) < 0) return
    await recordResult(tournamentId, match.id, Number(a), Number(b))
    onClose()
  }

  return (
    <Modal title="Nəticə daxil et" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field-row" style={{ alignItems: 'center' }}>
          <div className="field" style={{ textAlign: 'center' }}>
            <label>{nameOf(match.teamA)}</label>
            <input type="number" min="0" inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} placeholder="0" style={{ textAlign: 'center', fontSize: 20 }} autoFocus />
          </div>
          <span style={{ fontSize: 18, color: 'var(--ink-dim)' }}>:</span>
          <div className="field" style={{ textAlign: 'center' }}>
            <label>{nameOf(match.teamB)}</label>
            <input type="number" min="0" inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} placeholder="0" style={{ textAlign: 'center', fontSize: 20 }} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={a === '' || b === ''}>Nəticəni yadda saxla</button>
      </form>
    </Modal>
  )
}

// ================= TARİXÇƏ =================
function ArchiveTab() {
  const { archiveList, teams, deleteArchivedTournament, notify } = useApp()
  const [deleting, setDeleting] = useState(null)
  return (
    <div className="stack">
      <ArchiveSection items={archiveList} teams={teams} onDelete={(id) => setDeleting(id)} />
      {deleting && (
        <DeleteGate
          title="Arxivdən sil"
          hint="Bu turnir arxivdən tam silinəcək. Bu əməliyyat geri alına bilməz."
          onClose={() => setDeleting(null)}
          onConfirm={async () => { await deleteArchivedTournament(deleting); notify('Arxivdən silindi') }}
        />
      )}
    </div>
  )
}
