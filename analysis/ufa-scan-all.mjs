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
  return { gm: parts[0], name: parts[1], pos: parts[3], contract: parts[5], gp: +parts[6], fp: +parts[7]||0, fpg: +parts[8]||0 };
});

// Bimm's current players (exclude from results)
const bimmPlayers = new Set([
  'Brandon Hagel','Bo Horvat','Mitch Marner','Jared McCann','Drake Batherson',
  'Gabriel Vilardi','Juraj Slafkovsky','Mats Zuccarello','Jamie Benn','William Eklund',
  'Darren Raddysh','Rasmus Dahlin','Josh Manson','Josh Morrissey',
  'Brandon Bussi','John Gibson','Joseph Woll','Spencer Knight'
]);

const ufaForwards = rows.filter(r => !r.contract && r.pos !== 'G' && r.pos !== 'D' && r.fpg >= 1.80 && !bimmPlayers.has(r.name))
  .sort((a, b) => b.fpg - a.fpg);

console.log('All UFA forwards (no contract) across ALL teams, 1.80+ FP/G:\n');
ufaForwards.forEach(p => {
  console.log(
    p.name.padEnd(24) + p.gm.padEnd(10) + p.pos.padEnd(14) +
    'FP/G:' + p.fpg.toFixed(2).padStart(5) +
    '  GP:' + String(p.gp).padStart(3) +
    '  TotalFP:' + p.fp.toFixed(1).padStart(7)
  );
});
