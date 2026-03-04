const fs = require('fs');
const csv = fs.readFileSync('/Users/chrisbimm/Coding/wedding-snipe/analysis/output/rosters.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);

const players = lines.map(line => {
  const parts = [];
  let inQuote = false;
  let cur = '';
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { parts.push(cur); cur = ''; }
    else cur += ch;
  }
  parts.push(cur);
  return {
    gm: parts[0],
    name: parts[1],
    team: parts[2],
    pos: parts[3],
    ir: parts[4],
    contract: parts[5],
    gp: parseInt(parts[6]) || 0,
    totalFP: parseFloat(parts[7]) || 0,
    fpg: parseFloat(parts[8]) || 0
  };
});

const byGM = {};
for (const p of players) {
  if (!byGM[p.gm]) byGM[p.gm] = { ufas: [], rfas: [], multiyr: [], all: [] };
  byGM[p.gm].all.push(p);
  if (!p.contract) byGM[p.gm].ufas.push(p);
  else if (p.contract === '1yr') byGM[p.gm].rfas.push(p);
  else byGM[p.gm].multiyr.push(p);
}

console.log('=== ALL RFAs BY GM ===');
for (const [gm, data] of Object.entries(byGM)) {
  if (data.rfas.length > 0) {
    console.log('\n' + gm + ':');
    data.rfas.sort((a,b) => b.fpg - a.fpg).forEach(p => {
      console.log('  ' + p.name + ' (' + p.pos + ') - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total, ' + p.gp + ' GP');
    });
  }
}

console.log('\n\n=== CHARLIE (8th) FULL ROSTER ===');
byGM['Charlie'].all.sort((a,b) => b.fpg - a.fpg).forEach(p => {
  const type = p.contract ? (p.contract === '1yr' ? 'RFA' : p.contract) : 'UFA';
  console.log('  ' + p.name + ' (' + p.pos + ') [' + type + '] - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total' + (p.ir ? ' IR' : ''));
});

console.log('\n\n=== TREVOR (14th) FULL ROSTER ===');
byGM['Trevor'].all.sort((a,b) => b.fpg - a.fpg).forEach(p => {
  const type = p.contract ? (p.contract === '1yr' ? 'RFA' : p.contract) : 'UFA';
  console.log('  ' + p.name + ' (' + p.pos + ') [' + type + '] - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total' + (p.ir ? ' IR' : ''));
});

console.log('\n\n=== HORDO (7th) FULL ROSTER ===');
byGM['Hordo'].all.sort((a,b) => b.fpg - a.fpg).forEach(p => {
  const type = p.contract ? (p.contract === '1yr' ? 'RFA' : p.contract) : 'UFA';
  console.log('  ' + p.name + ' (' + p.pos + ') [' + type + '] - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total' + (p.ir ? ' IR' : ''));
});

console.log('\n\n=== BOTTOM-HALF GMs UFAs (ranked by FPG) ===');
const bottomHalf = ['Dan', 'Dave', 'Seedo', 'Jordan', 'Marinos', 'Trevor'];
for (const gm of bottomHalf) {
  const data = byGM[gm];
  console.log('\n' + gm + ' UFAs:');
  data.ufas.sort((a,b) => b.fpg - a.fpg).forEach(p => {
    console.log('  ' + p.name + ' (' + p.pos + ') - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total, ' + p.gp + ' GP');
  });
}

console.log('\n\n=== CHARLIE UFAs specifically ===');
byGM['Charlie'].ufas.sort((a,b) => b.fpg - a.fpg).forEach(p => {
  console.log('  ' + p.name + ' (' + p.pos + ') - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total, ' + p.gp + ' GP');
});

console.log('\n\n=== RFAs from GMs ranked 5-14 ===');
const gm5to14 = ['Mike', 'Adam', 'Hordo', 'Charlie', 'Dan', 'Dave', 'Seedo', 'Jordan', 'Marinos', 'Trevor'];
const allRFAs = [];
for (const gm of gm5to14) {
  for (const p of byGM[gm].rfas) {
    allRFAs.push({...p, gm});
  }
}
allRFAs.sort((a,b) => b.fpg - a.fpg).forEach(p => {
  console.log('  ' + p.name + ' (' + p.pos + ') [' + p.gm + '] - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total');
});

console.log('\n\n=== BIMM CURRENT ROSTER ===');
byGM['Bimm'].all.sort((a,b) => b.fpg - a.fpg).forEach(p => {
  const type = p.contract ? (p.contract === '1yr' ? 'RFA' : p.contract) : 'UFA';
  console.log('  ' + p.name + ' (' + p.pos + ') [' + type + '] - ' + p.fpg + ' FP/G, ' + p.totalFP + ' total' + (p.ir ? ' IR' : ''));
});
