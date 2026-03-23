// bracket.js — Bathouse Playoffs 2026 bracket renderer

// ── Bracket data (manually updated as rounds are played) ──────────────────
// winner: null = TBD, 1 = top team wins, 2 = bottom team wins
const BRACKET = {
  quarterfinals: [
    { seed1: 1, gm1: 'Andy',  team1: 'Birth2Girth',              seed2: 8, gm2: 'Dan',   team2: 'Mack Miller',         winner: null },
    { seed1: 2, gm1: 'Bimm', team1: 'Killin me Scheifle',        seed2: 7, gm2: 'Hordo', team2: 'Travis Fan Club',     winner: null },
    { seed1: 3, gm1: 'Colin', team1: 'The Real West Coast Chat', seed2: 6, gm2: 'Adam',  team2: 'SpudKick',            winner: null },
    { seed1: 4, gm1: 'Ryan',  team1: 'Monkey Butt',              seed2: 5, gm2: 'Mike',  team2: 'Shit The Driveway',   winner: null },
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

  // Semi 0: winner of QF0 vs winner of QF1
  if (w[0]) { BRACKET.semifinals[0].gm1 = w[0].gm; BRACKET.semifinals[0].team1 = w[0].team; BRACKET.semifinals[0].seed1 = w[0].seed; }
  if (w[1]) { BRACKET.semifinals[0].gm2 = w[1].gm; BRACKET.semifinals[0].team2 = w[1].team; BRACKET.semifinals[0].seed2 = w[1].seed; }

  // Semi 1: winner of QF2 vs winner of QF3
  if (w[2]) { BRACKET.semifinals[1].gm1 = w[2].gm; BRACKET.semifinals[1].team1 = w[2].team; BRACKET.semifinals[1].seed1 = w[2].seed; }
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

function makeSlot(gm, team, seed, state, gmImageMap) {
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
  return slot;
}

function makeMatchup(match, gmImageMap) {
  const wrap = document.createElement('div');
  wrap.className = 'matchup';

  function slotState(which) {
    // which = 1 or 2
    if (!match.winner) return match['gm' + which] ? 'normal' : 'tbd';
    if (match.winner === which) return 'winner';
    return 'eliminated';
  }

  const state1 = slotState(1);
  const state2 = slotState(2);

  const slot1 = makeSlot(match.gm1, match.team1, match.seed1, state1, gmImageMap);
  const divider = document.createElement('div');
  divider.className = 'matchup-divider';
  divider.innerHTML = '<span class="matchup-divider-line"></span><span class="matchup-divider-vs">VS</span><span class="matchup-divider-line"></span>';
  const slot2 = makeSlot(match.gm2, match.team2, match.seed2, state2, gmImageMap);

  wrap.appendChild(slot1);
  wrap.appendChild(divider);
  wrap.appendChild(slot2);
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
    matchesWrap.appendChild(makeMatchup(m, gmImageMap));
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
});
