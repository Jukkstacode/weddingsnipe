// add-week19-scores.js
// This script adds Week 19 scores to the matchups in Firestore
// Run with: node add-week19-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 19 scores from screenshot
const week19Scores = [
  // Matchup 0: Killin me Scheifle vs Mack Miller
  { gm1: "Bimm", gm2: "Dan", score1: 164.35, score2: 121.45 },

  // Matchup 1: Birth2Girth vs It's Jibbers!
  { gm1: "Andy", gm2: "Jordan", score1: 170.40, score2: 140.00 },

  // Matchup 2: Tiny Muscles Big Hustle vs Willy Stylez
  { gm1: "Dave", gm2: "Trevor", score1: 135.60, score2: 90.10 },

  // Matchup 3: The Real West Coast Chat vs Medium Chuck
  { gm1: "Colin", gm2: "Charlie", score1: 133.90, score2: 109.70 },

  // Matchup 4: Monkey Butt vs Saltiest Spring
  { gm1: "Ryan", gm2: "Seedo", score1: 127.65, score2: 89.55 },

  // Matchup 5: Murricle on Ice vs Shit The Driveway
  { gm1: "Marinos", gm2: "Mike", score1: 85.00, score2: 149.80 },

  // Matchup 6: Travis Fan Club vs SpudKick
  { gm1: "Hordo", gm2: "Adam", score1: 84.90, score2: 121.70 }
];

// ============================================
// INITIALIZE FIREBASE
// ============================================

console.log('🔧 Initializing Firebase Admin SDK...');

try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase initialized successfully\n');
} catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    console.error('\n💡 Make sure you have your service account key file');
    process.exit(1);
}

const db = admin.firestore();

// ============================================
// ADD SCORES TO FIRESTORE
// ============================================

async function addWeek19Scores() {
    console.log('🏒 Adding Week 19 scores to Firestore...\n');

    try {
        const batch = db.batch();
        let updateCount = 0;

        for (let i = 0; i < week19Scores.length; i++) {
            const matchup = week19Scores[i];
            const docId = `week-19-matchup-${i}`;

            console.log(`  📊 Matchup ${i}: ${matchup.gm1} vs ${matchup.gm2}`);
            console.log(`     Score: ${matchup.score1} - ${matchup.score2}`);

            const winner = matchup.score1 > matchup.score2 ? matchup.gm1 : matchup.gm2;
            console.log(`     Winner: ${winner} 🏆`);

            const docRef = db.collection(COLLECTION_NAME).doc(docId);
            batch.update(docRef, {
                score1: matchup.score1,
                score2: matchup.score2,
                winner: winner,
                isComplete: true,
                completedAt: admin.firestore.Timestamp.now()
            });

            updateCount++;
            console.log(`     ✅ Queued for update\n`);
        }

        console.log('💾 Committing changes to Firestore...');
        await batch.commit();

        console.log('\n🎉 SUCCESS! Week 19 scores added!');
        console.log(`📊 Updated ${updateCount} matchups\n`);

    } catch (error) {
        console.error('❌ Error adding scores:', error);
        process.exit(1);
    }
}

// ============================================
// RUN
// ============================================

(async () => {
    await addWeek19Scores();
    process.exit(0);
})();
