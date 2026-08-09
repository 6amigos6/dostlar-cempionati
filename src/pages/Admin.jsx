import React, { useState, useMemo } from 'react'
import { useApp } from '../store.jsx'
import { Modal, Avatar, TeamLogo, StatusBadge, EmptyState } from '../components.jsx'
import { seedDemoData, wipeAllData } from '../data/seed.js'
import { roundNameForSize } from '../lib/logic'

const TABS = ['Dashboard', 'Oyunçular', 'Komandalar', 'Turnirlər', 'Oyunlar', 'Tənzimləmələr']

export default function Admin() {
  const { user } = useApp()
  const [tab, setTab] = useState('Dashboard')

  if (user === undefined) return <div className="loading"><div className="spinner" />Yoxlanılır...</div>
  if (!user) return <AdminLogin />

  return (
    <div>
      <div className="section-title"><h2>Admin Panel</h2><LogoutBtn /></div>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Dashboard' && <Dashboard />}
      {tab === 'Oyunçular' && <PlayersAdmin />}
      {tab === 'Komandalar' && <TeamsAdmin />}
      {tab === 'Turnirlər' && <TournamentsAdmin />}
      {tab === 'Oyunlar' && <MatchesAdmin />}
      {tab === 'Tənzimləmələr' && <SettingsAdmin />}
    </div>
  )
}

function LogoutBtn() {
  const { logout } = useApp()
  return <button className="btn btn-ghost btn-sm" onClick={logout}>Çıxış</button>
}

function AdminLogin() {
  const { login, notify } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await login(email, password)
    } catch (e2) {
      setErr('Giriş uğursuz oldu. E-poçt/şifrəni yoxlayın.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card-elevated" style={{ maxWidth: 360, margin: '30px auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: 30 }}>🔐</span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginTop: 8 }}>Admin Girişi</div>
        <div className="muted" style={{ fontSize: 12 }}>Yalnız admin istifadəçilər üçün</div>
      </div>
      <form onSubmit={submit}>
        <div className="field"><label>E-poçt</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Şifrə</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <div style={{ color: 'var(--live)', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Yoxlanılır...' : 'Daxil ol'}</button>
      </form>
      <p className="muted" style={{ fontSize: 11, marginTop: 14, textAlign: 'center' }}>
        Admin hesabı Firebase Console → Authentication bölməsindən yaradılır (bax README.md).
      </p>
    </div>
  )
}

function Dashboard() {
  const { teamList, playerList, tournamentList, archiveList, activeTournament } = useApp()
  const matches = activeTournament?.matches ? Object.values(activeTournament.matches) : []
  const played = matches.filter((m) => m.status === 'FINISHED').length
  const upcoming = matches.filter((m) => m.status === 'UPCOMING').length
  const stats = [
    ['Aktiv turnir', activeTournament?.name || '—'],
    ['Komanda sayı', teamList.length],
    ['Oyunçu sayı', playerList.length],
    ['Oynanmış oyunlar', played],
    ['Qarşıdakı oyunlar', upcoming],
    ['Bitmiş turnirlər', archiveList.length],
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

// ================= PLAYERS =================
function PlayersAdmin() {
  const { playerList, teams, deletePlayer } = useApp()
  const [editing, setEditing] = useState(null) // null=closed, {}=new, {...}=edit
  return (
    <div>
      <button className="btn btn-primary btn-block" onClick={() => setEditing({})}>+ Oyunçu əlavə et</button>
      <div style={{ marginTop: 12 }} className="stack-8">
        {playerList.length === 0 && <EmptyState emoji="👤" title="Oyunçu yoxdur" />}
        {playerList.map((p) => (
          <div className="card flex-between" key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar player={p} size={38} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.firstName} {p.lastName}</div>
                <div className="muted" style={{ fontSize: 11 }}>{teams[p.teamId]?.name || 'Komandasız'} · {p.position || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>Redaktə</button>
              <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Oyunçunu silmək istəyirsiniz?')) deletePlayer(p.id) }}>Sil</button>
            </div>
          </div>
        ))}
      </div>
      {editing && <PlayerForm player={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function PlayerForm({ player, onClose }) {
  const { addPlayer, updatePlayer, teamList } = useApp()
  const isNew = !player.id
  const [form, setForm] = useState({
    firstName: player.firstName || '', lastName: player.lastName || '', nickname: player.nickname || '',
    number: player.number ?? '', position: player.position || 'Hücumçu', teamId: player.teamId || '',
    photoUrl: player.photoUrl || '',
    gamesPlayed: player.gamesPlayed ?? 0, wins: player.wins ?? 0, goals: player.goals ?? 0, assists: player.assists ?? 0,
    yellowCards: player.yellowCards ?? 0, redCards: player.redCards ?? 0,
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const data = { ...form, number: form.number === '' ? null : Number(form.number) }
    if (isNew) await addPlayer(data)
    else await updatePlayer(player.id, data)
    onClose()
  }

  return (
    <Modal title={isNew ? 'Oyunçu əlavə et' : 'Oyunçunu redaktə et'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Ad</label><input required value={form.firstName} onChange={set('firstName')} /></div>
          <div className="field"><label>Soyad</label><input required value={form.lastName} onChange={set('lastName')} /></div>
        </div>
        <div className="field"><label>Ləqəb / nickname</label><input value={form.nickname} onChange={set('nickname')} /></div>
        <div className="field-row">
          <div className="field"><label>Nömrə</label><input type="number" value={form.number} onChange={set('number')} /></div>
          <div className="field">
            <label>Mövqe</label>
            <select value={form.position} onChange={set('position')}>
              <option>Qapıçı</option><option>Müdafiəçi</option><option>Yarımmüdafiəçi</option><option>Hücumçu</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Komanda</label>
          <select value={form.teamId} onChange={set('teamId')}>
            <option value="">— Komandasız —</option>
            {teamList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Profil şəkli URL (boş buraxsanız avtomatik avatar)</label><input value={form.photoUrl} onChange={set('photoUrl')} placeholder="https://..." /></div>
        <hr className="divider" />
        <div className="muted" style={{ fontSize: 11, marginBottom: 8 }}>Statistika (əl ilə düzəliş)</div>
        <div className="field-row">
          <div className="field"><label>Oyun sayı</label><input type="number" value={form.gamesPlayed} onChange={set('gamesPlayed')} /></div>
          <div className="field"><label>Qələbə</label><input type="number" value={form.wins} onChange={set('wins')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Qol</label><input type="number" value={form.goals} onChange={set('goals')} /></div>
          <div className="field"><label>Assist</label><input type="number" value={form.assists} onChange={set('assists')} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Sarı kart</label><input type="number" value={form.yellowCards} onChange={set('yellowCards')} /></div>
          <div className="field"><label>Qırmızı kart</label><input type="number" value={form.redCards} onChange={set('redCards')} /></div>
        </div>
        <button className="btn btn-primary btn-block">Yadda saxla</button>
      </form>
    </Modal>
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
  const { addTeam, updateTeam, playerList } = useApp()
  const isNew = !team.id
  const [form, setForm] = useState({ name: team.name || '', color: team.color || '#1FA35C', logoUrl: team.logoUrl || '', captainId: team.captainId || '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    if (isNew) await addTeam(form)
    else await updateTeam(team.id, form)
    onClose()
  }
  const roster = playerList.filter((p) => p.teamId === team.id)
  return (
    <Modal title={isNew ? 'Komanda əlavə et' : 'Komandanı redaktə et'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Komanda adı</label><input required value={form.name} onChange={set('name')} /></div>
        <div className="field-row">
          <div className="field"><label>Rəng</label><input type="color" value={form.color} onChange={set('color')} style={{ height: 44, padding: 4 }} /></div>
          <div className="field"><label>Loqo URL (opsional)</label><input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." /></div>
        </div>
        {!isNew && (
          <div className="field">
            <label>Kapitan</label>
            <select value={form.captainId} onChange={set('captainId')}>
              <option value="">— Seçilməyib —</option>
              {roster.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
        )}
        <button className="btn btn-primary btn-block">Yadda saxla</button>
      </form>
      {!isNew && <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>Oyunçuları komandaya "Oyunçular" bölməsindən təyin edin.</p>}
    </Modal>
  )
}

// ================= TOURNAMENTS =================
function TournamentsAdmin() {
  const {
    tournamentList, teams, activeTournamentId, setActiveTournament, generateDraw, completeTournament, notify,
  } = useApp()
  const [creating, setCreating] = useState(false)

  return (
    <div>
      <button className="btn btn-primary btn-block" onClick={() => setCreating(true)}>+ Yeni turnir yarat</button>
      <div style={{ marginTop: 12 }} className="stack-8">
        {tournamentList.length === 0 && <EmptyState emoji="🏆" title="Turnir yoxdur" />}
        {tournamentList.filter((t) => t.status !== 'ARCHIVED').map((t) => (
          <div className="card" key={t.id}>
            <div className="flex-between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.name} {activeTournamentId === t.id && <span className="chip" style={{ marginLeft: 6 }}>AKTİV</span>}</div>
                <div className="muted" style={{ fontSize: 11 }}>{t.format === 'knockout' ? 'Birbaşa Playoff' : t.format === 'groups' ? 'Qrup + Playoff' : 'Liqa'} · {t.teamIds?.length || 0} komanda · {t.status}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {activeTournamentId !== t.id && <button className="btn btn-ghost btn-sm" onClick={() => setActiveTournament(t.id)}>Aktiv et</button>}
              {Object.keys(t.matches || {}).length === 0 && (
                <button className="btn btn-outline btn-sm" onClick={() => { if (t.teamIds?.length >= 2) generateDraw(t.id); else notify('Ən azı 2 komanda seçin') }}>🎲 Püşkatma et</button>
              )}
              {t.champion && t.status !== 'ARCHIVED' && (
                <button className="btn btn-gold btn-sm" onClick={() => completeTournament(t.id)}>Turniri tamamla</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {creating && <TournamentForm onClose={() => setCreating(false)} />}
    </div>
  )
}

function TournamentForm({ onClose }) {
  const { createTournament, teamList, setActiveTournament } = useApp()
  const [form, setForm] = useState({
    name: 'Dostlar Çempionatı', season: new Date().getFullYear(), format: 'knockout',
    hasThirdPlace: true, seeded: false, matchDuration: 90, teamIds: [],
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const toggleTeam = (id) => setForm((f) => ({ ...f, teamIds: f.teamIds.includes(id) ? f.teamIds.filter((x) => x !== id) : [...f.teamIds, id] }))

  async function submit(e) {
    e.preventDefault()
    if (form.teamIds.length < 2) { alert('Ən azı 2 komanda seçin'); return }
    const id = await createTournament(form)
    await setActiveTournament(id)
    onClose()
  }

  return (
    <Modal title="Yeni turnir yarat" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Turnir adı</label><input required value={form.name} onChange={set('name')} /></div>
        <div className="field-row">
          <div className="field"><label>Mövsüm / il</label><input value={form.season} onChange={set('season')} /></div>
          <div className="field"><label>Oyun müddəti (dəq)</label><input type="number" value={form.matchDuration} onChange={set('matchDuration')} /></div>
        </div>
        <div className="field">
          <label>Format</label>
          <select value={form.format} onChange={set('format')}>
            <option value="knockout">Birbaşa Playoff</option>
            <option value="groups">Qrup + Playoff (qrup mərhələsi liqa kimi işləyir)</option>
            <option value="league">Liqa sistemi</option>
          </select>
        </div>
        <div className="checkbox-row"><input type="checkbox" checked={form.hasThirdPlace} onChange={(e) => setForm({ ...form, hasThirdPlace: e.target.checked })} /> 3-cü yer uğrunda oyun olsun</div>
        <div className="checkbox-row"><input type="checkbox" checked={form.seeded} onChange={(e) => setForm({ ...form, seeded: e.target.checked })} /> Seed sistemi (reytinqə görə yerləşdirmə)</div>
        <div className="field">
          <label>Komandalar ({form.teamIds.length} seçildi)</label>
          <div className="stack-8" style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
            {teamList.length === 0 && <div className="muted" style={{ fontSize: 12 }}>Əvvəlcə "Komandalar" bölməsindən komanda yaradın.</div>}
            {teamList.map((t) => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={form.teamIds.includes(t.id)} onChange={() => toggleTeam(t.id)} />{t.name}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block">Turnir yarat</button>
      </form>
    </Modal>
  )
}

// ================= MATCHES =================
function MatchesAdmin() {
  const {
    activeTournament, teams, updateMatch, deleteMatch, addMatch, setMatchLive, advanceRound, recordResult, notify,
  } = useApp()
  const [resultFor, setResultFor] = useState(null)
  const [addingMatch, setAddingMatch] = useState(false)

  if (!activeTournament) return <EmptyState emoji="⚽" title="Əvvəlcə bir turniri aktiv edin" />
  const matches = Object.entries(activeTournament.matches || {}).map(([id, m]) => ({ id, ...m }))
  const rounds = [...new Set(matches.map((m) => m.round))]

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{activeTournament.name}</div>
        <button className="btn btn-outline btn-sm" onClick={() => setAddingMatch(true)}>+ Oyun</button>
      </div>
      {rounds.map((round) => {
        const rm = matches.filter((m) => m.round === round)
        const allFinished = rm.length > 0 && rm.every((m) => m.status === 'FINISHED')
        return (
          <div key={round} className="card" style={{ marginBottom: 10 }}>
            <div className="flex-between" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>{round}</div>
              {allFinished && rm.length >= 2 && (
                <button className="btn btn-gold btn-sm" onClick={() => advanceRound(activeTournament.id, round)}>Növbəti mərhələ →</button>
              )}
            </div>
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
                    <button className="btn btn-outline btn-sm" onClick={() => updateMatch(activeTournament.id, m.id, { status: 'POSTPONED' })}>Təxirə sal</button>
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
  const [referee, setReferee] = useState(match.referee || '')
  return (
    <div className="field-row" style={{ marginTop: 8 }}>
      <div className="field" style={{ marginBottom: 0 }}>
        <input type="datetime-local" value={dt} onChange={(e) => { setDt(e.target.value); updateMatch(tournamentId, match.id, { startTime: new Date(e.target.value).getTime() }) }} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <input placeholder="Stadion" value={venue} onChange={(e) => { setVenue(e.target.value); updateMatch(tournamentId, match.id, { venue: e.target.value }) }} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <input placeholder="Hakim" value={referee} onChange={(e) => { setReferee(e.target.value); updateMatch(tournamentId, match.id, { referee: e.target.value }) }} />
      </div>
    </div>
  )
}

function ResultForm({ tournamentId, match, onClose }) {
  const { recordResult, addMatchEvent, playerList, teams } = useApp()
  const [scoreA, setScoreA] = useState(match.scoreA ?? 0)
  const [scoreB, setScoreB] = useState(match.scoreB ?? 0)
  const [needsPen, setNeedsPen] = useState(false)
  const [penA, setPenA] = useState('')
  const [penB, setPenB] = useState('')
  const [notes, setNotes] = useState(match.notes || '')
  const [event, setEvent] = useState({ type: 'goal', teamId: match.teamA, playerId: '', minute: '' })

  const rosterA = playerList.filter((p) => p.teamId === match.teamA)
  const rosterB = playerList.filter((p) => p.teamId === match.teamB)
  const eventRoster = event.teamId === match.teamA ? rosterA : rosterB

  async function submit(e) {
    e.preventDefault()
    await recordResult(tournamentId, match.id, {
      scoreA: Number(scoreA), scoreB: Number(scoreB), notes,
      penA: needsPen ? Number(penA) : null, penB: needsPen ? Number(penB) : null,
    })
    onClose()
  }

  async function submitEvent(e) {
    e.preventDefault()
    if (!event.playerId) return
    await addMatchEvent(tournamentId, match.id, event)
    setEvent({ ...event, playerId: '', minute: '' })
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

      <hr className="divider" />
      <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>Hadisə əlavə et (qol / assist / kart)</div>
      <form onSubmit={submitEvent}>
        <div className="field-row">
          <div className="field">
            <label>Növ</label>
            <select value={event.type} onChange={(e) => setEvent({ ...event, type: e.target.value })}>
              <option value="goal">⚽ Qol</option><option value="assist">🎯 Assist</option>
              <option value="yellow">🟨 Sarı kart</option><option value="red">🟥 Qırmızı kart</option>
            </select>
          </div>
          <div className="field">
            <label>Komanda</label>
            <select value={event.teamId} onChange={(e) => setEvent({ ...event, teamId: e.target.value, playerId: '' })}>
              <option value={match.teamA}>{teams[match.teamA]?.name}</option>
              <option value={match.teamB}>{teams[match.teamB]?.name}</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Oyunçu</label>
            <select value={event.playerId} onChange={(e) => setEvent({ ...event, playerId: e.target.value })}>
              <option value="">— Seç —</option>
              {eventRoster.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="field"><label>Dəqiqə</label><input type="number" value={event.minute} onChange={(e) => setEvent({ ...event, minute: e.target.value })} /></div>
        </div>
        <button className="btn btn-outline btn-block btn-sm">Hadisəni əlavə et</button>
      </form>
      {match.events?.length > 0 && (
        <div className="stack-8" style={{ marginTop: 10 }}>
          {match.events.map((ev) => (
            <div key={ev.id} className="chip">{ev.type === 'goal' ? '⚽' : ev.type === 'assist' ? '🎯' : ev.type === 'yellow' ? '🟨' : '🟥'} {playerList.find((p) => p.id === ev.playerId)?.firstName || ''} {ev.minute ? `${ev.minute}'` : ''}</div>
          ))}
        </div>
      )}
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
  const { notify } = useApp()
  const [busy, setBusy] = useState(false)
  return (
    <div className="stack-8">
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Demo Data</div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>8 komanda, 32 oyunçu və rübfinal mərhələsi ilə nümunə çempionat yaradır.</p>
        <button
          className="btn btn-outline btn-block"
          disabled={busy}
          onClick={async () => { setBusy(true); await seedDemoData(); setBusy(false); notify('Demo data yaradıldı') }}
        >{busy ? 'Yaradılır...' : 'Demo data yarat'}</button>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--live)' }}>Təhlükəli bölgə</div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>Bütün komandaları, oyunçuları, turnirləri və arxivi siləcək. Geri qaytarıla bilməz.</p>
        <button
          className="btn btn-danger btn-block"
          disabled={busy}
          onClick={async () => { if (confirm('Bütün məlumatlar silinsin? Bu əməliyyat geri qaytarılmır.')) { setBusy(true); await wipeAllData(); setBusy(false); notify('Bütün məlumatlar silindi') } }}
        >Bütün məlumatları sil</button>
      </div>
    </div>
  )
}
