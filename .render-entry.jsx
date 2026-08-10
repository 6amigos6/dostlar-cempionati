import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TournamentView from './src/components/TournamentView.jsx'

const teams = {}
const names = ['Alov FC','Zümrüd United','Qartallar','Şimşək','Dəniz Kənarı','Polad Gücü','Ulduz FK','Tufan City']
for (let i = 0; i < 8; i++) teams['t' + i] = { id: 't' + i, name: names[i] }

const mk = (teamA, teamB, round, group, scoreA = null, scoreB = null) => ({ teamA, teamB, round, group, scoreA, scoreB })

// Qrup mərhələsi: A və B qrupları, bəzi oyunlar oynanılıb
const tournament = {
  id: 'tour_test', name: 'Çempionlar Liqası', season: 2026, format: 'groups', stage: 'groups',
  pointsRule: { win: 3, draw: 1, loss: 0 },
  teamIds: ['t0','t1','t2','t3','t4','t5','t6','t7'],
  groups: { A: ['t0','t1','t2','t3'], B: ['t4','t5','t6','t7'] },
  matches: {
    m1: mk('t0','t2','A qrupu · Tur 1','A',3,1), m2: mk('t1','t3','A qrupu · Tur 1','A',2,2),
    m3: mk('t0','t1','A qrupu · Tur 2','A',1,0), m4: mk('t2','t3','A qrupu · Tur 2','A',4,2),
    m5: mk('t0','t3','A qrupu · Tur 3','A',2,1), m6: mk('t1','t2','A qrupu · Tur 3','A',0,3),
    m7: mk('t4','t6','B qrupu · Tur 1','B'), m8: mk('t5','t7','B qrupu · Tur 1','B'),
    m9: mk('t4','t5','B qrupu · Tur 2','B',1,1), m10: mk('t6','t7','B qrupu · Tur 2','B'),
    m11: mk('t4','t7','B qrupu · Tur 3','B'), m12: mk('t5','t6','B qrupu · Tur 3','B'),
  },
  champion: null, createdAt: Date.now(),
}

const html = renderToStaticMarkup(React.createElement(TournamentView, { tournament, teams }))
process.stdout.write(html)
