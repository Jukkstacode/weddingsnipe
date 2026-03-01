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

// Bimm's weakest D for reference
console.log('=== Bimm D (bar to beat) ===');
rows.filter(r => r.gm === 'Bimm' && r.pos === 'D').sort((a,b) => b.fpg - a.fpg).forEach(p => {
  console.log(`  ${p.name.padEnd(22)} FP/G:${p.fpg.toFixed(2)}  ${p.contract || 'no contract'}${p.ir ? ' (IR)' : ''}`);
});

console.log('\n=== All Other GM Defensemen — No Contract or 1yr ===');
console.log('GM        Rank  Player                  FP/G   GP  Contract   Tradeable?');
console.log('--------  ----  ----------------------  -----  --  ---------  ----------');

const defenders = rows
  .filter(r => r.pos === 'D' && r.gm !== 'Bimm')
  .sort((a, b) => standings[a.gm] - standings[b.gm] || b.fpg - a.fpg);

for (const p of defenders) {
  const rank = standings[p.gm];
  const contract = p.contract || '';
  const years = parseInt(contract) || 0;
  let tradeable;
  if (!contract) tradeable = 'YES (no contract)';
  else if (years === 1) tradeable = 'RFA (need 1yr back)';
  else tradeable = `NO (${contract})`;

  // Only show tradeable ones
  if (years > 1) continue;

  const irTag = p.ir ? ' (IR)' : '';
  console.log(
    p.gm.padEnd(8) + '  ' +
    String(rank).padStart(4) + '  ' +
    (p.name + irTag).padEnd(24) +
    p.fpg.toFixed(2).padStart(5) + '  ' +
    String(p.gp).padStart(2) + '  ' +
    contract.padEnd(9) + '  ' +
    tradeable
  );
}
