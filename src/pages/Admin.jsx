import React, { useMemo, useRef, useState } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, Modal, DeleteGate, EmptyState, StandingsTable, CheckIcon } from '../components.jsx'
import { ArchiveSection } from '../lib/archive.jsx'
import { uploadImage } from '../lib/upload.js'
import { computeStandings, matchPlayed, tournamentLabel } from '../lib/logic.js'

const TABS = ['Komandalar', 'Turnir', 'Tarixçə']

export default function Admin() {
  const [tab, setTab] = useState('Turnir')
  const [hiddenOpen, setHiddenOpen] = useState(false)
  const [codePrompt, setCodePrompt] = useState(false)
  const tapsRef = useRef({ count: 0, last: 0 })

  // Gizli giriş: "Komandalar" sözünə ardıcıl 3 toxunuş kod ekranını açır.
  function onTeamsTabTap() {
    const now = Date.now()
    if (now - tapsRef.current.last > 1000) tapsRef.current.count = 0
    tapsRef.current.last = now
    tapsRef.current.count += 1
    setTab('Komandalar')
    if (tapsRef.current.count >= 3) {
      tapsRef.current.count = 0
      setCodePrompt(true)
    }
  }

  if (hiddenOpen) {
    return (
      <div>
        <div className="section-title">
          <h2>Gizli idarəetmə</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setHiddenOpen(false)}>Bağla</button>
        </div>
        <HiddenAdminView />
      </div>
    )
  }

  return (
    <div>
      <div className="section-title">
        <h2>Admin Panel</h2>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={t === 'Komandalar' ? onTeamsTabTap : () => setTab(t)}
          >{t}</button>
        ))}
      </div>
      {tab === 'Komandalar' && <TeamsTab />}
      {tab === 'Turnir' && <TournamentTab />}
      {tab === 'Tarixçə' && <ArchiveTab />}

      {codePrompt && (
        <SecretGate
          onSuccess={() => setHiddenOpen(true)}
          onClose={() => setCodePrompt(false)}
        />
      )}
    </div>
  )
}

// Gizli idarəetmə bölməsinə giriş kodu ekranı. Kod: 66.
function SecretGate({ onSuccess, onClose }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (code.trim() === '66') {
      onSuccess()
      onClose()
    } else {
      setErr(true)
    }
  }

  return (
    <Modal title="Gizli giriş" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
          Bu bölməyə giriş kodu tələb olunur.
        </p>
        <div className="field">
          <label>Giriş kodu</label>
          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(e) => { setCode(e.target.value); setErr(false) }}
            placeholder="••••"
            autoFocus
            style={{ letterSpacing: 4, fontSize: 16, textAlign: 'center' }}
          />
        </div>
        {err && <div style={{ color: 'var(--live)', fontSize: 12, marginBottom: 10 }}>Kod yanlışdır.</div>}
        <div className="field-row">
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Ləğv et</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Daxil ol</button>
        </div>
      </form>
    </Modal>
  )
}

// ================= GİZLİ KOMANDA İDARƏETMƏSİ =================
// Komandaların ad, profil şəkli, məlumat və silinmə idarəsi.
function HiddenAdminView() {
  const { teamList, activeTournament, addTeam, updateTeam, deleteTeam, notify } = useApp()
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const inTournament = new Set(activeTournament?.teamIds || [])

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
            {teamList.map((tm) => {
              const playing = inTournament.has(tm.id)
              return (
                <div className="card team-card" key={tm.id}>
                  <div className="team-card-main">
                    <TeamLogo team={tm} size={40} />
                    <div className="team-card-info">
                      <div className="team-card-name">{tm.name}</div>
                      <div className="team-card-sub">
                        {playing
                          ? <span className="chip chip-live">Turnirdə</span>
                          : <span className="chip chip-pending">Hazır</span>}
                        {tm.info && <span className="chip">{tm.info}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="team-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setForm({ mode: 'edit', team: tm })}>Redaktə et</button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={playing}
                      title={playing ? 'Turnirdəki komanda silinə bilməz' : undefined}
                      onClick={() => setDeleting(tm)}
                    >Sil</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {form && (
        <TeamForm
          showInfo
          initial={form.mode === 'edit' ? form.team : null}
          onClose={() => setForm(null)}
          onSubmit={async ({ name, logoUrl, info }) => {
            try {
              if (form.mode === 'edit') {
                await updateTeam(form.team.id, { name, logoUrl, info })
                notify('Komanda yeniləndi')
              } else {
                await addTeam(name, logoUrl, info)
                notify('Komanda əlavə edildi')
              }
            } catch {
              notify('Əməliyyat uğursuz oldu')
            }
          }}
        />
      )}

      {deleting && (
        <DeleteGate
          title="Komandanı sil"
          hint={`"${deleting.name}" komandası tam silinəcək. Bu əməliyyat geri alına bilməz.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => { try { await deleteTeam(deleting.id); notify('Komanda silindi') } catch { notify('Əməliyyat uğursuz oldu') } }}
        />
      )}
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

function TeamForm({ initial, showInfo, onClose, onSubmit }) {
  const { notify } = useApp()
  const [name, setName] = useState(initial?.name || '')
  const [info, setInfo] = useState(initial?.info || '')
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
      await onSubmit({ name: name.trim(), logoUrl, info })
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
        {showInfo && (
          <div className="field">
            <label>Məlumat (isteğe bağlı)</label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="Komanda haqqında qısa məlumat"
              rows={2}
            />
          </div>
        )}
        <button className="btn btn-primary btn-block" disabled={!name.trim() || busy}>
          {busy ? 'Yüklənir...' : initial ? 'Yadda saxla' : 'Əlavə et'}
        </button>
      </form>
    </Modal>
  )
}

// ================= TURNİR =================
function TournamentTab() {
  const { activeTournament, teamList, archiveCurrent, startTournament, finishTournament, deleteTournament, notify } = useApp()
  const [selected, setSelected] = useState(null)
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
        {teamList.length < 2 ? (
          <div className="card">
            <EmptyState title="Ən azı 2 komanda lazımdır" sub="Əvvəlcə 'Komandalar' bölməsindən komanda əlavə edin." />
          </div>
        ) : (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div className="card-title" style={{ margin: 0 }}>Turnir üçün komandalar</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>İştirak edəcək komandaları seçin</div>
              </div>
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
                    <span className={`team-pick-check ${s ? 'on' : ''}`}>{s && <CheckIcon size={11} />}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex-between" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
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
          <div style={{ fontWeight: 800, fontSize: 14 }}>{tournamentLabel(t)} <span className={`chip ${t.finished ? 'chip-done' : 'chip-pending'}`}>{t.finished ? 'BİTDİ' : `TUR ${t.round}`}</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {!t.finished && <button className="btn btn-gold btn-sm" onClick={() => ask('Turniri bitir', () => finishTournament(t.id))}>Turniri bitir</button>}
            <button className="btn btn-primary btn-sm" onClick={() => ask('Yeni turnir başlat — köhnəsi arxivlənəcək', async () => { await archiveCurrent(); notify('Köhnə turnir arxivləndi') })}>+ Yeni turnir</button>
            <button className="btn btn-danger btn-sm" onClick={() => setDeleting(true)}>Sil</button>
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
        <StandingsTable
          standings={standings}
          nameOf={nameOf}
          logoOf={(id) => teamList.find((x) => x.id === id) || { name: nameOf(id) }}
        />
      </div>

      {rounds.map(([label, ms]) => (
        <div className="card" key={label}>
          <div className="card-title">{label}</div>
          <div className="stack">
            {ms.map((m) => (
              <InlineResultRow key={m.id} t={t} m={m} nameOf={nameOf} />
            ))}
          </div>
        </div>
      ))}

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

// İnline nəticə daxiletməsi: modal açılmır, ekran tərpənmir — nəticə
// birbaşa qarşılaşma kartının daxilində yazılıb təsdiqlənir.
function InlineResultRow({ t, m, nameOf }) {
  const { recordResult, notify } = useApp()
  const played = matchPlayed(m)
  const [editing, setEditing] = useState(!played)
  const [a, setA] = useState(m.scoreA != null ? String(m.scoreA) : '')
  const [b, setB] = useState(m.scoreB != null ? String(m.scoreB) : '')
  const [busy, setBusy] = useState(false)

  function openEditor() {
    setA(m.scoreA != null ? String(m.scoreA) : '')
    setB(m.scoreB != null ? String(m.scoreB) : '')
    setEditing(true)
  }

  async function save(e) {
    e.preventDefault()
    if (a === '' || b === '' || Number(a) < 0 || Number(b) < 0 || busy) return
    setBusy(true)
    try {
      await recordResult(t.id, m.id, Number(a), Number(b))
      setEditing(false)
    } catch {
      notify('Nəticə yazıla bilmədi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={`res-row inline ${played ? 'played' : ''}`} onSubmit={save}>
      <div className="res-main">
        <div className="res-teams">{nameOf(m.teamA)} <span className="res-vs">vs</span> {nameOf(m.teamB)}</div>
        {editing ? (
          <div className="res-inputs">
            <input
              type="number" min="0" inputMode="numeric"
              value={a} onChange={(e) => setA(e.target.value)}
              placeholder="0" aria-label={`${nameOf(m.teamA)} hesabı`}
            />
            <span className="res-colon">:</span>
            <input
              type="number" min="0" inputMode="numeric"
              value={b} onChange={(e) => setB(e.target.value)}
              placeholder="0" aria-label={`${nameOf(m.teamB)} hesabı`}
            />
          </div>
        ) : (
          <div className="res-score">{m.scoreA} : {m.scoreB}</div>
        )}
      </div>
      {editing ? (
        <div className="res-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Ləğv et</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={a === '' || b === '' || busy}>
            {busy ? 'Yazılır...' : 'Yadda saxla'}
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-primary btn-sm" onClick={openEditor}>
          {played ? 'Düzəlt' : 'Nəticə daxil et'}
        </button>
      )}
    </form>
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
