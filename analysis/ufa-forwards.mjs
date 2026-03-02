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
  return { gm: parts[0], name: parts[1], team: parts[2], pos: parts[3], ir: parts[4], contract: parts[5], gp: +parts[6], fp: +parts[7]||0, fpg: +parts[8]||0 };
});

const sellers = ["Hordo","Charlie","Dan","Dave","Seedo","Jordan","Marinos","Trevor"];
const forwards = rows.filter(r => sellers.includes(r.gm) && !r.contract && r.pos !== "G" && r.pos !== "D" && r.fpg >= 2.40)
  .sort((a,b) => b.fpg - a.fpg);

console.log("All UFA forwards on seller teams (7-14) with 2.40+ FP/G:\n");
forwards.forEach(p => {
  const irTag = p.ir ? " (IR+)" : "";
  console.log(
    p.name.padEnd(22) + p.gm.padEnd(10) + p.team.padEnd(6) + p.pos.padEnd(12) +
    "FP/G:" + p.fpg.toFixed(2).padStart(5) +
    "  GP:" + String(p.gp).padStart(3) +
    "  TotalFP:" + p.fp.toFixed(1).padStart(7) +
    irTag
  );
});
