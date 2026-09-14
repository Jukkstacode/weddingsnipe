import { Storage } from '@google-cloud/storage';

const BUCKET = process.env.BUCKET || 'wedding-snipe-countdown-site';
const ROSTER_OBJECT = process.env.ROSTER_OBJECT || 'data/contracts.json';
const OUTPUT_OBJECT = process.env.OUTPUT_OBJECT || 'data/player-stats.json';
const SEASON = process.env.SEASON || '20252026';
const NHL_DELAY_MS = 100;

const bucket = new Storage().bucket(BUCKET);

function emptyStats(data) {
  return {
    season: SEASON,
    gamesPlayed: 0, goals: 0, assists: 0, points: 0, plusMinus: 0,
    pim: 0, powerPlayGoals: 0, powerPlayPoints: 0,
    shorthandedGoals: 0, shorthandedPoints: 0, gameWinningGoals: 0,
    shots: 0, wins: 0, losses: 0, otLosses: 0, goalsAgainst: 0,
    goalsAgainstAverage: 0, savePctg: 0, shotsAgainst: 0, shutouts: 0,
    position: data.position || null,
    fullName: `${data.firstName?.default || ''} ${data.lastName?.default || ''}`.trim(),
    teamAbbrev: data.currentTeamAbbrev || null,
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchPlayerStats(playerId) {
  const res = await fetch(`https://api-web.nhle.com/v1/player/${playerId}/landing`);
  if (!res.ok) throw new Error(`NHL API ${res.status}`);
  const data = await res.json();

  const featured = data.featuredStats?.regularSeason?.subSeason;
  // NHL returns last season's stats until a player plays this season; zero those out.
  if (!featured || String(data.featuredStats.season) !== SEASON) return emptyStats(data);

  const s = featured;
  return {
    ...emptyStats(data),
    gamesPlayed: s.gamesPlayed || 0,
    goals: s.goals || 0,
    assists: s.assists || 0,
    points: s.points || 0,
    plusMinus: s.plusMinus || 0,
    pim: s.pim || s.penaltyMinutes || 0,
    powerPlayGoals: s.powerPlayGoals || 0,
    powerPlayPoints: s.powerPlayPoints || 0,
    shorthandedGoals: s.shorthandedGoals || 0,
    shorthandedPoints: s.shorthandedPoints || 0,
    gameWinningGoals: s.gameWinningGoals || 0,
    shots: s.shots || 0,
    wins: s.wins || 0,
    losses: s.losses || 0,
    otLosses: s.otLosses || 0,
    goalsAgainst: s.goalsAgainst || 0,
    goalsAgainstAverage: s.goalsAgainstAverage || s.goalsAgainstAvg || 0,
    savePctg: s.savePctg || s.savePercentage || 0,
    shotsAgainst: s.shotsAgainst || 0,
    shutouts: s.shutouts || 0,
  };
}

async function main() {
  const [rosterBuf] = await bucket.file(ROSTER_OBJECT).download();
  const roster = JSON.parse(rosterBuf.toString());
  const playerIds = [...new Set(roster.map(r => r.nhlId).filter(Boolean))];
  console.log(`Refreshing ${playerIds.length} players for ${SEASON}`);

  const players = {};
  const errors = [];
  for (const id of playerIds) {
    try {
      players[id] = await fetchPlayerStats(id);
    } catch (err) {
      console.error(`Player ${id}: ${err.message}`);
      errors.push(id);
    }
    await new Promise(r => setTimeout(r, NHL_DELAY_MS));
  }

  const output = { season: SEASON, updatedAt: new Date().toISOString(), errors, players };
  await bucket.file(OUTPUT_OBJECT).save(JSON.stringify(output), {
    contentType: 'application/json',
    metadata: { cacheControl: 'public, max-age=300' },
  });
  console.log(`Wrote gs://${BUCKET}/${OUTPUT_OBJECT} (${Object.keys(players).length} ok, ${errors.length} failed)`);
  if (errors.length && errors.length === playerIds.length) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
