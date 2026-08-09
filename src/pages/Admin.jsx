import React, { useState, useMemo } from 'react'
import { useApp } from '../store.jsx'
import { Modal, TeamLogo, StatusBadge, EmptyState } from '../components.jsx'
import { seedDemoData, wipeAllData } from '../data/seed.js'

const TABS = ['Dashboard', 'Komandalar', 'Oyunlar', 'Tənzimləmələr']
const ADMIN_PASSWORD = 'gasham'
const UNLOCK_KEY = 'admin_unlocked'

export default function Admin() {
  const [tab, setTab] = useState('Dashboard')
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')

  const unlock = () => { sessionStorage.setItem(UNLOCK_KEY, '1'); setUnlocked(true) }
  const lock = () => { sessionStorage.removeItem(UNLOCK_KEY); setUnlocked(false) }

  if (!unlocked) return <AdminLogin onUnlock={unlock} />

  return (
    <div>
      <div className="section-title"><h2>Admin Panel</h2><LogoutBtn onLogout={lock} /></div>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Dashboard' && <Dashboard />}
      {tab === 'Komandalar' && <TeamsAdmin />}
      {tab === 'Oyunlar' && <MatchesAdmin />}
      {tab === 'Tənzimləmələr' && <SettingsAdmin />}
    </div>
  )
}

function LogoutBtn({ onLogout }) {
  return <button className="btn btn-ghost btn-sm" onClick={onLogout}>Çıxış</button>
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

function Dashboard() {
  const { teamList, activeTournament } = useApp()
  const matches = activeTournament?.matches ? Object.values(activeTournament.matches) : []
  const played = matches.filter((m) => m.status === 'FINISHED').length
  const upcoming = matches.filter((m) => m.status === 'UPCOMING').length
  const stats = [
    ['Aktiv turnir', activeTournament?.name || '—'],
    ['Komanda sayı', teamList.length],
    ['Oynanmış oyunlar', played],
    ['Qarşıdakı oyunlar', upcoming],
  ]
  return (
    <div className="grid-2">
      {stats.map(([label, val]) => (
        <div className="card" key={label}>
          <div className="muted" style={{ fontSize: 11 }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
        </div>
      ))}
    </div>
  )
}

// ================= TEAMS =================
function TeamsAdmin() {
  const { teamList, deleteTeam } = useApp()
  const [editing, setEditing] = useState(null)
  return (
    <div>
      <button className="btn btn-primary btn-block" onClick={() => setEditing({})}>+ Komanda əlavə et</button>
      <div style={{ marginTop: 12 }} className="stack-8">
        {teamList.length === 0 && <EmptyState emoji="🛡️" title="Komanda yoxdur" />}
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
  const { addTeam, updateTeam } = useApp()
  const isNew = !team.id
  const [form, setForm] = useState({ name: team.name || '', color: team.color || '#1FA35C', logoUrl: team.logoUrl || '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    if (isNew) await addTeam(form)
    else await updateTeam(team.id, form)
    onClose()
  }
  return (
    <Modal title={isNew ? 'Komanda əlavə et' : 'Komandanı redaktə et'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Komanda adı</label><input required value={form.name} onChange={set('name')} /></div>
        <div className="field-row">
          <div className="field"><label>Rəng</label><input type="color" value={form.color} onChange={set('color')} style={{ height: 44, padding: 4 }} /></div>
          <div className="field"><label>Loqo URL (opsional)</label><input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." /></div>
        </div>
        <button className="btn btn-primary btn-block">Yadda saxla</button>
      </form>
    </Modal>
  )
}

// ================= MATCHES =================
function MatchesAdmin() {
  const {
    activeTournament, teams, updateMatch, deleteMatch, addMatch, setMatchLive, recordResult,
  } = useApp()
  const [resultFor, setResultFor] = useState(null)
  const [addingMatch, setAddingMatch] = useState(false)

  if (!activeTournament) return <EmptyState emoji="⚽" title="Hələ çempionat yoxdur" sub="Tənzimləmələr → Çempionatı başlat bölməsindən çempionat yaradın." />
  const matches = Object.entries(activeTournament.matches || {}).map(([id, m]) => ({ id, ...m }))
  const rounds = [...new Set(matches.map((m) => m.round))]
  const stageLabel = activeTournament.stage === 'groups' ? 'Qrup mərhələsi' : activeTournament.stage === 'knockout' ? 'Playoff' : 'Liqa'

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{activeTournament.name} <span className="chip" style={{ marginLeft: 6 }}>{stageLabel}</span></div>
        <button className="btn btn-outline btn-sm" onClick={() => setAddingMatch(true)}>+ Oyun</button>
      </div>
      {rounds.map((round) => {
        const rm = matches.filter((m) => m.round === round)
        return (
          <div key={round} className="card" style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>{round}</div>
            <div className="stack-8">
              {rm.map((m) => (
                <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
                  <div className="flex-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{teams[m.teamA]?.name || 'TBD'} vs {teams[m.teamB]?.name || 'TBD'}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  {m.status === 'FINISHED' && <div className="mono" style={{ fontSize: 13, marginBottom: 6 }}>{m.scoreA} : {m.scoreB}{m.penA != null ? ` (pen. ${m.penA}-${m.penB})` : ''}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setResultFor(m)}>Nəticə daxil et</button>
                    {m.status === 'UPCOMING' && <button className="btn btn-outline btn-sm" onClick={() => setMatchLive(activeTournament.id, m.id, true)}>🔴 Canlı başlat</button>}
                    {m.status === 'LIVE' && <button className="btn btn-outline btn-sm" onClick={() => setMatchLive(activeTournament.id, m.id, false)}>Canlını dayandır</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Oyunu silmək istəyirsiniz?')) deleteMatch(activeTournament.id, m.id) }}>Sil</button>
                  </div>
                  <MatchSchedule tournamentId={activeTournament.id} match={m} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {resultFor && <ResultForm tournamentId={activeTournament.id} match={resultFor} onClose={() => setResultFor(null)} />}
      {addingMatch && <ManualMatchForm tournamentId={activeTournament.id} teamIds={activeTournament.teamIds} onClose={() => setAddingMatch(false)} />}
    </div>
  )
}

function MatchSchedule({ tournamentId, match }) {
  const { updateMatch } = useApp()
  const [dt, setDt] = useState(match.startTime ? new Date(match.startTime).toISOString().slice(0, 16) : '')
  const [venue, setVenue] = useState(match.venue || '')
  return (
    <div className="field-row" style={{ marginTop: 8 }}>
      <div className="field" style={{ marginBottom: 0 }}>
        <input type="datetime-local" value={dt} onChange={(e) => { setDt(e.target.value); updateMatch(tournamentId, match.id, { startTime: new Date(e.target.value).getTime() }) }} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <input placeholder="Stadion" value={venue} onChange={(e) => { setVenue(e.target.value); updateMatch(tournamentId, match.id, { venue: e.target.value }) }} />
      </div>
    </div>
  )
}

function ResultForm({ tournamentId, match, onClose }) {
  const { recordResult, teams } = useApp()
  const [scoreA, setScoreA] = useState(match.scoreA ?? 0)
  const [scoreB, setScoreB] = useState(match.scoreB ?? 0)
  const [needsPen, setNeedsPen] = useState(false)
  const [penA, setPenA] = useState('')
  const [penB, setPenB] = useState('')
  const [notes, setNotes] = useState(match.notes || '')

  async function submit(e) {
    e.preventDefault()
    await recordResult(tournamentId, match.id, {
      scoreA: Number(scoreA), scoreB: Number(scoreB), notes,
      penA: needsPen ? Number(penA) : null, penB: needsPen ? Number(penB) : null,
    })
    onClose()
  }

  return (
    <Modal title="Nəticəni daxil et" onClose={onClose}>
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
        <div className="checkbox-row"><input type="checkbox" checked={needsPen} onChange={(e) => setNeedsPen(e.target.checked)} /> Heç-heçə — penalti seriyası oldu</div>
        {needsPen && (
          <div className="field-row">
            <div className="field"><label>Penalti — {teams[match.teamA]?.name}</label><input type="number" value={penA} onChange={(e) => setPenA(e.target.value)} /></div>
            <div className="field"><label>Penalti — {teams[match.teamB]?.name}</label><input type="number" value={penB} onChange={(e) => setPenB(e.target.value)} /></div>
          </div>
        )}
        <div className="field"><label>Qeyd</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <button className="btn btn-primary btn-block">Nəticəni yadda saxla</button>
      </form>
    </Modal>
  )
}

function ManualMatchForm({ tournamentId, teamIds, onClose }) {
  const { addMatch, teams } = useApp()
  const [form, setForm] = useState({ teamA: teamIds[0] || '', teamB: teamIds[1] || '', round: '', venue: '', referee: '' })
  async function submit(e) {
    e.preventDefault()
    if (form.teamA === form.teamB) { alert('Eyni komanda öz-özü ilə oynaya bilməz'); return }
    await addMatch(tournamentId, { ...form, round: form.round || 'Əlavə oyun' })
    onClose()
  }
  return (
    <Modal title="Yeni oyun yarat" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Komanda A</label>
            <select value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })}>
              {teamIds.map((id) => <option key={id} value={id}>{teams[id]?.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Komanda B</label>
            <select value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })}>
              {teamIds.map((id) => <option key={id} value={id}>{teams[id]?.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Mərhələ adı</label><input value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} placeholder="məs. Rübfinal" /></div>
        <button className="btn btn-primary btn-block">Oyun yarat</button>
      </form>
    </Modal>
  )
}

// ================= SETTINGS =================
function SettingsAdmin() {
  const { teamList, activeTournament, archiveList, teams, startChampionship, deleteTournament, generateDraw, deleteArchivedTournament, notify } = useApp()
  const [busy, setBusy] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [format, setFormat] = useState('groups')

  async function start(e) {
    e.preventDefault()
    if (teamList.length < 2) { alert('Ən azı 2 komanda yaradın'); return }
    await startChampionship(teamList.map((t) => t.id), format)
    setStartOpen(false)
    notify('Çempionat başladı! 🏆')
  }

  return (
    <div className="stack-8">
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Çempionat</div>
        {activeTournament ? (
          <>
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              {activeTournament.name} · Mövsüm {activeTournament.season} · {activeTournament.teamIds?.length || 0} komanda
            </p>
            <button className="btn btn-outline btn-block" onClick={() => { if (confirm('Püşkatmanı yeniləmək istəyirsiniz? Hazırkı oyunlar silinəcək.')) generateDraw(activeTournament.id) }}>🎲 Püşkatmanı yenilə</button>
            <button className="btn btn-danger btn-block" style={{ marginTop: 8 }} onClick={async () => { if (confirm('Çempionatı silmək istəyirsiniz?')) { await deleteTournament(activeTournament.id); notify('Çempionat silindi') } }}>Çempionatı sil</button>
          </>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>Hazırda aktiv çempionat yoxdur. Bütün komandalarla yeni çempionat başladın.</p>
            <button className="btn btn-primary btn-block" onClick={() => setStartOpen(true)}>🏆 Çempionatı başlat</button>
          </>
        )}
      </div>
      {startOpen && (
        <Modal title="Çempionatı başlat" onClose={() => setStartOpen(false)}>
          <form onSubmit={start}>
            <div className="field">
              <label>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="groups">Qarşılaşma modu (Qruplar + Playoff)</option>
                <option value="knockout">Birbaşa Playoff (Çempionlar Liqası üslubu)</option>
                <option value="league">Liqa (hər kəs hər kəslə oynayır)</option>
              </select>
            </div>
            <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>{teamList.length} komanda iştirak edəcək. Komandaları "Komandalar" bölməsindən əlavə edə bilərsiniz.</p>
            <button className="btn btn-primary btn-block">Başlat</button>
          </form>
        </Modal>
      )}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Əvvəlki turnirlər</div>
        {archiveList.length === 0
          ? <p className="muted" style={{ fontSize: 12 }}>Hələ bitmiş turnir yoxdur. Turnir başa çatdıqda avtomatik burada saxlanılır.</p>
          : (
            <div className="stack-8">
              {archiveList.map((t) => (
                <div className="flex-between" key={t.id}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{t.name} · {t.season}</div>
                    <div className="muted" style={{ fontSize: 11 }}>🏆 {teams[t.champion]?.name || t.teamsInfo?.[t.champion]?.name || '—'}</div>
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
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Demo Data</div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>8 komanda və qrup + playoff mərhələsi ilə nümunə çempionat yaradır.</p>
        <button
          className="btn btn-outline btn-block"
          disabled={busy}
          onClick={async () => { setBusy(true); await seedDemoData(); setBusy(false); notify('Demo data yaradıldı') }}
        >{busy ? 'Yaradılır...' : 'Demo data yarat'}</button>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--live)' }}>Təhlükəli bölgə</div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>Bütün komandaları, çempionatları və tarixçəni siləcək. Geri qaytarıla bilməz.</p>
        <button
          className="btn btn-danger btn-block"
          disabled={busy}
          onClick={async () => { if (confirm('Bütün məlumatlar silinsin? Bu əməliyyat geri qaytarılmır.')) { setBusy(true); await wipeAllData(); setBusy(false); notify('Bütün məlumatlar silindi') } }}
        >Bütün məlumatları sil</button>
      </div>
    </div>
  )
}
