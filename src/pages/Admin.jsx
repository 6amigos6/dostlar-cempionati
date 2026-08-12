import React, { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import { TeamLogo, Modal, EmptyState } from '../components.jsx'
import { computeStandings, matchPlayed } from '../lib/logic.js'

const TABS = ['Komandalar', 'Turnir', 'Tarixçə']
const ADMIN_PASSWORD = 'gasham'
const UNLOCK_KEY = 'admin_unlocked'

export default function Admin() {
  const [tab, setTab] = useState('Turnir')
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === '1')

  if (!unlocked) return <AdminLogin onUnlock={() => { localStorage.setItem(UNLOCK_KEY, '1'); setUnlocked(true) }} />

  return (
    <div>
      <div className="section-title">
        <h2>Admin Panel</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => { localStorage.removeItem(UNLOCK_KEY); setUnlocked(false) }}>Çıxış</button>
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

function AdminLogin({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  function submit(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) onUnlock()
    else setErr('Şifrə yanlışdır.')
  }
  return (
    <div className="card card-elevated" style={{ maxWidth: 360, margin: '30px auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 30 }}>🔐</div>
        <div style={{ fontSize: 17, fontWeight: 800, marginTop: 8 }}>Admin Girişi</div>
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
  const { teamList, activeTournament, addTeam, deleteTeam } = useApp()
  const [name, setName] = useState('')
  const inTournament = new Set(activeTournament?.teamIds || [])

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    await addTeam(name)
    setName('')
  }

  return (
    <div>
      <form className="field-row" onSubmit={submit} style={{ marginBottom: 12 }}>
        <div className="field" style={{ margin: 0, flex: 1 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Komanda adı — məs. Alov FC" />
        </div>
        <button className="btn btn-primary" disabled={!name.trim()}>+ Əlavə et</button>
      </form>
      {teamList.length === 0
        ? <EmptyState title="Komanda yoxdur" sub="Yuxarıdan komanda adı əlavə edin." />
        : (
          <div className="stack">
            {teamList.map((t) => {
              const playing = inTournament.has(t.id)
              return (
                <div className="card flex-between" key={t.id} style={{ marginBottom: 0, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TeamLogo team={t} size={34} />
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.name}</div>
                    {playing && <span className="chip chip-live">Turnirdə</span>}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={playing}
                    title={playing ? 'Turnirdəki komanda silinə bilməz' : undefined}
                    onClick={() => deleteTeam(t.id)}
                  >Sil</button>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}

// ================= TURNİR =================
function TournamentTab() {
  const { activeTournament, teamList, archiveCurrent, startTournament, finishTournament, deleteTournament, recordResult, notify } = useApp()
  const [selected, setSelected] = useState(null)
  const [resultFor, setResultFor] = useState(null)
  const [confirm, setConfirm] = useState(null)

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
    // Turnir yoxdursa: komanda seçimi
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
                      onClick={() => setSelected((cur) => (s ? cur.filter((x) => x !== tm.id) : [...cur, tm.id]))}
                    >
                      <TeamLogo team={tm} size={26} />
                      <span className="team-pick-name">{tm.name}</span>
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
            <button className="btn btn-danger btn-sm" onClick={() => ask('Aktiv turniri sil', () => deleteTournament(t.id))}>🗑 Sil</button>
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
  const { archiveList, teams, deleteArchivedTournament } = useApp()
  if (archiveList.length === 0) {
    return <EmptyState title="Bitmiş turnir yoxdur" sub="Yeni turnir başlayanda əvvəlki avtomatik arxivləşir." />
  }
  return (
    <div className="stack">
      {archiveList.map((t) => {
        const champ = t.teamsInfo?.[t.champion] || teams?.[t.champion]
        return (
          <div className="card flex-between" key={t.id} style={{ marginBottom: 0 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name} · {t.season}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{champ ? `Çempion: ${champ.name}` : 'Çempion yoxdur'} · {t.teamIds?.length || 0} komanda</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => deleteArchivedTournament(t.id)}>Sil</button>
          </div>
        )
      })}
    </div>
  )
}
