// trade-impact.mjs
// Compares pre vs post-deadline rosters to assess trade value
import { readFileSync } from 'fs';

function loadCSV(path) {
  const lines = readFileSync(new URL(path, import.meta.url), 'utf8').trim().split('\n');
  return lines.slice(1).map(line => {
    const parts = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    parts.push(cur);
    return { gm: parts[0], name: parts[1], pos: parts[3], fp: +parts[7] || 0, fpg: +parts[8] || 0, gp: +parts[6] || 0 };
  });
}

const pre = loadCSV('./output/rosters-pre-deadline.csv');
const post = loadCSV('./output/rosters.csv');

const gms = [...new Set(post.map(r => r.gm))].sort();
const REMAINING_GAMES = 20; // approximate games left

console.log('=== TRADE DEADLINE IMPACT ANALYSIS ===\n');
console.log('Metric: FP/G delta × ~20 remaining games = projected FP gain/loss\n');

const results = [];

for (const gm of gms) {
  const prePlayers = new Set(pre.filter(r => r.gm === gm).map(r => r.name));
  const postPlayers = post.filter(r => r.gm === gm);
  const preList = pre.filter(r => r.gm === gm);

  const added = postPlayers.filter(r => !prePlayers.has(r.name));
  const removed = preList.filter(r => !postPlayers.find(p => p.name === r.name));

  const addedFPG = added.reduce((s, p) => s + p.fpg, 0);
  const removedFPG = removed.reduce((s, p) => s + p.fpg, 0);
  const netFPGPerPlayer = added.length > 0 ? (addedFPG - removedFPG) : 0;
  const projectedGain = netFPGPerPlayer * REMAINING_GAMES;

  results.push({ gm, added, removed, addedFPG, removedFPG, netFPGPerPlayer, projectedGain });
}

// Sort by projected gain descending
results.sort((a, b) => b.projectedGain - a.projectedGain);

for (const r of results) {
  if (r.added.length === 0 && r.removed.length === 0) {
    console.log(`${r.gm.padEnd(10)} — no trades`);
    continue;
  }

  const gainStr = (r.projectedGain >= 0 ? '+' : '') + r.projectedGain.toFixed(0);
  console.log(`\n${r.gm} (projected gain: ${gainStr} FP over ${REMAINING_GAMES} games)`);

  if (r.added.length > 0) {
    console.log('  IN:');
    for (const p of r.added.sort((a, b) => b.fpg - a.fpg)) {
      console.log(`    + ${p.name.padEnd(24)} ${p.pos.padEnd(8)} FP/G: ${p.fpg.toFixed(2)}  (${p.gp} GP, ${p.fp} FP)`);
    }
  }
  if (r.removed.length > 0) {
    console.log('  OUT:');
    for (const p of r.removed.sort((a, b) => b.fpg - a.fpg)) {
      console.log(`    - ${p.name.padEnd(24)} ${p.pos.padEnd(8)} FP/G: ${p.fpg.toFixed(2)}  (${p.gp} GP, ${p.fp} FP)`);
    }
  }
  console.log(`  Net FP/G: ${r.addedFPG.toFixed(2)} in - ${r.removedFPG.toFixed(2)} out = ${r.netFPGPerPlayer >= 0 ? '+' : ''}${r.netFPGPerPlayer.toFixed(2)}/game`);
}

// Draft pick value estimation
console.log('\n\n=== DRAFT PICK VALUE ESTIMATION ===\n');
console.log('Based on what else moved in each trade:\n');

const picks = [
  // [round, what it was paired with on each side, context]
  { trade: 'Bimm→Dave: Scheifele+R4 vs Bussi+R1', r1side: 'Bussi (3.88 FP/G)', r2side: 'Scheifele (3.39 FP/G)', note: 'R1 helped offset ~88 FP advantage + player type diff' },
  { trade: 'Jordan→Andy: Malinski+R4 vs Hronek+R3', note: 'R3≈R4 (near-equivalent rounds paired with comparable players)' },
  { trade: 'Dan→Seedo: Kadri+R8 vs R2', note: 'R2 ≈ Kadri (2.05 FP/G, 57 GP) + R8 — R2 has significant standalone value' },
  { trade: 'Mike→Adam: Girard+R1 vs Chychrun+R6', note: 'R1−R6 ≈ Chychrun (1.26 FP/G) − Girard (1.64 FP/G) → R1 ≈ R6 + ~7 FP/G-worth of player value' },
  { trade: 'Marinos→Jordan: Barkov+R4 vs Fantilli+R1', note: 'R1−R4 ≈ Barkov(2.49) − Fantilli(2.73) → rounds nearly cancel on equal players' },
  { trade: 'Mike→Jordan: DeSmith+Coleman+R2+R4 vs Schmaltz+Swayman+R7+R9', note: 'R2+R4 ≈ R7+R9 + (Schmaltz+Swayman) − (DeSmith+Coleman) → Swayman significantly elevated value here' },
];

const roundValues = [
  { round: 'R1', est: '~40-60 FP (playoff-caliber player future value)', context: 'Moved in biggest trades as equalizers' },
  { round: 'R2', est: '~25-40 FP equivalent', context: 'Dan got Kadri (57 GP, 2.05 FP/G) + R8 for R2 — very valuable' },
  { round: 'R3', est: '~15-25 FP equivalent', context: 'Minor sweetener in 3-4 trades' },
  { round: 'R4', est: '~10-18 FP equivalent', context: 'Frequently paired as minor add-on' },
  { round: 'R5/R6', est: '~5-10 FP equivalent', context: 'Low-end sweetener, often paired with R5' },
  { round: 'R7-R11', est: '<5 FP equivalent', context: 'Essentially token inclusions to balance sheets' },
];

for (const rv of roundValues) {
  console.log(`  ${rv.round.padEnd(4)} ${rv.est.padEnd(40)} → ${rv.context}`);
}

console.log('\nNote: All pick values are estimates based on relative trade context.');
console.log('Actual value depends on draft order (determined by final standings).\n');
