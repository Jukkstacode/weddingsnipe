import { readFileSync } from 'fs';

const lines = readFileSync(new URL('./output/rosters.csv', import.meta.url), 'utf8').trim().split('\n');
const rows = lines.slice(1).map(line => {
  const parts = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { parts.push(cur); cur = ''; }
    else cur += ch;
  }
  parts.push(cur);
  return { gm: parts[0], name: parts[1], team: parts[2], pos: parts[3], ir: parts[4], gp: +parts[6], fp: +parts[7] || 0, fpg: +parts[8] || 0 };
});

const gms = [...new Set(rows.map(r => r.gm))];

function posGroup(pos) {
  if (pos === 'G') return 'G';
  if (pos === 'D') return 'D';
  return 'F';
}

const summary = {};
for (const gm of gms) {
  const roster = rows.filter(r => r.gm === gm);
  const groups = { F: [], D: [], G: [] };
  for (const p of roster) groups[posGroup(p.pos)].push(p);
  summary[gm] = {};
  for (const [g, players] of Object.entries(groups)) {
    // Include IR players in counts — they're expected to return
    summary[gm][g] = {
      activeFP: players.reduce((s, p) => s + p.fp, 0),
      avgFPG: players.length ? players.reduce((s, p) => s + p.fpg, 0) / players.length : 0,
      activeCount: players.length,
      irCount: players.filter(p => p.ir).length,
      players: players.sort((a, b) => b.fp - a.fp)
    };
  }
}
11
// Print ranked tables by position group
for (const g of ['F', 'D', 'G']) {
  const label = g === 'F' ? 'FORWARDS' : g === 'D' ? 'DEFENSE' : 'GOALIES';
  const ranked = gms.map(gm => ({ gm, ...summary[gm][g] })).sort((a, b) => b.activeFP - a.activeFP);
  const avgFP = ranked.reduce((s, r) => s + r.activeFP, 0) / ranked.length;
  const avgFPG = ranked.reduce((s, r) => s + r.avgFPG, 0) / ranked.length;
  console.log(`\n=== ${label} (avg total: ${avgFP.toFixed(0)}, avg FP/G: ${avgFPG.toFixed(2)}) ===`);
  console.log('Rank  GM        n  ActiveFP  AvgFPG  vs Avg');
  ranked.forEach((r, i) => {
    const diff = r.activeFP - avgFP;
    const marker = r.gm === 'Bimm' ? ' <--' : '';
    const irNote = r.irCount > 0 ? ` (${r.irCount} IR)` : '';
    console.log(`  ${String(i+1).padStart(2)}  ${r.gm.padEnd(8)}  ${r.activeCount}  ${r.activeFP.toFixed(1).padStart(8)}  ${r.avgFPG.toFixed(2).padStart(6)}  ${(diff >= 0 ? '+' : '') + diff.toFixed(0)}${irNote}${marker}`);
  });
}

// Show Bimm's D and G players in detail
console.log('\n=== Bimm Defense Detail ===');
summary['Bimm']['D'].players.forEach(p => {
  const irTag = p.ir ? '  (IR+ - expected back soon)' : '';
  console.log(`  ${p.name.padEnd(20)} ${p.team}  GP:${p.gp}  FP:${p.fp}  FPG:${p.fpg}${irTag}`);
});

console.log('\n=== Bimm Goalies Detail ===');
summary['Bimm']['G'].players.forEach(p => {
  const irTag = p.ir ? '  (IR+ - expected back soon)' : '';
  console.log(`  ${p.name.padEnd(20)} ${p.team}  GP:${p.gp}  FP:${p.fp}  FPG:${p.fpg}${irTag}`);
});
