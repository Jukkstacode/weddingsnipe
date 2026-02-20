// calculate-standings.js
// This script calculates league standings from matchup results in Firestore
// Run with: node calculate-standings.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';

// ============================================
// INITIALIZE FIREBASE
// ============================================

console.log('🔧 Initializing Firebase Admin SDK...');

try {
    // Check if Firebase is already initialized
    if (!admin.apps.length) {
        const serviceAccount = require(SERVICE_ACCOUNT_PATH);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        console.log('ℹ️  Firebase already initialized, using existing app');
    }
    
    console.log('✅ Firebase initialized successfully\n');
} catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    console.error('\n💡 Make sure service-account-key.json is in your project root');
    process.exit(1);
}

const db = admin.firestore();

// ============================================
// CALCULATE STANDINGS
// ============================================

async function calculateStandings() {
    console.log('📊 Calculating league standings from matchup results...\n');
    
    try {
        // Get all completed matchups
        const snapshot = await db.collection('matchups')
            .where('isComplete', '==', true)
            .get();
        
        if (snapshot.empty) {
            console.log('⚠️  No completed matchups found');
            return;
        }
        
        console.log(`✅ Found ${snapshot.size} completed matchups\n`);
        
        // Initialize standings object
        const standings = {};
        
        // Process each completed matchup
        snapshot.forEach(doc => {
            const data = doc.data();
            const gm1 = data.gm1;
            const gm2 = data.gm2;
            const score1 = data.score1;
            const score2 = data.score2;
            const winner = data.winner;
            
            // Initialize GMs if they don't exist
            if (!standings[gm1]) {
                standings[gm1] = { wins: 0, losses: 0, points: 0 };
            }
            if (!standings[gm2]) {
                standings[gm2] = { wins: 0, losses: 0, points: 0 };
            }
            
            // Add points
            standings[gm1].points += score1;
            standings[gm2].points += score2;
            
            // Add win/loss
            if (winner === gm1) {
                standings[gm1].wins += 1;
                standings[gm2].losses += 1;
            } else {
                standings[gm2].wins += 1;
                standings[gm1].losses += 1;
            }
        });
        
        // Save standings to Firestore
        console.log('💾 Saving standings to Firestore...\n');
        
        const batch = db.batch();
        
        for (const [gmName, record] of Object.entries(standings)) {
            const docRef = db.collection('standings').doc(gmName);
            batch.set(docRef, {
                gm: gmName,
                wins: record.wins,
                losses: record.losses,
                points: Math.round(record.points * 100) / 100, // Round to 2 decimals
                lastUpdated: admin.firestore.Timestamp.now()
            });
            
            console.log(`  📈 ${gmName}: ${record.wins}-${record.losses} (${Math.round(record.points * 100) / 100} pts)`);
        }
        
        await batch.commit();
        
        console.log('\n🎉 SUCCESS! Standings saved to Firestore!\n');
        
    } catch (error) {
        console.error('❌ Error calculating standings:', error);
        process.exit(1);
    }
}

// ============================================
// RUN THE SCRIPT
// ============================================

(async () => {
    await calculateStandings();
    console.log('👋 All done!\n');
    process.exit(0);
})();