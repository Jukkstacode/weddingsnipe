// One-time import of v1 contracts.json into the Firestore `contracts` collection.
import { readFileSync } from 'node:fs';
import { Firestore } from '@google-cloud/firestore';

const src = new URL('../web-app/v1/contracts.json', import.meta.url);
const contracts = JSON.parse(readFileSync(src, 'utf8'));
const db = new Firestore({ projectId: 'wedding-snipe' });

let batch = db.batch();
let count = 0;
for (const c of contracts) {
  if (!c.nhlId) { console.warn(`Skipping ${c.Player} (${c.GM}): no nhlId`); continue; }
  batch.set(db.collection('contracts').doc(String(c.nhlId)), {
    nhlId: String(c.nhlId),
    gm: c.GM,
    player: c.Player,
    position: c.Position,
    team: c.Team,
    years: Number(c['Contract Length']),
    stolen: Boolean(c['Stolen?']),
    updatedAt: new Date(),
    updatedBy: 'import',
  });
  if (++count % 400 === 0) { await batch.commit(); batch = db.batch(); }
}
await batch.commit();
console.log(`Imported ${count} contracts`);
