import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadCSV(file) {
  const lines = readFileSync(join(__dirname, 'output', file), 'utf8').trim().split('\n');
  return lines.slice(1).map(line => {
    const parts = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    parts.push(cur);
    return { gm: parts[0], name: parts[1], fpg: +parts[8] || 0 };
  });
}

const pre = loadCSV('rosters-pre-deadline.csv');
const post = loadCSV('rosters.csv');

const gms = [...new Set(post.map(r => r.gm))].sort();

const results = gms.map(gm => {
  const preFPG = pre.filter(r => r.gm === gm).reduce((s, r) => s + r.fpg, 0);
  const postFPG = post.filter(r => r.gm === gm).reduce((s, r) => s + r.fpg, 0);
  const preCount = pre.filter(r => r.gm === gm).length;
  const postCount = post.filter(r => r.gm === gm).length;
  return { gm, preFPG, postFPG, delta: postFPG - preFPG, preAvg: preFPG / preCount, postAvg: postFPG / postCount };
}).sort((a, b) => b.delta - a.delta);

console.log('=== TOTAL ROSTER FP/G: PRE vs POST DEADLINE ===\n');
console.log('GM         Pre Sum  Post Sum    Delta  Pre Avg  Post Avg  AvgDelta');
console.log('-'.repeat(70));
for (const r of results) {
  const marker = r.gm === 'Bimm' ? ' <--' : '';
  const sign = r.delta >= 0 ? '+' : '';
  const avgDelta = r.postAvg - r.preAvg;
  const avgSign = avgDelta >= 0 ? '+' : '';
  console.log(
    r.gm.padEnd(10) +
    r.preFPG.toFixed(2).padStart(8) + ' ' +
    r.postFPG.toFixed(2).padStart(9) + ' ' +
    (sign + r.delta.toFixed(2)).padStart(8) + ' ' +
    r.preAvg.toFixed(2).padStart(8) + ' ' +
    r.postAvg.toFixed(2).padStart(9) + ' ' +
    (avgSign + avgDelta.toFixed(2)).padStart(9) +
    marker
  );
}
