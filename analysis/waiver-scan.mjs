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

// Try to find NHL IDs from the CSV lookup
const csvText = readFileSync(join(__dirname, '../web-app/nhl-player-ids.csv'), 'utf8');
const csvLines = csvText.trim().split('\n').slice(1);
const csvIds = {};
for (const line of csvLines) {
  const parts = line.split(',');
  if (parts.length >= 4) {
    const name = parts[1].replace(/"/g, '').trim();
    const id = parts[3].trim();
    const norm = normalizeName(name);
    if (id) csvIds[norm] = id;
  }
}

// Also check cache
const CACHE_FILE = join(__dirname, 'output/roster-stats-cache.json');
let cache = {};
try { cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch(e) {}

function lookupId(name) {
  const norm = normalizeName(name);
  if (cache[norm]?.nhlId) return cache[norm].nhlId;
  if (csvIds[norm]) return csvIds[norm];
  return null;
}

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
  'Kevin Fiala', 'Noah Cates', 'Anders Lee', 'Simon Holmstrom',
  'Jack Quinn', 'Chris Kreider', 'Matty Beniers', 'Taylor Hall',
  'Bobby McMann', 'Fraser Minten', 'Christian Dvorak', 'Owen Tippett',
  'Chandler Stephenson', 'Zach Benson', 'Thomas Novak', 'Oliver Kapanen',
  'Ben Kindel', 'Corey Perry', 'Ryan Leonard', 'Justin Brazeau',
  'Dawson Mercer', 'Andrew Copp', 'Jason Zucker', 'Collin Graf', 'A.J. Greer'
];

console.log('Player'.padEnd(24) + 'Pos'.padEnd(8) + 'GP'.padEnd(6) + 'Season FP/G'.padEnd(14) + 'Last30 FP/G'.padEnd(14) + 'Last30 GP'.padEnd(12) + 'Trend');
console.log('-'.repeat(90));

const results = [];

for (const name of targets) {
  const nhlId = lookupId(name);
  if (!nhlId) {
    console.log(`${name.padEnd(24)} — No NHL ID found`);
    continue;
  }

  const gameLog = await fetchGameLog(nhlId);
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

  results.push({ name, gp, seasonFPG, last30FPG, gp30, trend, totalFP });
}

results.sort((a, b) => b.last30FPG - a.last30FPG);

for (const r of results) {
  console.log(
    r.name.padEnd(24) +
    String(r.gp).padStart(3).padEnd(6) +
    r.seasonFPG.toFixed(2).padStart(5).padEnd(14) +
    r.last30FPG.toFixed(2).padStart(5).padEnd(14) +
    String(r.gp30).padStart(3).padEnd(12) +
    r.trend
  );
}
