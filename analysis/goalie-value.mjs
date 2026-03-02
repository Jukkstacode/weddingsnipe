import { readFileSync } from 'fs';

const lines = readFileSync(new URL('./output/rosters.csv', import.meta.url), 'utf8').trim().split('\n');
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

function contractYears(c) { return parseInt(c) || 0; }

const allGoalies = rows
  .filter(r => r.pos === 'G')
  .sort((a, b) => b.fp - a.fp); // Sort by TOTAL FP

console.log('All goalies ranked by Total FP (what matters for playoffs)');
console.log('');
console.log('Rank  GM        Player                  GP   TotalFP  FP/G  Contract  IR   Tradeable?');
console.log('----  --------  ----------------------  ---  -------  ----  --------  ---  ----------');

allGoalies.forEach((g, i) => {
  const rank = standings[g.gm];
  const contract = g.contract || '';
  const years = contractYears(contract);
  let tradeable;
  if (g.gm === 'Bimm') tradeable = '(mine)';
  else if (!contract) tradeable = 'YES';
  else if (years === 1) tradeable = 'RFA';
  else tradeable = `NO`;
  const irTag = g.ir ? 'IR+' : '';

  const bimmMarker = g.gm === 'Bimm' ? ' <--' : '';
  console.log(
    String(i+1).padStart(4) + '  ' +
    g.gm.padEnd(8) + '  ' +
    g.name.padEnd(24) +
    String(g.gp).padStart(3) + '  ' +
    g.fp.toFixed(1).padStart(7) + '  ' +
    g.fpg.toFixed(2).padStart(4) + '  ' +
    contract.padEnd(8) + '  ' +
    irTag.padEnd(3) + '  ' +
    tradeable +
    bimmMarker
  );
});
