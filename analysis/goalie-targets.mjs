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

const targets = ["Charlie","Hordo","Trevor","Jordan","Dave","Dan","Seedo","Marinos"];
const goalies = rows.filter(r => targets.includes(r.gm) && r.pos === "G").sort((a,b) => b.fpg - a.fpg);

console.log("Available goalies on trade partner / seller teams:\n");
goalies.forEach(g => {
  const c = g.contract || "UFA";
  const ir = g.ir ? " (IR+)" : "";
  console.log(
    g.name.padEnd(22) + g.gm.padEnd(10) + g.team.padEnd(6) +
    "FP/G:" + g.fpg.toFixed(2).padStart(5) +
    "  GP:" + String(g.gp).padStart(3) +
    "  TotalFP:" + g.fp.toFixed(1).padStart(7) +
    "  " + c + ir
  );
});
