import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NHL_API = 'https://api-web.nhle.com/v1';
const SEASON = '20252026';

const SCORING = {
  goals: 3, assists: 2, plusMinus: 1, pim: 0.25,
  powerPlayPoints: 1, shortHandedPoints: 1, gameWinningGoals: 1.5,
  wins: 3, goalsAgainst: -1.5, saves: 0.2, shutouts: 6
};

function normalizeName(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calcSkaterFP(game) {
  if (!game || game.toi === '00:00') return 0;
  const { goals = 0, assists = 0, plusMinus = 0, pim = 0,
    powerPlayPoints = 0, shorthandedPoints = 0, gameWinningGoals = 0 } = game;
  return goals * SCORING.goals + assists * SCORING.assists +
    plusMinus * SCORING.plusMinus + pim * SCORING.pim +
    powerPlayPoints * SCORING.powerPlayPoints +
    shorthandedPoints * SCORING.shortHandedPoints +
    gameWinningGoals * SCORING.gameWinningGoals;
}

function calcGoalieFP(game) {
  if (!game || game.toi === '00:00') return 0;
  const { decision, shotsAgainst = 0, goalsAgainst = 0, shutouts = 0 } = game;
  const saves = shotsAgainst - goalsAgainst;
  let pts = saves * SCORING.saves + goalsAgainst * SCORING.goalsAgainst + shutouts * SCORING.shutouts;
  if (decision === 'W') pts += SCORING.wins;
  return pts;
}

// Build lookups from contracts.json
const contracts = JSON.parse(readFileSync(join(__dirname, '../web-app/contracts.json'), 'utf8'));
const contractIds = {};
const contractInfo = {};
for (const c of contracts) {
  const norm = normalizeName(c.Player);
  contractIds[norm] = c.nhlId;
  contractInfo[norm] = { length: c['Contract Length'], stolen: c['Stolen?'] };
}

// Build name->id and name->team lookups from nhl-player-ids.csv
const csvText = readFileSync(join(__dirname, '../web-app/nhl-player-ids.csv'), 'utf8');
const csvLines = csvText.trim().split('\n').slice(1);
const csvIds = {};
const teamLookup = {};
for (const line of csvLines) {
  // Format: Team,Player Name,Position,Player ID
  const parts = line.split(',');
  if (parts.length >= 4) {
    const team = parts[0].trim();
    const name = parts[1].replace(/"/g, '').trim();
    const id = parts[3].trim();
    const norm = normalizeName(name);
    if (id) csvIds[norm] = id;
    if (team) teamLookup[norm] = team;
  }
}

function lookupId(name) {
  const norm = normalizeName(name);
  return contractIds[norm] || csvIds[norm] || null;
}

function lookupTeam(name) {
  return teamLookup[normalizeName(name)] || '???';
}

function lookupContract(name) {
  return contractInfo[normalizeName(name)] || null;
}

// All 14 rosters
const ROSTERS = {
  Bimm: [
    { name: 'Tage Thompson', pos: 'C' },
    { name: 'Dylan Larkin', pos: 'C' },
    { name: 'Rickard Rakell', pos: 'C,LW,RW' },
    { name: 'Jared McCann', pos: 'C,LW' },
    { name: 'Pavel Buchnevich', pos: 'C,LW,RW' },
    { name: 'William Eklund', pos: 'LW,RW' },
    { name: 'Josh Manson', pos: 'D' },
    { name: 'Rasmus Dahlin', pos: 'D' },
    { name: 'Noah Hanifin', pos: 'D' },
    { name: 'Mats Zuccarello', pos: 'RW' },
    { name: 'Mark Scheifele', pos: 'C' },
    { name: 'Carter Verhaeghe', pos: 'LW' },
    { name: 'Lawson Crouse', pos: 'LW,RW' },
    { name: 'Mitch Marner', pos: 'C,LW,RW' },
    { name: 'Jamie Benn', pos: 'C,LW,RW' },
    { name: 'Josh Morrissey', pos: 'D', ir: true },
    { name: 'Joseph Woll', pos: 'G' },
    { name: 'Spencer Knight', pos: 'G' },
  ],
  Andy: [
    { name: 'Dylan Cozens', pos: 'C' },
    { name: 'Brayden Point', pos: 'C' },
    { name: 'Brady Tkachuk', pos: 'C,LW' },
    { name: 'Quinton Byfield', pos: 'C,LW' },
    { name: 'Morgan Geekie', pos: 'C,LW,RW' },
    { name: 'Nikita Kucherov', pos: 'RW' },
    { name: 'Filip Hronek', pos: 'D' },
    { name: "K'Andre Miller", pos: 'D' },
    { name: 'Lane Hutson', pos: 'D' },
    { name: 'Sean Durzi', pos: 'D' },
    { name: 'Jason Robertson', pos: 'LW,RW' },
    { name: 'Matthew Knies', pos: 'LW' },
    { name: 'Dylan Guenther', pos: 'LW,RW' },
    { name: 'Cole Perfetti', pos: 'C,LW,RW' },
    { name: 'Troy Terry', pos: 'RW', ir: true },
    { name: 'Jake Oettinger', pos: 'G' },
    { name: 'Ilya Sorokin', pos: 'G' },
    { name: 'Lukas Dostal', pos: 'G' },
  ],
  Jordan: [
    { name: 'Elias Lindholm', pos: 'C' },
    { name: 'Bo Horvat', pos: 'C' },
    { name: 'Filip Forsberg', pos: 'LW' },
    { name: 'Bobby McMann', pos: 'LW' },
    { name: 'Steven Stamkos', pos: 'C,LW,RW' },
    { name: 'Gabriel Vilardi', pos: 'C,RW' },
    { name: 'Matthew Schaefer', pos: 'D' },
    { name: 'Quinn Hughes', pos: 'D' },
    { name: 'Sam Malinski', pos: 'D' },
    { name: 'Mike Matheson', pos: 'D' },
    { name: 'Artemi Panarin', pos: 'LW' },
    { name: 'Adam Fantilli', pos: 'C' },
    { name: 'Nick Schmaltz', pos: 'C,RW' },
    { name: 'Cutter Gauthier', pos: 'LW,RW' },
    { name: 'Adam Fox', pos: 'D', ir: true },
    { name: 'Igor Shesterkin', pos: 'G' },
    { name: 'Joel Hofer', pos: 'G' },
    { name: 'Jeremy Swayman', pos: 'G' },
  ],
  Dan: [
    { name: 'Auston Matthews', pos: 'C' },
    { name: 'Nathan MacKinnon', pos: 'C' },
    { name: 'Juraj Slafkovsky', pos: 'LW,RW' },
    { name: 'Jake Guentzel', pos: 'LW,RW' },
    { name: 'Viktor Arvidsson', pos: 'LW,RW' },
    { name: 'Jackson Blake', pos: 'RW' },
    { name: 'Oliver Ekman-Larsson', pos: 'D' },
    { name: 'Darren Raddysh', pos: 'D' },
    { name: 'Thomas Chabot', pos: 'D' },
    { name: 'Mattias Ekholm', pos: 'D' },
    { name: 'Peyton Krebs', pos: 'C' },
    { name: 'Kyle Connor', pos: 'LW' },
    { name: 'Nazem Kadri', pos: 'C' },
    { name: 'J.T. Miller', pos: 'C,LW,RW' },
    { name: 'Anthony Stolarz', pos: 'G' },
    { name: 'Jet Greaves', pos: 'G' },
    { name: 'Yaroslav Askarov', pos: 'G' },
  ],
  Charlie: [
    { name: 'Macklin Celebrini', pos: 'C' },
    { name: 'John Tavares', pos: 'C' },
    { name: 'Brandon Hagel', pos: 'LW,RW' },
    { name: 'Tyler Bertuzzi', pos: 'LW,RW' },
    { name: 'Anthony Mantha', pos: 'LW,RW' },
    { name: 'Drake Batherson', pos: 'LW,RW' },
    { name: 'Erik Karlsson', pos: 'D' },
    { name: 'Moritz Seider', pos: 'D' },
    { name: 'Evan Bouchard', pos: 'D' },
    { name: 'John Carlson', pos: 'D' },
    { name: 'David Pastrnak', pos: 'RW' },
    { name: 'Matvei Michkov', pos: 'LW,RW' },
    { name: 'Mason McTavish', pos: 'C' },
    { name: 'Jonathan Huberdeau', pos: 'C,LW', ir: true },
    { name: 'Frederik Andersen', pos: 'G' },
    { name: 'John Gibson', pos: 'G' },
    { name: 'Tristan Jarry', pos: 'G' },
    { name: 'Adin Hill', pos: 'G' },
  ],
  Ryan: [
    { name: 'Seth Jarvis', pos: 'C,LW,RW' },
    { name: 'Trevor Zegras', pos: 'C,LW,RW' },
    { name: 'Marat Khusnutdinov', pos: 'C,LW' },
    { name: 'Clayton Keller', pos: 'LW,RW' },
    { name: 'Jesper Bratt', pos: 'LW,RW' },
    { name: 'Vasily Podkolzin', pos: 'LW,RW' },
    { name: 'Miro Heiskanen', pos: 'D' },
    { name: 'J.J. Moser', pos: 'D' },
    { name: 'John Marino', pos: 'D' },
    { name: 'Devon Toews', pos: 'D' },
    { name: "Ryan O'Reilly", pos: 'C' },
    { name: 'Sam Reinhart', pos: 'C,RW' },
    { name: 'Matthew Tkachuk', pos: 'LW,RW' },
    { name: 'Beckett Sennecke', pos: 'RW' },
    { name: 'Pavel Zacha', pos: 'C,LW', ir: true },
    { name: 'Mackenzie Blackwood', pos: 'G' },
    { name: 'Philipp Grubauer', pos: 'G' },
    { name: 'Stuart Skinner', pos: 'G' },
  ],
  Marinos: [
    { name: 'Nick Suzuki', pos: 'C' },
    { name: 'Sean Couturier', pos: 'C' },
    { name: 'Victor Olofsson', pos: 'LW,RW' },
    { name: 'Jaden Schwartz', pos: 'C,LW' },
    { name: 'Ivan Demidov', pos: 'RW' },
    { name: 'Kirill Marchenko', pos: 'RW' },
    { name: 'Vince Dunn', pos: 'D' },
    { name: 'Olen Zellweger', pos: 'D' },
    { name: 'Logan Stanley', pos: 'D' },
    { name: 'Brent Burns', pos: 'D' },
    { name: 'Connor McDavid', pos: 'C' },
    { name: 'Jack Eichel', pos: 'C' },
    { name: 'Gabriel Landeskog', pos: 'LW,RW' },
    { name: 'Alexis Lafreniere', pos: 'LW,RW' },
    { name: 'Tyler Toffoli', pos: 'LW,RW' },
    { name: 'Aleksander Barkov', pos: 'C', ir: true },
    { name: 'Logan Thompson', pos: 'G' },
    { name: 'Dustin Wolf', pos: 'G' },
  ],
  Seedo: [
    { name: 'Ridly Greig', pos: 'C,LW,RW' },
    { name: 'Will Smith', pos: 'C,RW' },
    { name: 'Cole Caufield', pos: 'LW,RW' },
    { name: 'Claude Giroux', pos: 'LW,RW' },
    { name: 'Jordan Eberle', pos: 'RW' },
    { name: 'Josh Doan', pos: 'LW,RW' },
    { name: 'Dmitry Orlov', pos: 'D' },
    { name: 'Mattias Samuelsson', pos: 'D' },
    { name: 'Justin Faulk', pos: 'D' },
    { name: 'Aaron Ekblad', pos: 'D' },
    { name: 'Evgeni Malkin', pos: 'C,LW,RW' },
    { name: 'Marcus Johansson', pos: 'LW' },
    { name: 'Wyatt Johnston', pos: 'C,RW' },
    { name: 'Leo Carlsson', pos: 'C' },
    { name: 'Anthony Cirelli', pos: 'C', ir: true },
    { name: 'Sam Montembeault', pos: 'G' },
    { name: 'Jake Allen', pos: 'G' },
    { name: 'Connor Ingram', pos: 'G' },
  ],
  Mike: [
    { name: 'Connor Bedard', pos: 'C,RW' },
    { name: 'Sebastian Aho', pos: 'C' },
    { name: 'Andrei Svechnikov', pos: 'LW,RW' },
    { name: 'Alex Tuch', pos: 'LW,RW' },
    { name: 'Martin Necas', pos: 'RW' },
    { name: 'Mika Zibanejad', pos: 'C,RW' },
    { name: 'Cale Makar', pos: 'D' },
    { name: 'Roman Josi', pos: 'D' },
    { name: 'Samuel Girard', pos: 'D' },
    { name: 'Alexander Nikishin', pos: 'D' },
    { name: 'Vincent Trocheck', pos: 'C' },
    { name: 'Jacob Trouba', pos: 'D' },
    { name: 'Valeri Nichushkin', pos: 'LW,RW' },
    { name: 'Blake Coleman', pos: 'C,LW,RW' },
    { name: 'Mikko Rantanen', pos: 'LW,RW', ir: true },
    { name: 'Andrei Vasilevskiy', pos: 'G' },
    { name: 'Darcy Kuemper', pos: 'G' },
    { name: 'Casey DeSmith', pos: 'G' },
  ],
  Adam: [
    { name: 'Ryan McLeod', pos: 'C' },
    { name: 'Ryan Nugent-Hopkins', pos: 'C,LW' },
    { name: 'Nikolaj Ehlers', pos: 'LW,RW' },
    { name: 'Alex Ovechkin', pos: 'LW,RW' },
    { name: 'Patrick Kane', pos: 'RW' },
    { name: 'Bryan Rust', pos: 'RW' },
    { name: 'Dougie Hamilton', pos: 'D' },
    { name: 'Noah Dobson', pos: 'D' },
    { name: 'MacKenzie Weegar', pos: 'D' },
    { name: 'Jakob Chychrun', pos: 'D' },
    { name: 'Jake Sanderson', pos: 'D' },
    { name: 'Robert Thomas', pos: 'C' },
    { name: 'JJ Peterka', pos: 'LW,RW' },
    { name: 'Roope Hintz', pos: 'C' },
    { name: 'Akira Schmid', pos: 'G' },
    { name: 'Linus Ullmark', pos: 'G' },
    { name: 'Karel Vejmelka', pos: 'G' },
    { name: 'Thatcher Demko', pos: 'G', ir: true },
  ],
  Colin: [
    { name: 'Dylan Strome', pos: 'C' },
    { name: 'Brock Nelson', pos: 'C' },
    { name: 'Travis Konecny', pos: 'LW,RW' },
    { name: 'Zach Hyman', pos: 'LW,RW' },
    { name: 'Tom Wilson', pos: 'RW' },
    { name: 'Charlie McAvoy', pos: 'D' },
    { name: 'Brandon Montour', pos: 'D' },
    { name: 'Rasmus Andersson', pos: 'D' },
    { name: 'Shayne Gostisbehere', pos: 'D' },
    { name: 'Tim Stutzle', pos: 'C,LW' },
    { name: 'Adrian Kempe', pos: 'RW' },
    { name: 'Elias Pettersson', pos: 'C,LW' },
    { name: 'Alex DeBrincat', pos: 'LW,RW' },
    { name: 'Jordan Kyrou', pos: 'RW' },
    { name: 'Sam Bennett', pos: 'C' },
    { name: 'Filip Gustavsson', pos: 'G' },
    { name: 'Scott Wedgewood', pos: 'G' },
  ],
  Dave: [
    { name: 'Jack Hughes', pos: 'C,LW' },
    { name: 'Josh Norris', pos: 'C' },
    { name: 'Leon Draisaitl', pos: 'C,LW' },
    { name: 'Artturi Lehkonen', pos: 'LW,RW' },
    { name: 'Charlie Coyle', pos: 'C,RW' },
    { name: 'Lucas Raymond', pos: 'RW' },
    { name: 'Mikhail Sergachev', pos: 'D' },
    { name: 'Nate Schmidt', pos: 'D' },
    { name: 'Brandt Clarke', pos: 'D' },
    { name: 'Victor Hedman', pos: 'D' },
    { name: 'Mikael Backlund', pos: 'C' },
    { name: 'Luke Evangelista', pos: 'RW' },
    { name: 'Matt Boldy', pos: 'LW,RW' },
    { name: 'Timo Meier', pos: 'LW,RW' },
    { name: 'Connor Hellebuyck', pos: 'G' },
    { name: 'Juuse Saros', pos: 'G' },
    { name: 'Brandon Bussi', pos: 'G' },
  ],
  Hordo: [
    { name: 'Sidney Crosby', pos: 'C', ir: true },
    { name: 'Matt Duchene', pos: 'C,RW' },
    { name: 'Mason Marchment', pos: 'LW' },
    { name: 'Dmitri Voronkov', pos: 'LW' },
    { name: 'Mathew Barzal', pos: 'C,RW' },
    { name: 'Aliaksei Protas', pos: 'LW,RW' },
    { name: 'Zach Werenski', pos: 'D' },
    { name: 'Morgan Rielly', pos: 'D' },
    { name: 'Bowen Byram', pos: 'D' },
    { name: 'Luke Hughes', pos: 'D' },
    { name: 'Kent Johnson', pos: 'C,LW,RW' },
    { name: 'Joel Eriksson Ek', pos: 'C' },
    { name: 'Logan Cooley', pos: 'C' },
    { name: 'Kirill Kaprizov', pos: 'LW' },
    { name: 'Tyler Seguin', pos: 'C,RW', ir: true },
    { name: 'Jordan Binnington', pos: 'G' },
    { name: 'Dan Vladar', pos: 'G' },
    { name: 'Pyotr Kochetkov', pos: 'G', ir: true },
  ],
  Trevor: [
    { name: 'William Nylander', pos: 'C,RW' },
    { name: 'Nico Hischier', pos: 'C' },
    { name: 'Jake Neighbours', pos: 'LW,RW' },
    { name: 'Pierre-Luc Dubois', pos: 'C,LW' },
    { name: 'Pavel Dorofeyev', pos: 'LW,RW' },
    { name: 'Mark Stone', pos: 'RW' },
    { name: 'Thomas Harley', pos: 'D' },
    { name: 'Brock Faber', pos: 'D' },
    { name: 'Shea Theodore', pos: 'D' },
    { name: 'Drew Doughty', pos: 'D' },
    { name: 'Anton Lundell', pos: 'C' },
    { name: 'Tomas Hertl', pos: 'C,LW' },
    { name: 'Ivan Barbashev', pos: 'LW' },
    { name: 'Jackson LaCombe', pos: 'D' },
    { name: 'Brad Marchand', pos: 'LW,RW', ir: true },
    { name: 'Jesper Wallstedt', pos: 'G' },
    { name: 'Jacob Markstrom', pos: 'G' },
    { name: 'Sergei Bobrovsky', pos: 'G' },
  ],
};

async function fetchGameLog(nhlId, retries = 3) {
  const url = `${NHL_API}/player/${nhlId}/game-log/${SEASON}/2`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return [];
      const data = await res.json();
      return data.gameLog || [];
    } catch (e) {
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return [];
}

async function processPlayer(player) {
  const nhlId = lookupId(player.name);
  if (!nhlId) {
    return { ...player, nhlId: null, totalFP: null, gp: 0, fpg: null };
  }
  try {
    const gameLog = await fetchGameLog(nhlId);
    const isGoalie = player.pos.includes('G');
    let totalFP = 0;
    let gp = 0;
    for (const game of gameLog) {
      const fp = isGoalie ? calcGoalieFP(game) : calcSkaterFP(game);
      totalFP += fp;
      if (!game.toi || game.toi !== '00:00') gp++;
    }
    const fpg = gp > 0 ? totalFP / gp : 0;
    return { ...player, nhlId, totalFP: parseFloat(totalFP.toFixed(1)), gp, fpg: parseFloat(fpg.toFixed(2)) };
  } catch (e) {
    return { ...player, nhlId, totalFP: null, gp: 0, fpg: null };
  }
}

async function runBatch(players) {
  const results = [];
  for (let i = 0; i < players.length; i++) {
    process.stdout.write(`\r${i + 1}/${players.length}: ${players[i].name.padEnd(25)}`);
    results.push(await processPlayer(players[i]));
    await new Promise(r => setTimeout(r, 150));
  }
  process.stdout.write('\n');
  return results;
}

const CACHE_FILE = join(__dirname, 'output/roster-stats-cache.json');

// Flatten all players, deduplicate by name
const allPlayers = [];
const seen = new Set();
for (const [gm, roster] of Object.entries(ROSTERS)) {
  for (const player of roster) {
    const key = normalizeName(player.name);
    if (!seen.has(key)) {
      seen.add(key);
      allPlayers.push(player);
    }
  }
}

let statsMap;
if (existsSync(CACHE_FILE)) {
  console.log('Loading stats from cache...');
  statsMap = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
} else {
  console.log(`Fetching game logs for ${allPlayers.length} unique players...`);
  const noId = allPlayers.filter(p => !lookupId(p.name));
  if (noId.length > 0) {
    console.log(`\nNo ID found for ${noId.length} players:`);
    noId.forEach(p => console.log(`  - ${p.name}`));
  }
  const results = await runBatch(allPlayers);
  statsMap = {};
  for (const r of results) statsMap[normalizeName(r.name)] = r;
  mkdirSync(join(__dirname, 'output'), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(statsMap, null, 2));
  console.log(`\nSaved cache to ${CACHE_FILE}`);
}

// Output markdown tables per GM
for (const [gm, roster] of Object.entries(ROSTERS)) {
  console.log(`\n### ${gm}\n`);
  console.log('| Player | Team | Pos | Contract | GP | Total FP | FP/G |');
  console.log('|--------|------|-----|----------|----|----------:|------:|');
  for (const player of roster) {
    const stats = statsMap[normalizeName(player.name)];
    const contract = lookupContract(player.name);
    const team = lookupTeam(player.name);
    const contractStr = contract ? `${contract.length}yr${contract.stolen ? '*' : ''}` : '-';
    const fp = stats?.totalFP != null ? stats.totalFP.toFixed(1) : 'N/A';
    const fpg = stats?.fpg != null ? stats.fpg.toFixed(2) : 'N/A';
    const gp = stats?.gp ?? 0;
    const irTag = player.ir ? ' (IR+)' : '';
    console.log(`| ${player.name}${irTag} | ${team} | ${player.pos} | ${contractStr} | ${gp} | ${fp} | ${fpg} |`);
  }
}

// Output CSV
const csvRows = ['GM,Player,Team,Pos,IR,Contract,GP,TotalFP,FPG'];
for (const [gm, roster] of Object.entries(ROSTERS)) {
  for (const player of roster) {
    const stats = statsMap[normalizeName(player.name)];
    const contract = lookupContract(player.name);
    const team = lookupTeam(player.name);
    const contractStr = contract ? `${contract.length}yr${contract.stolen ? '*' : ''}` : '';
    const fp = stats?.totalFP != null ? stats.totalFP.toFixed(1) : '';
    const fpg = stats?.fpg != null ? stats.fpg.toFixed(2) : '';
    const gp = stats?.gp ?? 0;
    const ir = player.ir ? 'IR+' : '';
    const name = player.name.includes(',') ? `"${player.name}"` : player.name;
    const pos = player.pos.includes(',') ? `"${player.pos}"` : player.pos;
    csvRows.push(`${gm},${name},${team},${pos},${ir},${contractStr},${gp},${fp},${fpg}`);
  }
}
const csvPath = join(__dirname, 'output/rosters.csv');
writeFileSync(csvPath, csvRows.join('\n'));
console.log(`\nSaved CSV to ${csvPath}`);
