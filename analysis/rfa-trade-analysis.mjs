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
function posGroup(pos) {
  if (pos === 'G') return 'G';
  if (pos === 'D') return 'D';
  return 'F';
}

// Bimm's 1yr RFA trade chips (forwards only - his surplus)
console.log('=== BIMM\'s 1yr RFA Trade Chips (Forwards) ===');
const bimmRFAs = rows.filter(r => r.gm === 'Bimm' && contractYears(r.contract) === 1 && posGroup(r.pos) === 'F')
  .sort((a, b) => b.fpg - a.fpg);
bimmRFAs.forEach(p => console.log(`  ${p.name.padEnd(22)} ${p.pos.padEnd(8)} FP/G:${p.fpg.toFixed(2)}  TotalFP:${p.fp}`));

// Bimm's no-contract forwards (also tradeable, no leverage but filler)
console.log('\n=== BIMM\'s No-Contract Forwards (sweetener material) ===');
const bimmNoContract = rows.filter(r => r.gm === 'Bimm' && !r.contract && posGroup(r.pos) === 'F')
  .sort((a, b) => b.fpg - a.fpg);
bimmNoContract.forEach(p => console.log(`  ${p.name.padEnd(22)} ${p.pos.padEnd(8)} FP/G:${p.fpg.toFixed(2)}  TotalFP:${p.fp}`));

// For each seller GM (rank 9-14), show their 1yr D/G and no-contract D/G they could throw in
const sellerGMs = Object.entries(standings).filter(([gm, rank]) => rank >= 9 && gm !== 'Bimm').sort((a,b) => a[1]-b[1]);

console.log('\n=== SELLER GMs — What They Can Offer ===');
for (const [gm, rank] of sellerGMs) {
  const gmRows = rows.filter(r => r.gm === gm);

  const rfa1yr = gmRows.filter(r => contractYears(r.contract) === 1 && (posGroup(r.pos) === 'D' || posGroup(r.pos) === 'G'))
    .sort((a, b) => b.fpg - a.fpg);
  const noContract = gmRows.filter(r => !r.contract && (posGroup(r.pos) === 'D' || posGroup(r.pos) === 'G'))
    .sort((a, b) => b.fpg - a.fpg);

  if (rfa1yr.length === 0 && noContract.length === 0) continue;

  console.log(`\n--- ${gm} (rank ${rank}) ---`);
  if (rfa1yr.length) {
    console.log('  1yr RFAs (match your 1yr):');
    rfa1yr.forEach(p => console.log(`    ${p.name.padEnd(22)} ${posGroup(p.pos)}  FP/G:${p.fpg.toFixed(2)}  GP:${p.gp}${p.ir ? ' (IR)' : ''}`));
  }
  if (noContract.length) {
    console.log('  No-contract D/G (sweetener they could add):');
    noContract.forEach(p => console.log(`    ${p.name.padEnd(22)} ${posGroup(p.pos)}  FP/G:${p.fpg.toFixed(2)}  GP:${p.gp}${p.ir ? ' (IR)' : ''}`));
  }
}
