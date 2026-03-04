import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NHL_API = 'https://api-web.nhle.com/v1';
const SEASON = '20252026';

const SCORING = {
  goals: 3, assists: 2, plusMinus: 1, pim: 0.25,
  powerPlayPoints: 1, shortHandedPoints: 1, gameWinningGoals: 1.5,
};

function calcSkaterFP(game) {
  if (!game || game.toi === '00:00') return 0;
  const { goals = 0, assists = 0, plusMinus = 0, pim = 0,
    powerPlayPoints = 0, shorthandedPoints = 0, gameWinningGoals = 0 } = game;
  return goals * SCORING.goals + assists * SCORING.assists +
    plusMinus * SCORING.plusMinus + pim * SCORING.pim +
    powerPlayPoints * SCORING.powerPlayPoints +
    shorthandedPoints * SCORING.shortHandedPoints +
    gameWinningGoals * SCORING.gameWinningGoals;
}

function normalizeName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

const CACHE_FILE = join(__dirname, 'output/roster-stats-cache.json');
const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));

async function fetchGameLog(nhlId) {
  const url = `${NHL_API}/player/${nhlId}/game-log/${SEASON}/2`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.gameLog || [];
}

const THIRTY_DAYS_AGO = new Date();
THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

const targets = [
  { name: 'Lucas Raymond', gm: 'Dave' },
  { name: 'Tomas Hertl', gm: 'Trevor' },
  { name: 'Pavel Dorofeyev', gm: 'Trevor' },
  { name: 'Bryan Rust', gm: 'Adam' },
  { name: 'Steven Stamkos', gm: 'Jordan' },
  { name: 'Alex Ovechkin', gm: 'Adam' },
  { name: 'Artturi Lehkonen', gm: 'Dave' },
  { name: 'Filip Forsberg', gm: 'Jordan' },
  { name: 'Aliaksei Protas', gm: 'Hordo' },
  { name: 'Jamie Benn', gm: 'Bimm (current)' },
  { name: 'William Eklund', gm: 'Bimm (current)' },
];

console.log('Player'.padEnd(22) + 'GM'.padEnd(12) + 'Season FP/G'.padEnd(14) + 'Last30 FP/G'.padEnd(14) + 'Last30 GP'.padEnd(12) + 'Trend');
console.log('-'.repeat(80));

for (const t of targets) {
  const norm = normalizeName(t.name);
  const cached = cache[norm];
  if (!cached?.nhlId) { console.log(`${t.name}: No NHL ID`); continue; }

  const gameLog = await fetchGameLog(cached.nhlId);

  let totalFP = 0, gp = 0, fp30 = 0, gp30 = 0;

  for (const game of gameLog) {
    const fp = calcSkaterFP(game);
    const date = new Date(game.gameDate);
    totalFP += fp;
    gp++;
    if (date >= THIRTY_DAYS_AGO) { fp30 += fp; gp30++; }
  }

  const seasonFPG = gp > 0 ? totalFP / gp : 0;
  const last30FPG = gp30 > 0 ? fp30 / gp30 : 0;
  const trend = last30FPG > seasonFPG + 0.3 ? 'HOT' : last30FPG < seasonFPG - 0.3 ? 'COLD' : 'STEADY';

  console.log(
    t.name.padEnd(22) +
    t.gm.padEnd(12) +
    seasonFPG.toFixed(2).padStart(5).padEnd(14) +
    last30FPG.toFixed(2).padStart(5).padEnd(14) +
    String(gp30).padStart(3).padEnd(12) +
    trend
  );
}
