// add-week18-scores.js
// This script adds Week 18 scores to the matchups in Firestore
// Run with: node add-week18-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 18 scores from screenshot
const week18Scores = [
  // Matchup 0: Killin me Scheifle vs Tiny Muscles Big Hustle
  { gm1: "Bimm", gm2: "Dave", score1: 170.40, score2: 165.20 },

  // Matchup 1: Birth2Girth vs The Real West Coast Chat
  { gm1: "Andy", gm2: "Colin", score1: 194.25, score2: 120.75 },

  // Matchup 2: Medium Chuck vs SpudKick
  { gm1: "Charlie", gm2: "Adam", score1: 152.85, score2: 155.70 },

  // Matchup 3: Monkey Butt vs Mack Miller
  { gm1: "Ryan", gm2: "Dan", score1: 189.10, score2: 157.10 },

  // Matchup 4: Saltiest Spring vs It's Jibbers!
  { gm1: "Seedo", gm2: "Jordan", score1: 96.30, score2: 211.70 },

  // Matchup 5: Murricle on Ice vs Willy Stylez
  { gm1: "Marinos", gm2: "Trevor", score1: 116.20, score2: 157.00 },

  // Matchup 6: Travis Fan Club vs Shit The Driveway
  { gm1: "Hordo", gm2: "Mike", score1: 182.20, score2: 154.50 }
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

async function addWeek18Scores() {
    console.log('🏒 Adding Week 18 scores to Firestore...\n');

    try {
        const batch = db.batch();
        let updateCount = 0;

        for (let i = 0; i < week18Scores.length; i++) {
            const matchup = week18Scores[i];
            const docId = `week-18-matchup-${i}`;

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

        console.log('\n🎉 SUCCESS! Week 18 scores added!');
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
    await addWeek18Scores();
    process.exit(0);
})();
