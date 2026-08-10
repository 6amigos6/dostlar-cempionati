import React, { useState, useRef } from 'react'
import { useApp } from '../store.jsx'
import { Modal, TeamLogo, EmptyState } from '../components.jsx'
import { uploadToCloudinary } from '../lib/upload.js'
import { computeStandings } from '../lib/logic.js'

const TABS = ['Komandalar', 'Çempionat', 'Tarixçə']
const ADMIN_PASSWORD = 'gasham'
const UNLOCK_KEY = 'admin_unlocked'

export default function Admin() {
  const [tab, setTab] = useState('Komandalar')
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')

  const unlock = () => { sessionStorage.setItem(UNLOCK_KEY, '1'); setUnlocked(true) }
  const lock = () => { sessionStorage.removeItem(UNLOCK_KEY); setUnlocked(false) }

  if (!unlocked) return <AdminLogin onUnlock={unlock} />

  return (
    <div>
      <div className="section-title"><h2>Admin Panel</h2><button className="btn btn-ghost btn-sm" onClick={lock}>Çıxış</button></div>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Komandalar' && <TeamsTab />}
      {tab === 'Çempionat' && <ChampionshipTab />}
      {tab === 'Tarixçə' && <HistoryTab />}
    </div>
  )
}

function AdminLogin({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onUnlock()
    } else {
      setErr('Şifrə yanlışdır.')
    }
  }

  return (
    <div className="card card-elevated" style={{ maxWidth: 360, margin: '30px auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: 30 }}>🔐</span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginTop: 8 }}>Admin Girişi</div>
        <div className="muted" style={{ fontSize: 12 }}>Şifrəni daxil edin</div>
      </div>
      <form onSubmit={submit}>
        <div className="field"><label>Şifrə</label><input type="password" required autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setErr('') }} /></div>
        {err && <div style={{ color: 'var(--live)', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button className="btn btn-primary btn-block">Daxil ol</button>
      </form>
    </div>
  )
}

// ================= KOMANDALAR =================
function TeamsTab() {
  const { teamList, deleteTeam } = useApp()
  const [editing, setEditing] = useState(null) // null=closed, {}=new, {...}=edit
  return (
    <div>
      <button className="btn btn-primary btn-block" onClick={() => setEditing({})}>+ Komanda əlavə et</button>
      <div style={{ marginTop: 12 }} className="stack-8">
        {teamList.length === 0 && <EmptyState emoji="🛡️" title="Komanda yoxdur" sub="Komanda əlavə edin — gələcək çempionatlarda yenidən istifadə olunacaq." />}
        {teamList.map((t) => (
          <div className="card flex-between" key={t.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TeamLogo team={t} size={38} />
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}>Redaktə</button>
              <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Komandanı silmək istəyirsiniz?')) deleteTeam(t.id) }}>Sil</button>
            </div>
          </div>
        ))}
      </div>
      {editing && <TeamForm team={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function TeamForm({ team, onClose }) {
  const { addTeam, updateTeam, notify } = useApp()
  const isNew = !team.id
  const [form, setForm] = useState({ name: team.name || '', logoUrl: team.logoUrl || '' })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm((f) => ({ ...f, logoUrl: url }))
      notify('Şəkil yükləndi ✅')
    } catch (err) {
      alert(err.message || 'Şəkil yüklənmədi')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function submit(e) {
    e.preventDefault()
    if (isNew) await addTeam(form)
    else await updateTeam(team.id, form)
    onClose()
  }

  return (
    <Modal title={isNew ? 'Komanda əlavə et' : 'Komandanı redaktə et'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Komanda adı</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="məs. Alov FC" /></div>
        <div className="field"><label>Loqo URL</label><input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <button type="button" className="btn btn-outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Yüklənir...' : '📷 Şəkil yüklə'}
          </button>
          {(form.logoUrl || team.logoUrl) && <img src={form.logoUrl} alt="Loqo" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />}
        </div>
        <button className="btn btn-primary btn-block" disabled={uploading}>Yadda saxla</button>
      </form>
    </Modal>
  )
}

// ================= ÇEMPİONAT =================
function ChampionshipTab() {
  const { activeTournament, teamList, teams, startChampionship, generateDraw, finishTournament, recordResult, notify } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [format, setFormat] = useState('groups')
  const [selected, setSelected] = useState([])
  const [resultFor, setResultFor] = useState(null)

  async function start(e) {
    e.preventDefault()
    if (selected.length < 2) { alert('Ən azı 2 komanda seçin'); return }
    await startChampionship(selected, format)
    setCreateOpen(false)
    notify('Çempionat başladı! 🏆')
  }

  if (!activeTournament) {
    return (
      <div>
        <EmptyState emoji="🏆" title="Aktiv çempionat yoxdur" sub="Komandaları seçin — sistem avtomatik püşkatma edib qarşılaşmaları yaradacaq." />
        <button className="btn btn-primary btn-block" onClick={() => { setSelected(teamList.map((t) => t.id)); setCreateOpen(true) }}>+ Çempionat yarat</button>
        {createOpen && (
          <Modal title="Çempionat yarat" onClose={() => setCreateOpen(false)}>
            <form onSubmit={start}>
              <div className="field">
                <label>Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="groups">Qarşılaşma modu (Qruplar + Playoff)</option>
                  <option value="knockout">Birbaşa Playoff</option>
                  <option value="league">Liqa (hər kəs hər kəslə)</option>
                </select>
              </div>
              <div className="field">
                <label>Komandalar ({selected.length} seçildi)</label>
                {teamList.length === 0 && <div className="muted" style={{ fontSize: 12 }}>Əvvəlcə "Komandalar" bölməsindən komanda yaradın.</div>}
                <div className="stack-8" style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
                  {teamList.map((t) => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input type="checkbox" checked={selected.includes(t.id)} onChange={() => setSelected((s) => (s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id]))} />
                      <TeamLogo team={t} size={22} />{t.name}
                    </label>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-block">Çempionatı başlat</button>
            </form>
          </Modal>
        )}
      </div>
    )
  }

  const matches = Object.entries(activeTournament.matches || {}).map(([id, m]) => ({ id, ...m }))
  const rounds = [...new Set(matches.map((m) => m.round))]
  const stageLabel = activeTournament.stage === 'groups' ? 'Qrup mərhələsi' : activeTournament.stage === 'knockout' ? 'Playoff' : 'Liqa'
  const groups = activeTournament.groups || null

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{activeTournament.name} <span className="chip" style={{ marginLeft: 6 }}>{stageLabel}</span></div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => { if (confirm('Püşkatmanı yeniləmək istəyirsiniz? Hazırkı oyunlar silinəcək.')) generateDraw(activeTournament.id) }}>🎲 Püşkat</button>
          <button className="btn btn-gold btn-sm" onClick={() => { if (confirm('Turniri bitirib tarixçəyə köçürmək istəyirsiniz?')) finishTournament(activeTournament.id) }}>🏁 Turniri bitir</button>
        </div>
      </div>

      {groups && (
        <div className="stack-8" style={{ marginBottom: 12 }}>
          {Object.entries(groups).map(([letter, ids]) => {
            const rows = computeStandings(ids, matches.filter((m) => m.group === letter), activeTournament.pointsRule)
            return (
              <div className="card" key={letter}>
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>{letter} QRUPU</div>
                {rows.map((r, i) => (
                  <div className="flex-between" key={r.teamId} style={{ padding: '3px 0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span className="mono muted">{i + 1}</span>
                      <TeamLogo team={teams[r.teamId]} size={20} />{teams[r.teamId]?.name || '—'}
                    </span>
                    <span className="mono" style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.pts} xal</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {rounds.map((round) => (
        <div key={round} className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>{round}</div>
          <div className="stack-8">
            {matches.filter((m) => m.round === round).map((m) => {
              const played = m.scoreA != null && m.scoreB != null
              return (
                <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
                  <div className="flex-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{teams[m.teamA]?.name || 'TBD'} vs {teams[m.teamB]?.name || 'TBD'}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setResultFor(m)}>{played ? 'Nəticəni düzəlt' : 'Nəticə daxil et'}</button>
                  </div>
                  {played && <div className="mono" style={{ fontSize: 14 }}>{m.scoreA} : {m.scoreB}{m.penA != null ? ` (pen. ${m.penA}-${m.penB})` : ''}</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {resultFor && <ResultForm tournamentId={activeTournament.id} match={resultFor} onClose={() => setResultFor(null)} />}
    </div>
  )
}

function ResultForm({ tournamentId, match, onClose }) {
  const { recordResult, teams } = useApp()
  const [scoreA, setScoreA] = useState(match.scoreA ?? 0)
  const [scoreB, setScoreB] = useState(match.scoreB ?? 0)
  const [penA, setPenA] = useState(match.penA ?? '')
  const [penB, setPenB] = useState(match.penB ?? '')
  const isKnockout = !match.group
  const needPen = isKnockout && Number(scoreA) === Number(scoreB)

  async function submit(e) {
    e.preventDefault()
    if (needPen && (penA === '' || penB === '' || penA === penB)) { alert('Penalti nəticəsini daxil edin (fərqli olmalıdır)'); return }
    await recordResult(tournamentId, match.id, {
      scoreA: Number(scoreA), scoreB: Number(scoreB),
      penA: needPen ? Number(penA) : null, penB: needPen ? Number(penB) : null,
    })
    onClose()
  }

  return (
    <Modal title="Nəticə daxil et" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field-row" style={{ alignItems: 'center' }}>
          <div className="field" style={{ textAlign: 'center' }}>
            <label>{teams[match.teamA]?.name}</label>
            <input type="number" min="0" value={scoreA} onChange={(e) => setScoreA(e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} />
          </div>
          <div className="field" style={{ textAlign: 'center' }}>
            <label>{teams[match.teamB]?.name}</label>
            <input type="number" min="0" value={scoreB} onChange={(e) => setScoreB(e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} />
          </div>
        </div>
        {needPen && (
          <div className="field-row">
            <div className="field"><label>Penalti — {teams[match.teamA]?.name}</label><input type="number" min="0" value={penA} onChange={(e) => setPenA(e.target.value)} /></div>
            <div className="field"><label>Penalti — {teams[match.teamB]?.name}</label><input type="number" min="0" value={penB} onChange={(e) => setPenB(e.target.value)} /></div>
          </div>
        )}
        <button className="btn btn-primary btn-block">Nəticəni yadda saxla</button>
      </form>
    </Modal>
  )
}

// ================= TARİXÇƏ =================
function HistoryTab() {
  const { archiveList, teams, deleteArchivedTournament, notify } = useApp()
  return (
    <div>
      {archiveList.length === 0
        ? <EmptyState emoji="🗄️" title="Bitmiş turnir yoxdur" sub="Turnir başa çatdıqda avtomatik burada saxlanılır." />
        : (
          <div className="stack-8">
            {archiveList.map((t) => (
              <div className="card flex-between" key={t.id}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{t.name} · {t.season}</div>
                  <div className="muted" style={{ fontSize: 11 }}>🏆 {t.teamsInfo?.[t.champion]?.name || teams[t.champion]?.name || '—'}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={async () => {
                  if (confirm(`"${t.name}" turnirini silmək istəyirsiniz? Bu əməliyyat geri qaytarılmır.`)) {
                    await deleteArchivedTournament(t.id)
                    notify('Turnir tarixçədən silindi')
                  }
                }}>Sil</button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
