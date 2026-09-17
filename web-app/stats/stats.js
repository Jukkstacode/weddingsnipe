import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db, auth, signIn, signOut, onAuthStateChanged } from '../js/firebase.js';
import { fantasyPointsForGame } from '../js/scoring.js';
import { GMS, BEER_NAMES, BEER_SEASON } from '../js/league.js';
import { COLORS, lineDataset, drawChart } from '../js/fp-chart.js';

const ENDPOINT = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
const SEASONS = [{ id: '20242025', label: '24-25' }, { id: '20252026', label: '25-26' }];
const CURRENT = SEASONS.at(-1).id;
const $ = id => document.getElementById(id);

const players = new Map();          // id -> { id, name, position, team, gm, years, beer? }
const beerGames = new Map();        // "bl-Gm" -> hand-entered games (beer league)
const picks = new Map();            // nhlId -> color
const gameLogs = new Map();         // "id.season" -> game[]
const schedules = new Map();        // "team.season" -> gameDate[]
const filter = { gm: '', pos: 'ALL', rfa: false, beer: false, q: '' };
let mode = CURRENT;                 // season id or 'both'
let chart = null;
let user = null;
let drawToken = 0;

function status(msg, cls = '') { $('status').textContent = msg; $('status').className = `status ${cls}`; }
function key(id, season) { return `${id}.${season}`; }
function seasonLabel(id) { return SEASONS.find(s => s.id === id)?.label ?? id; }
function activeSeasons() { return mode === 'both' ? SEASONS.map(s => s.id) : [mode]; }
function selectionKeys() { return [...picks.keys()].flatMap(id => activeSeasons().map(s => key(id, s))); }
function nextColor() {
  const used = new Set(picks.values());
  return COLORS.find(c => !used.has(c)) || COLORS[picks.size % COLORS.length];
}

// ---------- data ----------
async function loadRoster() {
  const [snap, beer] = await Promise.all([getDocs(collection(db, 'contracts')), getDocs(collection(db, 'beerleague'))]);
  snap.forEach(d => {
    const c = d.data();
    players.set(d.id, { id: d.id, name: c.player, position: c.position, team: c.team, gm: c.gm, years: c.years });
  });
  // Beer-league GMs chart like any player; their "game log" is hand-entered in Firestore.
  beer.forEach(d => {
    const b = d.data();
    if (!b.games?.length) return;   // nothing logged yet: keep them out of the roster
    const id = `bl-${d.id}`;
    players.set(id, { id, name: BEER_NAMES[d.id] || d.id, position: b.position, team: '', gm: d.id, years: 0, beer: true });
    beerGames.set(id, (b.games || []).slice().sort((a, c) => a.gameDate.localeCompare(c.gameDate)));
  });
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function getGameLog(id, season) {
  if (beerGames.has(id)) return season === BEER_SEASON ? beerGames.get(id) : [];
  const k = key(id, season);
  if (!gameLogs.has(k)) {
    const d = await fetchJSON(`${ENDPOINT}?requestType=gameLog&playerIds=${id}&season=${season}`);
    gameLogs.set(k, (d.gameLog || []).slice().sort((a, b) => a.gameDate.localeCompare(b.gameDate)));
  }
  return gameLogs.get(k);
}

async function getSchedule(team, season) {
  const k = key(team, season);
  if (!schedules.has(k)) {
    try {
      const d = await fetchJSON(`${ENDPOINT}?requestType=teamSchedule&teamAbbrev=${team}&season=${season}`);
      schedules.set(k, d.gameDates || []);
    } catch { schedules.set(k, []); }
  }
  return schedules.get(k);
}

async function addUnknownPlayers(ids) {
  const missing = ids.filter(id => !players.has(id));
  if (!missing.length) return;
  const info = await fetchJSON(`${ENDPOINT}?requestType=playerInfo&playerIds=${missing.join(',')}`);
  for (const id of missing) {
    const p = info[id] || { name: `#${id}`, position: '?' };
    players.set(id, { id, name: p.name, position: p.position, team: '', gm: '', years: 0, extra: true });
  }
}

// ---------- series ----------
async function buildSeries(id, season) {
  const p = players.get(id);
  const log = await getGameLog(id, season);
  const played = new Map();
  let total = 0;
  for (const g of log) {
    total += fantasyPointsForGame(g, g.position || p.position);   // beer-league games carry their own position
    played.set(g.gameDate, +total.toFixed(2));
  }
  // Missed games are judged per team stint so a mid-season trade doesn't count the new team's earlier games.
  const stints = [];
  for (const g of log) {
    const cur = stints.at(-1);
    if (cur && cur.team === g.teamAbbrev) cur.to = g.gameDate;
    else stints.push({ team: g.teamAbbrev, from: g.gameDate, to: g.gameDate });
  }
  const missed = new Set();
  for (const st of stints) {
    if (!st.team) continue;
    const sched = await getSchedule(st.team, season);
    for (const d of sched) if (d >= st.from && d <= st.to && !played.has(d)) missed.add(d);
  }
  const dates = [...new Set([...played.keys(), ...missed])].sort();

  let last = 0;
  const points = dates.map(d => {
    if (played.has(d)) last = played.get(d);
    return { date: d, y: last, missed: missed.has(d) };
  });
  return { id, season, name: p.name, position: p.position, points, gp: played.size, total, missed: missed.size };
}

// ---------- chart ----------
async function draw() {
  const token = ++drawToken;
  const keys = selectionKeys();
  $('empty').hidden = keys.length > 0;
  $('selected-count').textContent = `${picks.size} selected`;
  $('legend-dash').hidden = mode !== 'both';
  updateURL();
  if (!keys.length) { chart?.destroy(); chart = null; $('cards').innerHTML = ''; return; }

  $('loading').hidden = false;
  let series;
  try {
    series = await Promise.all(keys.map(k => { const [id, season] = k.split('.'); return buildSeries(id, season); }));
  } catch (e) { status(`Couldn't load game logs: ${e.message}`, 'err'); $('loading').hidden = true; return; }
  if (token !== drawToken) return;
  $('loading').hidden = true;

  const prior = mode === 'both';
  const datasets = series.map(s => lineDataset({
    label: `${s.name}${prior ? ` ${seasonLabel(s.season)}` : ''}`,
    color: picks.get(s.id), points: s.points, prior: prior && s.season !== CURRENT,
  }));
  chart = drawChart($('chart'), chart, datasets);

  $('cards').innerHTML = series.map((s, i) => `
    <div class="card ${prior && s.season !== CURRENT ? 'prior' : ''}" style="--c:${picks.get(s.id)}; animation-delay:${i * 40}ms">
      <button class="x" data-id="${s.id}" title="Remove">×</button>
      <div class="who">${s.name}</div>
      <div class="season">${seasonLabel(s.season)} · ${s.position}</div>
      <div class="big">${s.total.toFixed(1)}</div>
      <div class="row"><span>FP/G</span><b>${s.gp ? (s.total / s.gp).toFixed(2) : '–'}</b></div>
      <div class="row"><span>GP</span><b>${s.gp}</b></div>
      ${players.get(s.id)?.beer ? '' : `<div class="row"><span>Missed</span><b>${s.missed}</b></div>`}
    </div>`).join('');
}

// ---------- roster list ----------
function visiblePlayers() {
  const q = filter.q.toLowerCase();
  return [...players.values()]
    .filter(p => !filter.gm || p.gm === filter.gm)
    .filter(p => filter.pos === 'ALL' || p.position === filter.pos)
    .filter(p => !filter.rfa || p.years === 1)
    .filter(p => !filter.beer || p.beer)
    .filter(p => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
}

let outside = [];   // NHL search hits that aren't on any roster; shown below the roster, never as an overlay

function renderList() {
  const rows = visiblePlayers().map(p => {
    const c = picks.get(p.id);
    return `<li data-id="${p.id}" class="${c ? 'on' : ''}" style="--c:${c || ''}">
      <span class="swatch"></span>
      <div>
        <div class="name">${p.name}</div>
        <div class="meta">${p.position}${p.team ? ` · ${p.team}` : ''}${p.beer ? ' · Beer league' : p.gm ? ` · <b>${p.gm}</b>` : ''}${p.years === 1 ? ' · RFA' : ''}</div>
      </div>
    </li>`;
  }).join('') || '<li class="none">No rostered matches</li>';
  const extra = filter.q.length >= 3 && outside.length ? `
    <li class="divider">Not on a roster</li>
    ${outside.map(r => `<li class="outside" data-add="${r.playerId}" data-name="${r.name}" data-pos="${r.positionCode}" data-team="${r.teamAbbrev || ''}">
      <span class="swatch"></span>
      <div><div class="name">${r.name}</div><div class="meta">${r.positionCode}${r.teamAbbrev ? ` · ${r.teamAbbrev}` : ''}</div></div>
    </li>`).join('')}` : '';
  $('players').innerHTML = rows + extra;
}

function syncRow(id) {
  const li = $('players').querySelector(`li[data-id="${id}"]`);
  if (!li) return;
  const c = picks.get(id);
  li.classList.toggle('on', !!c);
  li.style.setProperty('--c', c || '');
}

function togglePlayer(id) {
  if (picks.has(id)) picks.delete(id); else picks.set(id, nextColor());
  syncRow(id);
  draw();
}

function setMode(m) {
  mode = m;
  $('season-mode').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  draw();
}

// ---------- URL / saved format: "id.season,id.season" ----------
function updateURL() {
  const p = selectionKeys().join(',');
  history.replaceState(null, '', p ? `?p=${p}` : location.pathname);
}

async function applySelection(keys) {
  const bySeason = new Map();
  for (const k of keys) { const [id, s] = k.split('.'); if (!bySeason.has(id)) bySeason.set(id, new Set()); bySeason.get(id).add(s); }
  const ids = [...bySeason.keys()];
  await addUnknownPlayers(ids);
  picks.clear();
  for (const id of ids) picks.set(id, nextColor());
  const seasonsUsed = new Set(keys.map(k => k.split('.')[1]));
  mode = seasonsUsed.size > 1 ? 'both' : (seasonsUsed.values().next().value || CURRENT);
  $('season-mode').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  renderList();
  draw();
}

// ---------- collapsed roster (phones) ----------
function setExpanded(on) {
  $('players').classList.toggle('expanded', on);
  $('list-toggle').setAttribute('aria-expanded', on);
  $('list-toggle').textContent = on ? 'Show fewer' : 'Show more';
}
$('list-toggle').onclick = () => setExpanded(!$('players').classList.contains('expanded'));

// ---------- search ----------
let searchTimer;
$('search').oninput = () => {
  filter.q = $('search').value.trim();
  if (filter.q) setExpanded(true);
  outside = [];
  renderList();
  clearTimeout(searchTimer);
  if (filter.q.length < 3) return;
  const q = filter.q;
  searchTimer = setTimeout(async () => {
    const res = await fetchJSON(`https://search.d3.nhle.com/api/v1/search/player?culture=en-us&limit=8&active=true&q=${encodeURIComponent(q)}`);
    if (q !== filter.q) return;   // typed more since; a newer search is on its way
    outside = res.filter(r => !players.has(r.playerId));
    renderList();
  }, 250);
};

function addOutside(el) {
  const { add: id, name, pos, team } = el.dataset;
  players.set(id, { id, name, position: pos, team, gm: '', years: 0, extra: true });
  $('search').value = ''; filter.q = ''; outside = [];
  picks.set(id, nextColor());
  renderList();
  draw();
}

// ---------- saved analyses ----------
function savedCol() { return collection(db, 'users', user.uid, 'analyses'); }

async function renderSaved() {
  const snap = await getDocs(query(savedCol(), orderBy('createdAt', 'desc')));
  $('saved-list').innerHTML = snap.docs.map(d => {
    const a = d.data();
    const when = a.createdAt?.toDate?.().toLocaleDateString() ?? '';
    return `<li data-id="${d.id}" data-sel="${a.selections.join(',')}">
      <div><div class="n">${a.name}</div><div class="d">${a.selections.length} lines · ${when}</div></div>
      <button data-del="${d.id}" title="Delete">×</button>
    </li>`;
  }).join('') || '<li class="muted" style="border:0;cursor:default">Nothing saved yet.</li>';
}

$('save-form').onsubmit = async e => {
  e.preventDefault();
  if (!picks.size) { status('Chart something first.', 'err'); return; }
  const name = $('save-name').value.trim();
  await addDoc(savedCol(), { name, selections: selectionKeys(), createdAt: serverTimestamp() });
  $('save-name').value = '';
  status(`Saved "${name}".`, 'ok');
  renderSaved();
};

$('saved-list').onclick = async e => {
  const del = e.target.closest('[data-del]');
  if (del) {
    if (!confirm('Delete this analysis?')) return;
    await deleteDoc(doc(savedCol(), del.dataset.del));
    renderSaved();
    return;
  }
  const li = e.target.closest('[data-sel]');
  if (li) applySelection(li.dataset.sel.split(','));
};

$('sign-in').onclick = () => signIn().catch(e => status(e.message, 'err'));
$('sign-out').onclick = () => signOut(auth);
onAuthStateChanged(auth, u => {
  user = u;
  $('saved-out').hidden = !!u;
  $('saved-in').hidden = !u;
  $('who').textContent = u ? u.displayName?.split(' ')[0] ?? u.email : '';
  if (u) renderSaved();
});

// ---------- wiring ----------
$('season-mode').innerHTML = [...SEASONS.map(s => [s.id, s.label]), ['both', 'Both']]
  .map(([m, l]) => `<button data-mode="${m}" class="${m === mode ? 'active' : ''}">${l}</button>`).join('');
$('season-mode').onclick = e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); };
$('gm-filter').innerHTML += GMS.map(g => `<option>${g}</option>`).join('');
$('gm-filter').onchange = () => { filter.gm = $('gm-filter').value; renderList(); };
$('pos-filter').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pos === 'RFA') {
    filter.rfa = !filter.rfa;
    b.classList.toggle('active', filter.rfa);
  } else if (b.dataset.pos === 'BEER') {
    filter.beer = !filter.beer;
    b.classList.toggle('active', filter.beer);
  } else {
    filter.pos = b.dataset.pos;
    $('pos-filter').querySelectorAll('button:not(.rfa):not(.beer)').forEach(x => x.classList.toggle('active', x === b));
  }
  renderList();
};
$('players').onclick = e => {
  const add = e.target.closest('li[data-add]'); if (add) return addOutside(add);
  const li = e.target.closest('li[data-id]'); if (li) togglePlayer(li.dataset.id);
};
$('cards').onclick = e => { const b = e.target.closest('.x'); if (b) togglePlayer(b.dataset.id); };
$('clear').onclick = () => { picks.clear(); renderList(); draw(); };
$('share').onclick = async () => {
  await navigator.clipboard.writeText(location.href);
  status('Link copied.', 'ok');
};

await loadRoster();
const preset = new URLSearchParams(location.search).get('p');
if (preset) await applySelection(preset.split(',').filter(k => /^(\d+|bl-\w+)\.\d{8}$/.test(k)));
else renderList();
