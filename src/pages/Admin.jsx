import React, { useState, useRef, useMemo } from 'react'
import { useApp } from '../store.jsx'
import { Modal, TeamLogo, EmptyState } from '../components.jsx'
import { uploadToCloudinary } from '../lib/upload.js'
import {
  computeStandings, buildKnockoutFromGroups, roundNameForSize,
} from '../lib/logic.js'

const TABS = ['Komandalar', 'Çempionat', 'Tarixçə']
const ADMIN_PASSWORD = 'gasham'
const UNLOCK_KEY = 'admin_unlocked'

export default function Admin() {
  const [tab, setTab] = useState('Komandalar')
  // Sessiya localStorage-da saxlanılır: brauzer bağlanıb açılsa belə admin avtomatik daxil olur
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === '1')
  const [confirmState, setConfirmState] = useState(null)

  const unlock = () => { localStorage.setItem(UNLOCK_KEY, '1'); setUnlocked(true) }
  const lock = () => { localStorage.removeItem(UNLOCK_KEY); setUnlocked(false) }
  const ask = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm })

  if (!unlocked) return <AdminLogin onUnlock={unlock} />

  return (
    <div>
      <div className="section-title"><h2>Admin Panel</h2><button className="btn btn-ghost btn-sm" onClick={lock}>Çıxış</button></div>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'Komandalar' && <TeamsTab ask={ask} />}
      {tab === 'Çempionat' && <ChampionshipTab ask={ask} />}
      {tab === 'Tarixçə' && <HistoryTab ask={ask} />}

      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={() => { confirmState.onConfirm?.(); setConfirmState(null) }}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}

function ConfirmDialog({ title, message, onConfirm, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', padding: '14px 6px 6px' }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 8 }}>{title}</div>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 20, lineHeight: 1.5 }}>{message}</div>
          <div className="field-row">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Ləğv et</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Təsdiq et</button>
          </div>
        </div>
      </div>
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
function TeamsTab({ ask }) {
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
              <button className="btn btn-danger btn-sm" onClick={() => ask('Komanda sil', `"${t.name}" — bu məlumatı silmək istədiyinizə əminsiniz?`, () => deleteTeam(t.id))}>Sil</button>
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
      notify('Şəkil yükləndi')
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
// Turnirin bütün mərhələlərinin oyun planını qurur:
// qrup oyunları sıra ilə, sonra playoff: "1. Qalib Oyun 1 vs Qalib Oyun 2" ...
function buildTournamentPlan(t, nameOf) {
  const stages = []
  const all = Object.values(t.matches || {})
  const isGroups = t.format === 'groups'

  if (isGroups && t.stage === 'groups') {
    const groupMatches = all
      .filter((m) => m.group)
      .sort((a, b) => ((a.round || '') + (a.teamA || '')).localeCompare((b.round || '') + (b.teamA || '')))
    let num = 0
    stages.push({
      title: 'Qrup mərhələsi',
      items: groupMatches.map((m) => ({
        num: ++num,
        tag: m.group,
        label: `${nameOf(m.teamA)} vs ${nameOf(m.teamB)}`,
      })),
    })
    // Gözlənilən playoff quruluşu (qruplardan avtomatik püşkatma)
    const roundMatches = buildKnockoutFromGroups({ ...t, stage: 'knockout' })
    let fixtureCount = roundMatches.length
    let teamsInRound = fixtureCount * 2
    while (fixtureCount >= 1) {
      const title = roundNameForSize(teamsInRound)
      stages.push({
        title,
        plan: true,
        items: Array.from({ length: fixtureCount }, (_, i) => ({
          num: i + 1,
          label: `Qalib Oyun ${i * 2 + 1} vs Qalib Oyun ${i * 2 + 2}`,
        })),
      })
      if (fixtureCount === 1) break
      fixtureCount = Math.floor(fixtureCount / 2)
      teamsInRound = Math.floor(teamsInRound / 2)
    }
    return stages
  }

  if (t.format === 'knockout' || (isGroups && t.stage === 'knockout')) {
    const ko = all.filter((m) => !m.group)
    const byRound = {}
    ko.forEach((m) => { (byRound[m.round] = byRound[m.round] || []).push(m) })
    Object.entries(byRound)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([title, ms]) => {
        stages.push({ title, items: ms.map((m, i) => ({ num: i + 1, label: `${nameOf(m.teamA)} vs ${nameOf(m.teamB)}` })) })
      })
    return stages
  }

  if (t.format === 'league') {
    const byRound = {}
    all.forEach((m) => { (byRound[m.round] = byRound[m.round] || []).push(m) })
    Object.entries(byRound).forEach(([title, ms]) => {
      stages.push({ title, items: ms.map((m, i) => ({ num: i + 1, label: `${nameOf(m.teamA)} vs ${nameOf(m.teamB)}` })) })
    })
  }
  return stages
}

// Raundları ardıcıl sıralamaq üçün açar: A qrupu Tur 1 → ... → B qrupu → Playoff → Final
function roundOrder(round = '') {
  const gm = /^([A-Z]) qrupu · Tur (\d+)$/i.exec(round)
  if (gm) return [0, gm[1].toUpperCase().charCodeAt(0), Number(gm[2])]
  const lm = /^Tur (\d+)$/i.exec(round)
  if (lm) return [1, Number(lm[1]), 0]
  const order = { '1/8 Final': 20, '1/4 Final': 30, '1/2 Final': 40, 'Final': 50 }
  return [2, order[round] != null ? order[round] : 99, 0]
}

function PlanCard({ plan }) {
  return (
    <div className="card">
      <div className="plan-title">OYUN PLANI</div>
      {plan.length === 0 && <div className="muted" style={{ fontSize: 12 }}>Plan hazırlanmayıb.</div>}
      {plan.map((st) => (
        <div className="plan-stage" key={st.title}>
          <div className="plan-stage-title">
            {st.title}
            {st.plan && <span className="chip" style={{ marginLeft: 6 }}>plan</span>}
          </div>
          <div className="stack-4">
            {st.items.map((it) => (
              <div className="plan-row" key={`${st.title}-${it.num}`}>
                <span className="plan-num">{it.num}.</span>
                <span className="plan-label">{it.tag ? `${it.tag} · ` : ''}{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChampionshipTab({ ask }) {
  const { activeTournament, teamList, teams, startChampionship, generateDraw, finishTournament, deleteTournament, recordResult, resetMatch, resetAllResults, notify } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [format, setFormat] = useState('groups')
  const [selected, setSelected] = useState([])
  const [resultFor, setResultFor] = useState(null)

  async function start(e) {
    e.preventDefault()
    if (selected.length < 2) { alert('Ən azı 2 komanda seçin'); return }
    await startChampionship(selected, format)
    setCreateOpen(false)
    notify('Çempionat başladı!')
  }

  if (!activeTournament) {
    return (
      <div>
        <EmptyState emoji="⚽" title="Aktiv çempionat yoxdur" sub="Komandaları seçin — sistem avtomatik püşkatma edib qarşılaşmaları yaradacaq." />
        <button className="btn btn-primary btn-block" onClick={() => { setSelected(teamList.map((t) => t.id)); setCreateOpen(true) }}>+ Çempionatı başlat</button>
        {createOpen && (
          <Modal title="Çempionatı başlat" onClose={() => setCreateOpen(false)}>
            <form onSubmit={start}>
              <div className="field">
                <label>Mod</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="groups">Qarşılaşma modu (Qruplar + Playoff)</option>
                  <option value="knockout">Birbaşa Playoff</option>
                  <option value="league">Liqa (hər kəs hər kəslə)</option>
                </select>
              </div>
              <div className="field">
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <label style={{ margin: 0 }}>Komandalar</label>
                  <span className="chip">{selected.length} komanda seçildi</span>
                </div>
                {teamList.length === 0 && <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Əvvəlcə "Komandalar" bölməsindən komanda yaradın.</div>}
                <div className="team-pick-grid">
                  {teamList.map((t) => {
                    const sel = selected.includes(t.id)
                    return (
                      <button
                        type="button"
                        key={t.id}
                        className={`team-pick ${sel ? 'selected' : ''}`}
                        onClick={() => setSelected((s) => (sel ? s.filter((x) => x !== t.id) : [...s, t.id]))}
                      >
                        <TeamLogo team={t} size={30} />
                        <span className="team-pick-name">{t.name}</span>
                        <span className="team-pick-check" />
                      </button>
                    )
                  })}
                </div>
              </div>
              <button className="btn btn-primary btn-block" disabled={selected.length < 2}>Davam et</button>
            </form>
          </Modal>
        )}
      </div>
    )
  }

  const matches = Object.values(activeTournament.matches || {})
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => {
    const ka = roundOrder(a), kb = roundOrder(b)
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2]
  })
  const stageLabel = activeTournament.stage === 'groups' ? 'Qrup mərhələsi' : activeTournament.stage === 'knockout' ? 'Playoff' : 'Liqa'
  const groups = activeTournament.groups || null
  const nameOf = (id) => teams[id]?.name || 'TBD'
  const played = (m) => m.scoreA != null && m.scoreB != null
  const plan = useMemo(() => buildTournamentPlan(activeTournament, nameOf), [activeTournament, teams])

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{activeTournament.name} <span className="chip" style={{ marginLeft: 6 }}>{stageLabel}</span></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => ask('Püşkatmanı yenilə', 'Püşkatmanı yeniləmək istəyirsiniz? Hazırkı oyunlar silinəcək.', () => generateDraw(activeTournament.id))}>🎲 Püşkat</button>
          <button className="btn btn-ghost btn-sm" onClick={() => ask('Bütün nəticələri sıfırla', 'Bütün nəticələri silmək istədiyinizə əminsiniz? Qrup formatında playoff silinib qrup mərhələsinə qayıdılacaq.', () => resetAllResults(activeTournament.id))}>⟲ Nəticələri sıfırla</button>
          <button className="btn btn-gold btn-sm" onClick={() => ask('Turniri bitir', 'Turniri bitirib tarixçəyə köçürmək istəyirsiniz?', () => finishTournament(activeTournament.id))}>🏁 Turniri bitir</button>
          <button className="btn btn-danger btn-sm" onClick={() => ask('Aktiv turniri sil', 'Bu məlumatı silmək istədiyinizə əminsiniz? Turnir və bütün oyunları silinəcək.', () => deleteTournament(activeTournament.id))}>🗑 Turniri sil</button>
        </div>
      </div>

      {groups && (
        <div className="stack-8" style={{ marginBottom: 12 }}>
          {Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([letter, ids]) => {
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
                    <span className="mono" style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.played > 0 ? `${r.pts} xal` : '—'}</span>
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
            {matches.filter((m) => m.round === round)
              .sort((a, b) => nameOf(a.teamA).localeCompare(nameOf(b.teamA)))
              .map((m) => {
              const isPlayed = played(m)
              return (
                <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
                  <div className="flex-between" style={{ marginBottom: 6, gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{nameOf(m.teamA)} vs {nameOf(m.teamB)}</span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setResultFor(m)}>{isPlayed ? 'Nəticəni düzəlt' : 'Nəticə daxil et'}</button>
                      {isPlayed && <button className="btn btn-danger btn-sm" onClick={() => ask('Nəticəni sıfırla', `"${nameOf(m.teamA)} vs ${nameOf(m.teamB)}" nəticəsini silmək istədiyinizə əminsiniz?`, () => resetMatch(activeTournament.id, m.id))}>Sıfırla</button>}
                    </div>
                  </div>
                  {isPlayed && <div className="mono" style={{ fontSize: 14 }}>{m.scoreA} : {m.scoreB}{m.penA != null ? ` (pen. ${m.penA}-${m.penB})` : ''}</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {resultFor && <ResultForm tournamentId={activeTournament.id} match={resultFor} teams={teams} onClose={() => setResultFor(null)} />}

      <PlanCard plan={plan} />
    </div>
  )
}

// ================= NƏTİCƏ =================
function ResultForm({ tournamentId, match, teams, onClose }) {
  const { recordResult } = useApp()
  const [scoreA, setScoreA] = useState(match.scoreA ?? '')
  const [scoreB, setScoreB] = useState(match.scoreB ?? '')
  const [penA, setPenA] = useState(match.penA ?? '')
  const [penB, setPenB] = useState(match.penB ?? '')
  const isKnockout = !match.group
  const needPen = isKnockout && scoreA !== '' && scoreB !== '' && Number(scoreA) === Number(scoreB)

  async function submit(e) {
    e.preventDefault()
    if (scoreA === '' || scoreB === '') { alert('Hesabı daxil edin'); return }
    if (needPen && (penA === '' || penB === '' || Number(penA) === Number(penB))) { alert('Penalti nəticəsini daxil edin (fərqli olmalıdır)'); return }
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
            <label>{teams[match.teamA]?.name || 'TBD'}</label>
            <input type="number" min="0" inputMode="numeric" value={scoreA} onChange={(e) => setScoreA(e.target.value)} placeholder="0" style={{ textAlign: 'center', fontSize: 20 }} />
          </div>
          <div className="field" style={{ textAlign: 'center' }}>
            <label>{teams[match.teamB]?.name || 'TBD'}</label>
            <input type="number" min="0" inputMode="numeric" value={scoreB} onChange={(e) => setScoreB(e.target.value)} placeholder="0" style={{ textAlign: 'center', fontSize: 20 }} />
          </div>
        </div>
        {needPen && (
          <div className="field">
            <label style={{ textAlign: 'center' }}>Əlavə vaxt / Penaltilər</label>
            <div className="field-row">
              <div className="field"><label>{teams[match.teamA]?.name || 'TBD'}</label><input type="number" min="0" inputMode="numeric" value={penA} onChange={(e) => setPenA(e.target.value)} placeholder="0" /></div>
              <div className="field"><label>{teams[match.teamB]?.name || 'TBD'}</label><input type="number" min="0" inputMode="numeric" value={penB} onChange={(e) => setPenB(e.target.value)} placeholder="0" /></div>
            </div>
          </div>
        )}
        <button className="btn btn-primary btn-block">Nəticəni yadda saxla</button>
      </form>
    </Modal>
  )
}

// ================= TARİXÇƏ =================
function HistoryTab({ ask }) {
  const { archiveList, teams, deleteArchivedTournament } = useApp()
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
                  <div className="muted" style={{ fontSize: 11 }}>{t.teamsInfo?.[t.champion]?.name || teams[t.champion]?.name || '—'}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => ask('Turniri sil', `"${t.name}" — bu məlumatı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.`, () => deleteArchivedTournament(t.id))}>Sil</button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
