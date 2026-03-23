// weddingsnipe-endpoint/index.js

import http from 'http';
import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { GoogleGenAI } from "@google/genai";

const cache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_SEASON = '20252026';
const CURRENT_SEASON_COLLECTION = 'player-stats-2025-2026';
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://wedding-snipe.firebaseio.com'
  });
}

const db = admin.firestore();

// Helper function for sending responses
const sendResponse = (res, data, cacheStatus) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Expose-Headers', 'X-Cache-Status');
  res.set('X-Cache-Status', cacheStatus);
  res.status(200).send(data);
};

// Main function
export const getNhlPlayerStats = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  // Handle POST requests
  if (req.method === 'POST') {
    const requestType = req.query.requestType;
    if (requestType === 'chat') {
      await handleChatRequest(req, res);
    } else {
      await handleSidebetSubmission(req, res);
    }
    return;
  }

  // Handle PUT requests
  if (req.method === 'PUT') {
    const { requestType } = req.query;

    if (requestType === 'assignMatchupSidebet') {
      await handleMatchupSidebetAssignment(req, res);
    } else {
      await handleSidebetUpdate(req, res);
    }
    return;
  }

  const { requestType = 'seasonTotals', playerIds, season } = req.query;

  if (requestType === 'gameLog') {
    await handleGameLogRequest(res, playerIds, season);
  } else if (requestType === 'teamSchedule') {
    await handleTeamScheduleRequest(res, req.query.teamAbbrev, season);
  } else if (requestType === 'playerInfo') {
    await handlePlayerInfoRequest(res, playerIds);
  } else if (requestType === 'playerName') {
    await handlePlayerNameRequest(res, playerIds);
  } else if (requestType === 'playerPosition') {
    await handlePlayerPositionRequest(res, playerIds);
  } else if (requestType === 'sidebets') {
    await handleSidebetRequest(res);
  } else if (requestType === 'currentSeasonStats') {
    await handleCurrentSeasonStatsRequest(res, playerIds);
  } else if (requestType === 'refreshCurrentSeasonStats') {
    await handleRefreshCurrentSeasonStats(req, res, playerIds);
  } else {
    await handleSeasonTotalsRequest(res, playerIds, season);
  }
};

// --- Fetch current season stats from NHL API and store in Firestore ---
async function fetchPlayerStatsFromNHL(playerId) {
  try {
    const url = `https://api-web.nhle.com/v1/player/${playerId}/landing`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`NHL API error for player ${playerId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    let currentSeasonStats = null;

    if (data.featuredStats?.regularSeason?.subSeason) {
      const featuredSeason = String(data.featuredStats.season);
      const subSeason = data.featuredStats.regularSeason.subSeason;

      // If the NHL API returns stats from a previous season (player hasn't
      // played this year), store zeroed-out stats instead of stale data.
      if (featuredSeason !== CURRENT_SEASON) {
        currentSeasonStats = {
          season: CURRENT_SEASON,
          gamesPlayed: 0, goals: 0, assists: 0, points: 0, plusMinus: 0,
          pim: 0, powerPlayGoals: 0, powerPlayPoints: 0,
          shorthandedGoals: 0, shorthandedPoints: 0, gameWinningGoals: 0,
          shots: 0, wins: 0, losses: 0, otLosses: 0, goalsAgainst: 0,
          goalsAgainstAverage: 0, savePctg: 0, shotsAgainst: 0, shutouts: 0,
          position: data.position || null,
          fullName: `${data.firstName?.default || ''} ${data.lastName?.default || ''}`.trim(),
          teamAbbrev: data.currentTeamAbbrev || null,
          lastUpdated: new Date().toISOString()
        };
        return currentSeasonStats;
      }

      currentSeasonStats = {
        season: CURRENT_SEASON,
        gamesPlayed: subSeason.gamesPlayed || 0,
        goals: subSeason.goals || 0,
        assists: subSeason.assists || 0,
        points: subSeason.points || 0,
        plusMinus: subSeason.plusMinus || 0,
        pim: subSeason.pim || subSeason.penaltyMinutes || 0,
        powerPlayGoals: subSeason.powerPlayGoals || 0,
        powerPlayPoints: subSeason.powerPlayPoints || 0,
        shorthandedGoals: subSeason.shorthandedGoals || 0,
        shorthandedPoints: subSeason.shorthandedPoints || 0,
        gameWinningGoals: subSeason.gameWinningGoals || 0,
        shots: subSeason.shots || 0,
        wins: subSeason.wins || 0,
        losses: subSeason.losses || 0,
        otLosses: subSeason.otLosses || 0,
        goalsAgainst: subSeason.goalsAgainst || 0,
        goalsAgainstAverage: subSeason.goalsAgainstAverage || subSeason.goalsAgainstAvg || 0,
        savePctg: subSeason.savePctg || subSeason.savePercentage || 0,
        shotsAgainst: subSeason.shotsAgainst || 0,
        shutouts: subSeason.shutouts || 0,
        position: data.position || null,
        fullName: `${data.firstName?.default || ''} ${data.lastName?.default || ''}`.trim(),
        teamAbbrev: data.currentTeamAbbrev || null,
        lastUpdated: new Date().toISOString()
      };
    }

    if (!currentSeasonStats && data.last5Games && data.last5Games.length > 0) {
      currentSeasonStats = {
        season: CURRENT_SEASON,
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        points: 0,
        plusMinus: 0,
        pim: 0,
        powerPlayGoals: 0,
        powerPlayPoints: 0,
        shorthandedGoals: 0,
        shorthandedPoints: 0,
        gameWinningGoals: 0,
        shots: 0,
        wins: 0,
        losses: 0,
        otLosses: 0,
        goalsAgainst: 0,
        goalsAgainstAverage: 0,
        savePctg: 0,
        shotsAgainst: 0,
        shutouts: 0,
        position: data.position || null,
        fullName: `${data.firstName?.default || ''} ${data.lastName?.default || ''}`.trim(),
        teamAbbrev: data.currentTeamAbbrev || null,
        lastUpdated: new Date().toISOString()
      };
    }

    return currentSeasonStats;
  } catch (error) {
    console.error(`Error fetching NHL stats for player ${playerId}:`, error);
    return null;
  }
}

// --- Handle refresh of current season stats ---
async function handleRefreshCurrentSeasonStats(req, res, playerIds) {
  const secret = process.env.REFRESH_SECRET;
  const authHeader = req.headers['authorization'];

  if (!secret || authHeader !== `Bearer ${secret}`) {
    res.status(401).send('Unauthorized');
    return;
  }

  if (!playerIds) {
    res.status(400).send('playerIds query parameter is required');
    return;
  }

  const playerIdsArray = playerIds.split(',');
  const results = {};
  const errors = [];

  try {
    for (const playerId of playerIdsArray) {
      const stats = await fetchPlayerStatsFromNHL(playerId);

      if (stats) {
        await db.collection(CURRENT_SEASON_COLLECTION).doc(playerId).set(stats, { merge: true });
        results[playerId] = stats;
      } else {
        errors.push(playerId);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Invalidate any cached currentSeasonStats responses containing these players
    for (const key of Object.keys(cache)) {
      if (key.startsWith('currentSeason_') && playerIdsArray.some(id => key.includes(id))) {
        delete cache[key];
      }
    }

    sendResponse(res, {
      success: true,
      updated: Object.keys(results).length,
      errors: errors,
      data: results
    }, 'refreshed');

  } catch (error) {
    console.error('Error refreshing current season stats:', error);
    res.status(500).send('Error refreshing stats');
  }
}

// --- Handle fetching current season stats from Firestore ---
async function handleCurrentSeasonStatsRequest(res, playerIds) {
  if (!playerIds) {
    res.status(400).send('playerIds query parameter is required');
    return;
  }

  const playerIdsArray = playerIds.split(',');
  const cacheKey = `currentSeason_${playerIds}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    sendResponse(res, cache[cacheKey].data, 'hit');
    return;
  }

  try {
    const batchSize = 30;
    const playerData = {};

    for (let i = 0; i < playerIdsArray.length; i += batchSize) {
      const batch = playerIdsArray.slice(i, i + batchSize);
      const snapshot = await db.collection(CURRENT_SEASON_COLLECTION)
        .where(admin.firestore.FieldPath.documentId(), 'in', batch)
        .get();

      snapshot.forEach(doc => {
        playerData[doc.id] = doc.data();
      });
    }

    cache[cacheKey] = { data: playerData, timestamp: Date.now() };
    sendResponse(res, playerData, 'miss');

  } catch (error) {
    console.error('Error fetching current season stats from Firestore:', error);
    res.status(500).send('Error fetching current season stats');
  }
}

// --- Logic for assigning a sidebet to a matchup ---
async function handleMatchupSidebetAssignment(req, res) {
  try {
    const { week, gm1, gm2, sidebetId } = req.body;

    if (!week || !gm1 || !gm2) {
      res.status(400).send('week, gm1, and gm2 are required');
      return;
    }

    const matchupQuery = await db.collection('matchups')
      .where('week', '==', Number(week))
      .where('gm1', '==', gm1)
      .where('gm2', '==', gm2)
      .limit(1)
      .get();

    if (matchupQuery.empty) {
      res.status(404).send('Matchup not found');
      return;
    }

    const matchupDoc = matchupQuery.docs[0];

    const updateData = sidebetId
      ? { assignedSidebetId: sidebetId }
      : { assignedSidebetId: admin.firestore.FieldValue.delete() };

    await matchupDoc.ref.update(updateData);

    res.status(200).send({
      success: true,
      message: sidebetId ? 'Sidebet assigned to matchup' : 'Sidebet removed from matchup'
    });

  } catch (error) {
    console.error('Error assigning sidebet to matchup:', error);
    res.status(500).send('Error assigning sidebet');
  }
}

// --- Handle Gemini chat requests ---
async function handleChatRequest(req, res) {
  const { message, history, tradeContext, snarkLevel } = req.body;

  const toneRules = snarkLevel === 'max'
    ? `Be brutally short — 1 to 2 sentences maximum. Identify the GM who lost the trade and roast them mercilessly. Be mean, judgemental, and dismissive. If you think it was fair, pick one GM at random and insult them anyway. No mercy, no balance, no positivity.`
    : snarkLevel === 'medium'
    ? `Keep responses to 3-4 sentences. Add a few playful jabs or light digs at the GM who got the worse end of the deal. Be witty and a little mean but still informative.`
    : `Keep responses short and concise — no more than 2-3 sentences. Format the response as analysis with multiple lines. Don't put everything in one large paragraph.`;

  const systemPrompt = `You are a fantasy hockey trade analyzer.
League Scoring - Skaters: G=3, A=2, +/-=1, PIM=0.25, PPP=+1, SHP=+1, GWG=+1.5
League Scoring - Goalies: W=3, GA=-1.5, SV=0.2, SO=6

${toneRules}
Never show point calculations or math breakdowns in your response.
If a trade being analyzed includes "Mike" always include an asterisk next to one of the players Mike traded and include a footnote fact about that player at the end of the body text. The asterisk should appear next to the player Mike traded.
When analyzing trades, consider where a GM was in the standings. If a GM was low in the standings, consider that they wanted picks more, which means if they got high picks that's good for them, however GMs in the playoffs wanted players that get points. GMs higher in the standings often did better if the players they're trading away would get them more points. These were the standings, 1st-Andy, 2nd-Bimm, 3rd-Colin, 4th-Ryan, 5th-Mike, 6th-Adam, 7th-Hordo, 8th-Dan, 9th-Dave, 10th-Jordan, 11th-Charlie, 12-Marinos, 13th-Seedo, 14th-Trevor. Anyone 1st to 5th was looking to improve their team and they should have been improving their team with fantasy points. 6th through 8th were in the playoffs as well and maybe should have gone for it but decided to trade for picks anyway. 9th through 14th should have been going for good RFAs or for picks. Use this is your analysis of how good the trade was. If someone made a trade that seems like they were throwing away their trade was (ie. they were higher than 8th) remember that they may not have been going for it. 6th 7th and 8th place GMs weren't really going for it and traded away assets. Consider that in your analysis and don't be as mean if those GMs traded away assets for picks.
IMPORTANT: Base your entire analysis on the totalFP and fpPerGame values provided in the trade context JSON. These are the ground truth for each player's fantasy production this season. Do not use your own knowledge or assumptions about player value — the numbers provided are authoritative. If a player has a higher fpPerGame in the trade context, treat them as the better fantasy performer regardless of their real-world reputation. Don't mention the same type of insult every time. Use a lot of different kinds. Remember that a 1st round pick is worth a player that if worth 3 fpPerGame, a 2nd round pick is worth about 2.5 fpPerGame and a 3rd is worth about 2.0 fpPerGame. After that it's a bit open. Remember that GMs lower in the standings might value picks even more than that. Never explicitly say "fpPerGame" or "totalFP" in your responses. Use "FP/G" and "Total FP" respectively.
In the trade JSON, each team's "gives" field lists what that GM sent away (gave up). The other GM received those assets. A GM who gave up high-value assets (high fpPerGame) and received low-value assets got the worse end of the deal.

${tradeContext ? 'Trade Context:\n' + JSON.stringify(tradeContext, null, 2) : ''}`;

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
    },
    history: history || [],
  });

  const response = await chat.sendMessage({ message });
  res.status(200).send({ reply: response.text });
}

// --- Logic for handling sidebet submissions ---
async function handleSidebetSubmission(req, res) {
  try {
    const { suggestion, submittedBy, targetMatchup } = req.body;

    if (!suggestion || !submittedBy) {
      res.status(400).send('Suggestion and submittedBy fields are required');
      return;
    }

    const sidebetData = {
      suggestion: suggestion.trim(),
      submittedBy: submittedBy.trim(),
      targetMatchup: targetMatchup || null,
      submittedAt: admin.firestore.Timestamp.now(),
      isFulfilled: false
    };

    const docRef = await db.collection('sidebets').add(sidebetData);

    res.status(201).send({
      success: true,
      message: 'Sidebet suggestion submitted successfully',
      id: docRef.id
    });

  } catch (error) {
    console.error('Error submitting sidebet:', error);
    res.status(500).send('Error submitting sidebet suggestion');
  }
}

// --- Logic for fetching sidebets ---
async function handleSidebetRequest(res) {
  try {
    const snapshot = await db.collection('sidebets')
      .orderBy('submittedAt', 'desc')
      .get();

    const sidebets = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      sidebets.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt.toDate().toISOString()
      });
    });

    sendResponse(res, sidebets, 'miss');

  } catch (error) {
    console.error('Error fetching sidebets:', error);
    res.status(500).send('Error fetching sidebets');
  }
}

// --- Logic for updating a sidebet (toggle fulfilled status) ---
async function handleSidebetUpdate(req, res) {
  try {
    const { sidebetId, isFulfilled } = req.body;

    if (!sidebetId) {
      res.status(400).send('sidebetId is required');
      return;
    }

    await db.collection('sidebets').doc(sidebetId).update({
      isFulfilled: isFulfilled === true,
      fulfilledAt: isFulfilled ? admin.firestore.Timestamp.now() : admin.firestore.FieldValue.delete()
    });

    res.status(200).send({
      success: true,
      message: 'Sidebet updated successfully'
    });

  } catch (error) {
    console.error('Error updating sidebet:', error);
    res.status(500).send('Error updating sidebet');
  }
}

// --- Logic for fetching Season Totals ---
async function handleSeasonTotalsRequest(res, playerIds, season) {
  if (!playerIds || !season) {
    res.status(400).send('playerIds and season query parameters are required for seasonTotals.');
    return;
  }

  const playerIdsArray = playerIds.split(',');
  const cacheKey = `seasonTotals_${playerIds}_${season}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    sendResponse(res, cache[cacheKey].data, 'hit');
    return;
  }

  try {
    const snapshot = await db.collection('player-stats')
      .where(admin.firestore.FieldPath.documentId(), 'in', playerIdsArray)
      .get();

    const playerData = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const seasonData = data.seasons?.[season];
      if (seasonData) {
        playerData[doc.id] = seasonData;
      }
    });

    cache[cacheKey] = { data: playerData, timestamp: Date.now() };
    sendResponse(res, playerData, 'miss');

  } catch (error) {
    console.error('Error fetching season totals from Firestore:', error);
    res.status(500).send('Error fetching season totals');
  }
}

// --- Logic for fetching Game Logs ---
// Proxies directly to the NHL API since game logs are not stored in Firestore.
async function handleGameLogRequest(res, playerIds, season) {
  if (!playerIds || !season) {
    res.status(400).send('playerIds and season query parameters are required for gameLog.');
    return;
  }

  const playerId = playerIds.split(',')[0];
  const cacheKey = `gameLog_${playerId}_${season}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    sendResponse(res, cache[cacheKey].data, 'hit');
    return;
  }

  try {
    const nhlUrl = `https://api-web.nhle.com/v1/player/${playerId}/game-log/${season}/2`;
    const nhlResponse = await fetch(nhlUrl);

    if (!nhlResponse.ok) {
      console.error(`NHL API error for game log, player ${playerId}: ${nhlResponse.status}`);
      res.status(502).send('Failed to fetch game log from NHL API');
      return;
    }

    const data = await nhlResponse.json();
    const responseData = { gameLog: data.gameLog || [] };

    cache[cacheKey] = { data: responseData, timestamp: Date.now() };
    sendResponse(res, responseData, 'miss');

  } catch (error) {
    console.error('Error fetching game log from NHL API:', error);
    res.status(500).send('Error fetching game log');
  }
}

// --- Logic for fetching Team Schedule ---
// Returns regular-season game dates for a given team and season.
async function handleTeamScheduleRequest(res, teamAbbrev, season) {
  if (!teamAbbrev || !season) {
    res.status(400).send('teamAbbrev and season are required for teamSchedule.');
    return;
  }

  const cacheKey = `teamSchedule_${teamAbbrev}_${season}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    sendResponse(res, cache[cacheKey].data, 'hit');
    return;
  }

  try {
    const nhlUrl = `https://api-web.nhle.com/v1/club-schedule-season/${teamAbbrev}/${season}`;
    const nhlResponse = await fetch(nhlUrl);

    if (!nhlResponse.ok) {
      console.error(`NHL API error for team schedule ${teamAbbrev}: ${nhlResponse.status}`);
      res.status(502).send('Failed to fetch team schedule from NHL API');
      return;
    }

    const data = await nhlResponse.json();
    const gameDates = (data.games || [])
      .filter(g => g.gameType === 2)
      .map(g => g.gameDate);

    const responseData = { gameDates };
    cache[cacheKey] = { data: responseData, timestamp: Date.now() };
    sendResponse(res, responseData, 'miss');

  } catch (error) {
    console.error('Error fetching team schedule from NHL API:', error);
    res.status(500).send('Error fetching team schedule');
  }
}

// --- Logic for fetching Player Info (name + position) from NHL API ---
async function handlePlayerInfoRequest(res, playerIds) {
  if (!playerIds) {
    res.status(400).send('playerIds query parameter is required for playerInfo.');
    return;
  }

  const playerIdsArray = playerIds.split(',');
  const cacheKey = `playerInfo_${playerIds}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    sendResponse(res, cache[cacheKey].data, 'hit');
    return;
  }

  const result = {};
  await Promise.all(playerIdsArray.map(async (id) => {
    try {
      const nhlRes = await fetch(`https://api-web.nhle.com/v1/player/${id}/landing`);
      if (!nhlRes.ok) return;
      const data = await nhlRes.json();
      if (data && data.firstName) {
        result[id] = {
          name: `${data.firstName?.default || ''} ${data.lastName?.default || ''}`.trim(),
          position: data.position || '?'
        };
      }
    } catch (e) {
      console.warn(`Could not fetch player info for ${id}:`, e.message);
    }
  }));

  cache[cacheKey] = { data: result, timestamp: Date.now() };
  sendResponse(res, result, 'miss');
}

// --- Logic for fetching Player Names ---
async function handlePlayerNameRequest(res, playerIds) {
  if (!playerIds) {
    res.status(400).send('playerIds query parameter is required for playerName.');
    return;
  }

  const playerIdsArray = playerIds.split(',');
  const cacheKey = `playerName_${playerIds}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    sendResponse(res, cache[cacheKey].data, 'hit');
    return;
  }

  try {
    const snapshot = await db.collection('player-stats')
      .where(admin.firestore.FieldPath.documentId(), 'in', playerIdsArray)
      .get();

    const playerNames = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fullName) {
        playerNames[doc.id] = data.fullName;
      }
    });

    cache[cacheKey] = { data: playerNames, timestamp: Date.now() };
    sendResponse(res, playerNames, 'miss');

  } catch (error) {
    console.error('Error fetching player names from Firestore:', error);
    res.status(500).send('Error fetching player names');
  }
}

// --- Logic for fetching Player Positions ---
async function handlePlayerPositionRequest(res, playerIds) {
  if (!playerIds) {
    res.status(400).send('playerIds query parameter is required for playerPosition.');
    return;
  }

  const playerIdsArray = playerIds.split(',');
  const cacheKey = `playerPosition_${playerIds}`;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
    sendResponse(res, cache[cacheKey].data, 'hit');
    return;
  }

  try {
    const snapshot = await db.collection('player-stats')
      .where(admin.firestore.FieldPath.documentId(), 'in', playerIdsArray)
      .get();

    const playerPositions = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.primaryPosition) {
        playerPositions[doc.id] = data.primaryPosition;
      }
    });

    cache[cacheKey] = { data: playerPositions, timestamp: Date.now() };
    sendResponse(res, playerPositions, 'miss');

  } catch (error) {
    console.error('Error fetching player positions from Firestore:', error);
    res.status(500).send('Error fetching player positions');
  }
}

// --- HTTP server for Cloud Run ---
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Parse query params
  req.query = Object.fromEntries(url.searchParams);

  // Parse JSON body for POST/PUT
  if (req.method === 'POST' || req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { req.body = JSON.parse(body); } catch { req.body = {}; }
      // Add Express-like helpers
      res.set = (key, value) => res.setHeader(key, value);
      res.status = (code) => { res.statusCode = code; return res; };
      res.send = (data) => {
        if (typeof data === 'object') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } else {
          res.end(data);
        }
      };
      getNhlPlayerStats(req, res);
    });
  } else {
    // Add Express-like helpers
    res.set = (key, value) => res.setHeader(key, value);
    res.status = (code) => { res.statusCode = code; return res; };
    res.send = (data) => {
      if (typeof data === 'object') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      } else {
        res.end(data);
      }
    };
    getNhlPlayerStats(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
