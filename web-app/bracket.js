// bracket.js — Bathouse Playoffs 2026 bracket renderer

const API_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';

// ── Bracket data (manually updated as rounds are played) ──────────────────
// winner: null = TBD, 1 = top team wins, 2 = bottom team wins
// score1/score2: final fantasy points for the week (undefined if not yet played)
const BRACKET = {
  quarterfinals: [
    {
      seed1: 1, gm1: 'Andy', team1: 'Birth2Girth',
      seed2: 8, gm2: 'Dan',  team2: 'Mack Miller',
      winner: 1, score1: 150.05, score2: 94.00,
      players1: [
        { name: 'Brady Tkachuk',   fp: 7.75  },
        { name: 'Brayden Point',   fp: 6.00  },
        { name: 'Jason Robertson', fp: 7.50  },
        { name: 'Matthew Knies',   fp: -3.00 },
        { name: 'Nikita Kucherov', fp: 49.50 },
        { name: 'Dylan Guenther',  fp: 1.00  },
        { name: "K'Andre Miller",  fp: 10.50 },
        { name: 'Lane Hutson',     fp: 4.50  },
        { name: 'Brock Faber',     fp: 8.00  },
        { name: 'Sam Malinski',    fp: 1.00  },
        { name: 'Troy Terry',      fp: 11.50 },
        { name: 'Ilya Sorokin',    fp: 17.20 },
        { name: 'Jake Oettinger',  fp: 10.30 },
      ],
      players2: [
        { name: 'Anze Kopitar',               fp: 9.00  },
        { name: 'Nathan MacKinnon',           fp: 13.00 },
        { name: 'Jake Guentzel',              fp: 10.50 },
        { name: 'Kyle Connor',                fp: 7.00  },
        { name: 'Viktor Arvidsson',           fp: 10.50 },
        { name: 'Jackson Blake',              fp: 11.50 },
        { name: 'Thomas Chabot',              fp: 3.00  },
        { name: 'Mattias Ekholm',             fp: 1.00  },
        { name: 'Bobby McMann',               fp: 0.50  },
        { name: 'Mackenzie Blackwood',        fp: 5.50  },
        { name: 'Jet Greaves',                fp: 12.50 },
        { name: 'Auston Matthews (OUT)',       fp: 0.00  },
      ],
    },
    {
      seed1: 2, gm1: 'Bimm',  team1: 'Killin me Scheifle',
      seed2: 7, gm2: 'Hordo', team2: 'Travis Fan Club',
      winner: 1, score1: 173.40, score2: 103.65,
      players1: [
        { name: 'Bo Horvat',              fp: 11.00 },
        { name: 'Jamie Benn',             fp: 4.00  },
        { name: 'Filip Forsberg',         fp: 31.50 },
        { name: 'Mitch Marner',           fp: -1.00 },
        { name: 'Gabriel Vilardi',        fp: 10.00 },
        { name: 'Juraj Slafkovsky',       fp: 17.00 },
        { name: 'Josh Manson',            fp: 1.50  },
        { name: 'Rasmus Dahlin',          fp: 19.00 },
        { name: 'Darren Raddysh',         fp: 11.50 },
        { name: 'Josh Morrissey',         fp: 5.50  },
        { name: 'Brandon Hagel',          fp: 27.00 },
        { name: 'Brandon Bussi',          fp: 0.60  },
        { name: 'Spencer Knight',         fp: 1.50  },
        { name: 'Ukko-Pekka Luukkonen',   fp: 21.30 },
        { name: 'John Gibson',            fp: 13.00 },
      ],
      players2: [
        { name: 'Matt Duchene',           fp: 3.00  },
        { name: 'Logan Cooley',           fp: 0.00  },
        { name: 'Mason Marchment',        fp: 3.00  },
        { name: 'Dmitri Voronkov',        fp: 0.00  },
        { name: 'Mathew Barzal',          fp: 14.50 },
        { name: 'Kent Johnson',           fp: 6.00  },
        { name: 'Zach Werenski',          fp: 23.50 },
        { name: 'Morgan Rielly',          fp: 0.75  },
        { name: 'Bowen Byram',            fp: 6.00  },
        { name: 'Luke Hughes',            fp: 0.00  },
        { name: 'Sidney Crosby',          fp: 9.00  },
        { name: 'Jordan Binnington',      fp: 4.30  },
        { name: 'Pyotr Kochetkov (IR)',   fp: 0.00  },
        { name: 'Martin Necas',           fp: 11.00 },
        { name: 'Dan Vladar',             fp: 13.10 },
      ],
    },
    {
      seed1: 3, gm1: 'Colin', team1: 'The Real West Coast Chat',
      seed2: 6, gm2: 'Adam',  team2: 'SpudKick',
      winner: 2, score1: 109.10, score2: 119.30,
      players1: [
        { name: 'Elias Pettersson',    fp: 8.00  },
        { name: 'Dylan Strome',        fp: 4.00  },
        { name: 'Travis Konecny',      fp: 8.00  },
        { name: 'Alex Ovechkin',       fp: 8.50  },
        { name: 'Tom Wilson',          fp: 9.00  },
        { name: 'Adrian Kempe',        fp: 2.00  },
        { name: 'Rasmus Andersson',    fp: -1.50 },
        { name: 'Noah Dobson',         fp: -0.50 },
        { name: 'John Carlson',        fp: 2.50  },
        { name: 'Victor Hedman (DTD)', fp: 0.00  },
        { name: 'Brock Nelson',        fp: 10.50 },
        { name: 'Filip Gustavsson',    fp: 9.80  },
        { name: 'Scott Wedgewood',     fp: -2.20 },
        { name: 'Nick Suzuki',         fp: 23.50 },
        { name: 'Alex DeBrincat',      fp: 22.50 },
      ],
      players2: [
        { name: 'Rickard Rakell',          fp: 12.00 },
        { name: 'Ryan McLeod',             fp: 4.00  },
        { name: 'Jason Zucker',            fp: 3.50  },
        { name: 'Nikolaj Ehlers',          fp: 18.50 },
        { name: 'Bryan Rust',              fp: 17.00 },
        { name: 'JJ Peterka',             fp: 4.00  },
        { name: 'Dougie Hamilton',         fp: 1.00  },
        { name: 'MacKenzie Weegar',        fp: 5.00  },
        { name: 'Jake Sanderson (OUT)',    fp: 0.00  },
        { name: 'Neal Pionk',             fp: 1.00  },
        { name: 'Karel Vejmelka',          fp: 19.70 },
        { name: 'Akira Schmid',            fp: 0.00  },
        { name: 'Patrick Kane',            fp: 15.50 },
        { name: 'Logan Stankoven',         fp: 8.00  },
        { name: 'Robert Thomas',           fp: 6.50  },
      ],
    },
    {
      seed1: 4, gm1: 'Ryan', team1: 'Monkey Butt',
      seed2: 5, gm2: 'Mike', team2: 'Shit The Driveway',
      winner: 2, score1: 144.45, score2: 151.90,
      players1: [
        { name: 'Trevor Zegras',      fp: 4.00  },
        { name: 'Seth Jarvis',        fp: 16.00 },
        { name: 'Vasiliy Podkolzin',  fp: 5.75  },
        { name: 'Clayton Keller',     fp: 15.00 },
        { name: 'Beckett Sennecke',   fp: 8.50  },
        { name: 'Jack Quinn',         fp: 4.50  },
        { name: 'Miro Heiskanen',     fp: 9.50  },
        { name: 'J.J. Moser',         fp: 11.50 },
        { name: 'John Marino',        fp: 7.00  },
        { name: 'Devon Toews',        fp: 2.50  },
        { name: "Ryan O'Reilly",      fp: 11.00 },
        { name: 'Juuse Saros',        fp: 10.90 },
        { name: 'Stuart Skinner',     fp: -3.20 },
        { name: 'Pavel Zacha',        fp: 15.00 },
        { name: 'Jesper Bratt',       fp: 13.00 },
        { name: 'Matthew Tkachuk',    fp: 9.00  },
      ],
      players2: [
        { name: 'Nick Schmaltz',      fp: 14.50 },
        { name: 'Sebastian Aho',      fp: 7.50  },
        { name: 'Steven Stamkos',     fp: 17.00 },
        { name: 'Cutter Gauthier',    fp: 7.50  },
        { name: 'Andrei Svechnikov',  fp: 2.00  },
        { name: 'Connor Bedard',      fp: 15.00 },
        { name: 'Mattias Samuelsson', fp: 10.50 },
        { name: 'Cale Makar',         fp: 8.50  },
        { name: 'Roman Josi',         fp: 7.50  },
        { name: 'Jakob Chychrun',     fp: 1.00  },
        { name: 'Mika Zibanejad',     fp: 12.50 },
        { name: 'Andrei Vasilevskiy', fp: 12.00 },
        { name: 'Logan Thompson',     fp: 15.50 },
        { name: 'Jeremy Swayman',     fp: 15.40 },
        { name: 'Kirill Kaprizov',    fp: 1.00  },
      ],
    },
  ],
  // Set winner to the gm name string once QF resolves
  semifinals: [
    { gm1: null, team1: null, seed1: null, gm2: null, team2: null, seed2: null, winner: null }, // 1v8 winner vs 2v7 winner
    { gm1: null, team1: null, seed1: null, gm2: null, team2: null, seed2: null, winner: null }, // 3v6 winner vs 4v5 winner
  ],
  final: { gm1: null, team1: null, seed1: null, gm2: null, team2: null, seed2: null, winner: null },
  champion: null,
};

// Derive semi/final participants from QF results
function deriveAdvancing() {
  const qf = BRACKET.quarterfinals;

  function getWinner(match) {
    if (!match.winner) return null;
    if (match.winner === 1) return { gm: match.gm1, team: match.team1, seed: match.seed1 };
    if (match.winner === 2) return { gm: match.gm2, team: match.team2, seed: match.seed2 };
    return null;
  }

  const w = qf.map(getWinner); // [qf0winner, qf1winner, qf2winner, qf3winner]

  // Semi 0: winner of QF0 (Andy) vs winner of QF2 (Adam)
  if (w[0]) { BRACKET.semifinals[0].gm1 = w[0].gm; BRACKET.semifinals[0].team1 = w[0].team; BRACKET.semifinals[0].seed1 = w[0].seed; }
  if (w[2]) { BRACKET.semifinals[0].gm2 = w[2].gm; BRACKET.semifinals[0].team2 = w[2].team; BRACKET.semifinals[0].seed2 = w[2].seed; }

  // Semi 1: winner of QF1 (Bimm) vs winner of QF3 (Mike)
  if (w[1]) { BRACKET.semifinals[1].gm1 = w[1].gm; BRACKET.semifinals[1].team1 = w[1].team; BRACKET.semifinals[1].seed1 = w[1].seed; }
  if (w[3]) { BRACKET.semifinals[1].gm2 = w[3].gm; BRACKET.semifinals[1].team2 = w[3].team; BRACKET.semifinals[1].seed2 = w[3].seed; }

  // Final
  function getSemiWinner(semi) {
    if (!semi.winner) return null;
    if (semi.winner === 1) return { gm: semi.gm1, team: semi.team1, seed: semi.seed1 };
    if (semi.winner === 2) return { gm: semi.gm2, team: semi.team2, seed: semi.seed2 };
    return null;
  }

  const sw = BRACKET.semifinals.map(getSemiWinner);
  if (sw[0]) { BRACKET.final.gm1 = sw[0].gm; BRACKET.final.team1 = sw[0].team; BRACKET.final.seed1 = sw[0].seed; }
  if (sw[1]) { BRACKET.final.gm2 = sw[1].gm; BRACKET.final.team2 = sw[1].team; BRACKET.final.seed2 = sw[1].seed; }

  // Champion
  const fw = getSemiWinner(BRACKET.final) || (BRACKET.final.winner === 1
    ? { gm: BRACKET.final.gm1, team: BRACKET.final.team1, seed: BRACKET.final.seed1 }
    : BRACKET.final.winner === 2
      ? { gm: BRACKET.final.gm2, team: BRACKET.final.team2, seed: BRACKET.final.seed2 }
      : null);
  BRACKET.champion = fw;
}

// ── DOM helpers ───────────────────────────────────────────────────────────

function makeSlot(gm, team, seed, state, gmImageMap, score) {
  // state: 'normal' | 'winner' | 'eliminated' | 'tbd'
  const slot = document.createElement('div');
  slot.className = 'team-slot ' + state;

  if (state === 'tbd') {
    const badge = document.createElement('div');
    badge.className = 'seed-badge';
    badge.textContent = seed !== null ? seed : '?';
    const img = document.createElement('img');
    img.className = 'slot-photo';
    img.src = 'assets/default-avatar.png';
    img.alt = 'TBD';
    const text = document.createElement('div');
    text.className = 'slot-text';
    const gmEl = document.createElement('div');
    gmEl.className = 'slot-gm';
    gmEl.textContent = 'TBD';
    text.appendChild(gmEl);
    slot.appendChild(badge);
    slot.appendChild(img);
    slot.appendChild(text);
    return slot;
  }

  const badge = document.createElement('div');
  badge.className = 'seed-badge';
  badge.textContent = seed;

  const img = document.createElement('img');
  img.className = 'slot-photo';
  img.src = gmImageMap.get(gm) || 'assets/default-avatar.png';
  img.alt = gm;
  img.onerror = () => { img.src = 'assets/default-avatar.png'; };

  const text = document.createElement('div');
  text.className = 'slot-text';

  const gmEl = document.createElement('div');
  gmEl.className = 'slot-gm';
  gmEl.textContent = gm;

  const teamEl = document.createElement('div');
  teamEl.className = 'slot-team';
  teamEl.textContent = team;

  text.appendChild(gmEl);
  text.appendChild(teamEl);
  slot.appendChild(badge);
  slot.appendChild(img);
  slot.appendChild(text);

  if (score !== undefined) {
    const scoreEl = document.createElement('div');
    scoreEl.className = 'slot-score' + (state === 'winner' ? ' slot-score-winner' : '');
    scoreEl.textContent = score.toFixed(2);
    slot.appendChild(scoreEl);
  }

  return slot;
}

function makeMatchup(match, gmImageMap, roundLabel) {
  const wrap = document.createElement('div');
  wrap.className = 'matchup';

  function slotState(which) {
    if (!match.winner) return match['gm' + which] ? 'normal' : 'tbd';
    if (match.winner === which) return 'winner';
    return 'eliminated';
  }

  const state1 = slotState(1);
  const state2 = slotState(2);

  const slot1 = makeSlot(match.gm1, match.team1, match.seed1, state1, gmImageMap, match.score1);
  const divider = document.createElement('div');
  divider.className = 'matchup-divider';
  divider.innerHTML = '<span class="matchup-divider-line"></span><span class="matchup-divider-vs">VS</span><span class="matchup-divider-line"></span>';
  const slot2 = makeSlot(match.gm2, match.team2, match.seed2, state2, gmImageMap, match.score2);

  wrap.appendChild(slot1);
  wrap.appendChild(divider);
  wrap.appendChild(slot2);

  if (match.gm1 && match.gm2) {
    wrap.classList.add('matchup-clickable');
    wrap.addEventListener('click', () => selectMatchup(wrap, match, roundLabel));
  }

  return wrap;
}

function makeRound(label, matches, gmImageMap) {
  const col = document.createElement('div');
  col.className = 'round';

  const lbl = document.createElement('div');
  lbl.className = 'round-label';
  lbl.textContent = label;
  col.appendChild(lbl);

  const matchesWrap = document.createElement('div');
  matchesWrap.className = 'round-matches';

  matches.forEach(m => {
    matchesWrap.appendChild(makeMatchup(m, gmImageMap, label));
  });

  col.appendChild(matchesWrap);
  return col;
}

function makeConnectorCol(pairCount) {
  // pairCount = number of matchup-pairs being merged (2 for QF→Semi, 1 for Semi→Final)
  // Each connector bracket joins two matchups into one output line (brace shape)
  const col = document.createElement('div');
  col.className = 'connector-col';
  col.style.cssText = 'width:40px;flex-shrink:0;display:flex;flex-direction:column;';

  // Spacer to match round-label height
  const spacer = document.createElement('div');
  spacer.style.cssText = 'height:calc(0.4rem + 1rem + 1px + 1rem);flex-shrink:0;';
  col.appendChild(spacer);

  const inner = document.createElement('div');
  inner.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:1.5rem;padding-bottom:1rem;';

  for (let i = 0; i < pairCount; i++) {
    // Each bracket group: top-half border + bottom-half border meeting at centre
    const group = document.createElement('div');
    group.style.cssText = 'flex:1;display:flex;flex-direction:column;';

    const top = document.createElement('div');
    top.style.cssText = 'flex:1;border-right:2px solid rgba(255,255,255,0.15);border-bottom:2px solid rgba(255,255,255,0.15);';

    const bottom = document.createElement('div');
    bottom.style.cssText = 'flex:1;border-right:2px solid rgba(255,255,255,0.15);border-top:2px solid rgba(255,255,255,0.15);';

    group.appendChild(top);
    group.appendChild(bottom);
    inner.appendChild(group);
  }

  col.appendChild(inner);
  return col;
}

function makeChampionCol(gmImageMap) {
  const col = document.createElement('div');
  col.className = 'champion-col';

  const lbl = document.createElement('div');
  lbl.className = 'champion-label';
  lbl.textContent = 'Champion';

  const slot = document.createElement('div');
  slot.className = 'champion-slot' + (BRACKET.champion ? '' : ' tbd');

  if (BRACKET.champion) {
    const photo = document.createElement('img');
    photo.className = 'champion-photo';
    photo.src = gmImageMap.get(BRACKET.champion.gm) || 'assets/default-avatar.png';
    photo.alt = BRACKET.champion.gm;
    photo.onerror = () => { photo.src = 'assets/default-avatar.png'; };

    const gmEl = document.createElement('div');
    gmEl.className = 'champion-gm';
    gmEl.textContent = BRACKET.champion.gm;

    const teamEl = document.createElement('div');
    teamEl.className = 'champion-team';
    teamEl.textContent = BRACKET.champion.team;

    slot.appendChild(photo);
    slot.appendChild(gmEl);
    slot.appendChild(teamEl);
  } else {
    const trophy = document.createElement('div');
    trophy.className = 'champion-trophy';
    trophy.textContent = '🏆';
    const tbdEl = document.createElement('div');
    tbdEl.className = 'champion-gm';
    tbdEl.textContent = 'TBD';
    slot.appendChild(trophy);
    slot.appendChild(tbdEl);
  }

  col.appendChild(lbl);
  col.appendChild(slot);
  return col;
}

// ── Analysis panel ────────────────────────────────────────────────────────

let selectedMatchup = null;
let bracketSnark = false;
let bracketIsPreview = false;

function selectMatchup(el, match, roundLabel) {
  document.querySelectorAll('.matchup-clickable').forEach(m => m.classList.remove('selected'));

  const panel = document.getElementById('bracketAnalyzePanel');
  if (selectedMatchup === match) {
    selectedMatchup = null;
    panel.classList.remove('visible');
    return;
  }

  bracketIsPreview = match.score1 === undefined;
  el.classList.add('selected');
  selectedMatchup = { ...match, round: roundLabel };
  document.getElementById('bracketAnalyzeTitle').textContent = `${match.gm1} vs ${match.gm2}`;
  document.getElementById('bracketAnalyzeBtn').textContent = bracketIsPreview ? 'Bimmbots v1 Preview' : 'Bimmbots v1 Analysis';
  document.getElementById('bracketUserContext').value = '';
  document.getElementById('bracketReportContainer').style.display = 'none';
  panel.classList.add('visible');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatReport(text) {
  return text
    .replace(/## (.+)/g,      '<h2>$1</h2>')
    .replace(/### (.+)/g,     '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g,   '<br>')
    .replace(/^/,     '<p>')
    .replace(/$/,     '</p>');
}

// ── Main render ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  const container = document.getElementById('bracket-container');
  if (!container) return;

  container.innerHTML = '<div class="bracket-loading">Loading bracket...</div>';

  let gmImageMap = new Map();
  try {
    const gmsData = await fetch('gm.json').then(r => r.json());
    gmImageMap = new Map(gmsData.map(gm => [gm.name, gm.image]));
  } catch (e) {
    console.warn('Could not load gm.json, photos will be placeholders');
  }

  deriveAdvancing();

  container.innerHTML = '';

  const bracket = document.createElement('div');
  bracket.className = 'bracket';

  // QF column
  bracket.appendChild(makeRound('Quarterfinals', BRACKET.quarterfinals, gmImageMap));

  // QF→Semi connectors (4 matchups → 2 semi slots, so 2 pairs)
  bracket.appendChild(makeConnectorCol(2));

  // Semi column
  bracket.appendChild(makeRound('Semifinals', BRACKET.semifinals, gmImageMap));

  // Semi→Final connectors
  bracket.appendChild(makeConnectorCol(1));

  // Final column
  bracket.appendChild(makeRound('Final', [BRACKET.final], gmImageMap));

  // Final→Champion connector (simple horizontal line at middle)
  const finalConn = document.createElement('div');
  finalConn.style.cssText = 'width:30px;flex-shrink:0;display:flex;align-items:center;padding-top:calc(0.4rem + 1rem + 1px);';
  const finalLine = document.createElement('div');
  finalLine.style.cssText = 'width:100%;height:2px;background:rgba(255,255,255,0.15);';
  finalConn.appendChild(finalLine);
  bracket.appendChild(finalConn);

  // Champion
  bracket.appendChild(makeChampionCol(gmImageMap));

  container.appendChild(bracket);

  // ── Analysis panel wiring ──
  document.querySelectorAll('.bap-snark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bap-snark-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bracketSnark = btn.dataset.snark === 'on';
    });
  });

  document.getElementById('bracketAnalyzeBtn').addEventListener('click', async () => {
    if (!selectedMatchup) return;

    const btn = document.getElementById('bracketAnalyzeBtn');
    btn.disabled = true;
    document.getElementById('bracketLoading').style.display = 'flex';
    document.getElementById('bracketReportContainer').style.display = 'none';

    const userContext = document.getElementById('bracketUserContext').value.trim();
    const baseMessage = bracketIsPreview ? 'Preview this upcoming playoff matchup.' : 'Analyze this playoff matchup result.';
    const message = userContext ? `${baseMessage} Additional context: ${userContext}` : baseMessage;

    try {
      const res = await fetch(`${API_URL}?requestType=chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          matchupContext: selectedMatchup,
          snarkLevel: bracketSnark ? 'max' : 'low',
          isPreview: bracketIsPreview,
        }),
      });
      const data = await res.json();
      document.getElementById('bracketReportContent').innerHTML = formatReport(data.reply);
      document.getElementById('bracketReportContainer').style.display = 'block';
    } catch {
      document.getElementById('bracketReportContent').innerHTML = '<p>Error: Could not generate analysis. Please try again.</p>';
      document.getElementById('bracketReportContainer').style.display = 'block';
    }

    document.getElementById('bracketLoading').style.display = 'none';
    btn.disabled = false;
  });
});
