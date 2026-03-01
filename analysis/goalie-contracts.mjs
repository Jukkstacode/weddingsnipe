import { readFileSync } from 'fs';

const lines = readFileSync('c:/Users/chris/web-projects/weddingsnipe/analysis/output/rosters.csv', 'utf8').trim().split('\n');
const rows = lines.slice(1).map(line => {
  const parts = []; let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { parts.push(cur); cur = ''; }
    else cur += ch;
  }
  parts.push(cur);
  return { gm: parts[0], name: parts[1], pos: parts[3], ir: parts[4], contract: parts[5], gp: +parts[6], fp: +parts[7]||0, fpg: +parts[8]||0 };
});

const standings = { Andy:1, Colin:2, Bimm:3, Ryan:4, Mike:5, Adam:6, Hordo:7, Charlie:8, Dan:9, Dave:10, Seedo:11, Jordan:12, Marinos:13, Trevor:14 };

const goalies = rows
  .filter(r => r.pos === 'G' && r.gm !== 'Bimm')
  .sort((a, b) => standings[a.gm] - standings[b.gm] || b.fpg - a.fpg);

console.log('GM        Rank  Goalie                  FP/G  Contract   Tradeable?');
console.log('--------  ----  ----------------------  ----  ---------  ----------');
for (const g of goalies) {
  const rank = standings[g.gm];
  const contract = g.contract || '';
  const years = parseInt(contract) || 0;
  let tradeable;
  if (!contract) tradeable = 'YES (no contract)';
  else if (years === 1) tradeable = 'RFA trade (need 1yr back)';
  else tradeable = `NO (${contract})`;
  const irTag = g.ir ? ' (IR)' : '';
  console.log(
    g.gm.padEnd(8) + '  ' +
    String(rank).padStart(4) + '  ' +
    (g.name + irTag).padEnd(24) +
    g.fpg.toFixed(2).padStart(4) + '  ' +
    contract.padEnd(9) + '  ' +
    tradeable
  );
}
