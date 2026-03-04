import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NHL_API = 'https://api-web.nhle.com/v1';
const SEASON = '20252026';

const SCORING = {
  wins: 3, goalsAgainst: -1.5, saves: 0.2, shutouts: 6
};

function calcGoalieFP(game) {
  if (!game || game.toi === '00:00') return 0;
  const { decision, shotsAgainst = 0, goalsAgainst = 0, shutouts = 0 } = game;
  const saves = shotsAgainst - goalsAgainst;
  let pts = saves * SCORING.saves + goalsAgainst * SCORING.goalsAgainst + shutouts * SCORING.shutouts;
  if (decision === 'W') pts += SCORING.wins;
  return pts;
}

// Load cache to get NHL IDs
const CACHE_FILE = join(__dirname, 'output/roster-stats-cache.json');
const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));

function normalizeName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

async function fetchGameLog(nhlId) {
  const url = `${NHL_API}/player/${nhlId}/game-log/${SEASON}/2`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.gameLog || [];
}

const goalies = [
  { name: 'Joseph Woll', label: 'Woll (Bimm)' },
  { name: 'Spencer Knight', label: 'Knight (Bimm)' },
  { name: 'Brandon Bussi', label: 'Bussi (Dave)' },
  { name: 'Igor Shesterkin', label: 'Shesterkin (Jordan)' },
  { name: 'John Gibson', label: 'Gibson (Bimm)' },
];

const DEC_20 = new Date('2025-12-20');
const THIRTY_DAYS_AGO = new Date();
THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

for (const g of goalies) {
  const norm = normalizeName(g.name);
  const cached = cache[norm];
  if (!cached?.nhlId) { console.log(`\n${g.label}: No NHL ID found`); continue; }

  const gameLog = await fetchGameLog(cached.nhlId);

  // Season totals
  let totalFP = 0, gp = 0;
  // Last 30 days
  let fp30 = 0, gp30 = 0;
  // Since Dec 20
  let fpSinceDec = 0, gpSinceDec = 0;
  // Before Dec 20
  let fpBeforeDec = 0, gpBeforeDec = 0;

  for (const game of gameLog) {
    const fp = calcGoalieFP(game);
    const date = new Date(game.gameDate);
    totalFP += fp;
    gp++;

    if (date >= THIRTY_DAYS_AGO) { fp30 += fp; gp30++; }
    if (date >= DEC_20) { fpSinceDec += fp; gpSinceDec++; }
    else { fpBeforeDec += fp; gpBeforeDec++; }
  }

  console.log(`\n=== ${g.label} ===`);
  console.log(`  Season:       ${gp} GP | ${totalFP.toFixed(1)} FP | ${(gp > 0 ? totalFP/gp : 0).toFixed(2)} FP/G`);
  console.log(`  Last 30 days: ${gp30} GP | ${fp30.toFixed(1)} FP | ${(gp30 > 0 ? fp30/gp30 : 0).toFixed(2)} FP/G`);
  console.log(`  Since Dec 20: ${gpSinceDec} GP | ${fpSinceDec.toFixed(1)} FP | ${(gpSinceDec > 0 ? fpSinceDec/gpSinceDec : 0).toFixed(2)} FP/G`);
  console.log(`  Before Dec 20: ${gpBeforeDec} GP | ${fpBeforeDec.toFixed(1)} FP | ${(gpBeforeDec > 0 ? fpBeforeDec/gpBeforeDec : 0).toFixed(2)} FP/G`);
}
