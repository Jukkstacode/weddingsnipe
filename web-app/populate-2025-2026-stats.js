// populate-2025-2026-stats.js
// Run this script once to populate the player-stats-2025-2026 collection
// Usage: node populate-2025-2026-stats.js
//
// Before running, ensure you have:
// 1. Your service account key JSON file (service-account-key.json)
// 2. npm install firebase-admin node-fetch

const admin = require('firebase-admin');
const fetch = require('node-fetch');
const fs = require('fs');

// Path to your service account key
const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const CURRENT_SEASON = '20252026';
const COLLECTION_NAME = 'player-stats-2025-2026';

// Initialize Firebase
console.log('🔧 Initializing Firebase Admin SDK...');
try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase initialized successfully\n');
} catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    console.error('\n💡 Make sure you have your service account key file.');
    process.exit(1);
}

const db = admin.firestore();

// Fetch player stats from NHL API
async function fetchPlayerStatsFromNHL(playerId) {
    try {
        const url = `https://api-web.nhle.com/v1/player/${playerId}/landing`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`  ⚠️ NHL API returned ${response.status} for player ${playerId}`);
            return null;
        }
        
        const data = await response.json();
        
        // Extract current season stats
        let currentSeasonStats = null;
        
        if (data.featuredStats?.regularSeason?.subSeason) {
            const subSeason = data.featuredStats.regularSeason.subSeason;
            currentSeasonStats = {
                season: CURRENT_SEASON,
                gamesPlayed: subSeason.gamesPlayed || 0,
                // Skater stats
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
                // Goalie stats
                wins: subSeason.wins || 0,
                losses: subSeason.losses || 0,
                otLosses: subSeason.otLosses || 0,
                goalsAgainst: subSeason.goalsAgainst || 0,
                goalsAgainstAverage: subSeason.goalsAgainstAverage || subSeason.goalsAgainstAvg || 0,
                savePctg: subSeason.savePctg || subSeason.savePercentage || 0,
                shotsAgainst: subSeason.shotsAgainst || 0,
                shutouts: subSeason.shutouts || 0,
                // Player info
                position: data.position || null,
                fullName: `${data.firstName?.default || ''} ${data.lastName?.default || ''}`.trim(),
                teamAbbrev: data.currentTeamAbbrev || null,
                lastUpdated: new Date().toISOString()
            };
        }
        
        return currentSeasonStats;
    } catch (error) {
        console.error(`  ❌ Error fetching NHL stats for player ${playerId}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('📊 Starting 2025-2026 stats population...\n');
    
    // Get all player IDs from the existing player-stats collection
    console.log('📖 Reading existing player IDs from player-stats collection...');
    const existingSnapshot = await db.collection('player-stats').get();
    const playerIds = existingSnapshot.docs.map(doc => doc.id);
    console.log(`✅ Found ${playerIds.length} players\n`);
    
    // Alternatively, you can read from contracts.json if available
    // const contracts = JSON.parse(fs.readFileSync('./contracts.json', 'utf8'));
    // const playerIds = contracts.map(c => c.nhlId).filter(id => id);
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log('🚀 Fetching stats from NHL API and saving to Firestore...\n');
    
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        process.stdout.write(`  [${i + 1}/${playerIds.length}] Player ${playerId}... `);
        
        const stats = await fetchPlayerStatsFromNHL(playerId);
        
        if (stats) {
            await db.collection(COLLECTION_NAME).doc(playerId).set(stats);
            console.log(`✅ ${stats.fullName} (${stats.gamesPlayed} GP)`);
            successCount++;
        } else {
            console.log('⚠️ No stats available');
            errorCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    console.log('\n========================================');
    console.log(`✅ Successfully updated: ${successCount} players`);
    console.log(`⚠️ Skipped/errors: ${errorCount} players`);
    console.log('========================================\n');
    
    console.log('🎉 Done! The player-stats-2025-2026 collection is now populated.');
    process.exit(0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});