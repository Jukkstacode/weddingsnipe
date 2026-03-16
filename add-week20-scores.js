// add-week20-scores.js
// This script adds Week 20 scores to the matchups in Firestore
// Run with: node add-week20-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 20 scores from screenshot
const week20Scores = [
  // Matchup 0: Killin me Scheifle vs Saltiest Spring
  { gm1: "Bimm", gm2: "Seedo", score1: 71.30, score2: 49.80 },

  // Matchup 1: Birth2Girth vs Medium Chuck
  { gm1: "Andy", gm2: "Charlie", score1: 137.70, score2: 86.90 },

  // Matchup 2: Tiny Muscles Big Hustle vs Shit The Driveway
  { gm1: "Dave", gm2: "Mike", score1: 62.70, score2: 93.80 },

  // Matchup 3: The Real West Coast Chat vs Travis Fan Club
  { gm1: "Colin", gm2: "Hordo", score1: 101.90, score2: 70.00 },

  // Matchup 4: Monkey Butt vs It's Jibbers!
  { gm1: "Ryan", gm2: "Jordan", score1: 62.15, score2: 110.30 },

  // Matchup 5: Mack Miller vs Willy Stylez
  { gm1: "Dan", gm2: "Trevor", score1: 99.70, score2: 77.45 },

  // Matchup 6: Murricle on Ice vs SpudKick
  { gm1: "Marinos", gm2: "Adam", score1: 110.50, score2: 69.35 }
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

async function addWeek20Scores() {
    console.log('🏒 Adding Week 20 scores to Firestore...\n');

    try {
        const batch = db.batch();
        let updateCount = 0;

        for (let i = 0; i < week20Scores.length; i++) {
            const matchup = week20Scores[i];
            const docId = `week-20-matchup-${i}`;

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

        console.log('\n🎉 SUCCESS! Week 20 scores added!');
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
    await addWeek20Scores();
    process.exit(0);
})();
