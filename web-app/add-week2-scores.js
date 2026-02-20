// add-week2-scores.js
// This script adds Week 2 scores to the matchups in Firestore
// Run with: node add-week2-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 2 scores from the screenshot
// Matchup order matches the schedule (index 0-6)
const week2Scores = [
  // Matchup 0: Killin me Scheifle vs Medium Chuck
  { gm1: "Bimm", gm2: "Charlie", score1: 153.70, score2: 77.30 },
  
  // Matchup 1: Birth2Girth vs Willy Stylez
  { gm1: "Andy", gm2: "Trevor", score1: 114.60, score2: 104.40 },
  
  // Matchup 2: Tiny Muscles Big Hustle vs Mack Miller
  { gm1: "Dave", gm2: "Dan", score1: 130.20, score2: 112.60 },
  
  // Matchup 3: The Real West Coast Chat vs Shit The Driveway
  { gm1: "Colin", gm2: "Mike", score1: 122.90, score2: 119.90 },
  
  // Matchup 4: Monkey Butt vs Travis Fan Club
  { gm1: "Ryan", gm2: "Hordo", score1: 102.70, score2: 109.00 },
  
  // Matchup 5: Saltiest Spring vs Murricle on Ice
  { gm1: "Seedo", gm2: "Marinos", score1: 58.00, score2: 83.00 },
  
  // Matchup 6: It's Jibbers! vs SpudKick
  { gm1: "Jordan", gm2: "Adam", score1: 71.90, score2: 87.50 }
];

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
// ADD SCORES TO FIRESTORE
// ============================================

async function addWeek2Scores() {
    console.log('🏒 Adding Week 2 scores to Firestore...\n');
    
    try {
        const batch = db.batch();
        let updateCount = 0;
        
        // Process each matchup
        for (let i = 0; i < week2Scores.length; i++) {
            const matchup = week2Scores[i];
            const docId = `week-2-matchup-${i}`;
            
            console.log(`  📊 Matchup ${i}: ${matchup.gm1} vs ${matchup.gm2}`);
            console.log(`     Score: ${matchup.score1} - ${matchup.score2}`);
            
            // Determine the winner
            const winner = matchup.score1 > matchup.score2 ? matchup.gm1 : matchup.gm2;
            console.log(`     Winner: ${winner} 🏆`);
            
            // Update the document with scores
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
        
        // Commit all changes
        console.log('💾 Committing changes to Firestore...');
        await batch.commit();
        
        console.log('\n🎉 SUCCESS! Week 2 scores added!');
        console.log(`📊 Updated ${updateCount} matchups\n`);
        
    } catch (error) {
        console.error('❌ Error adding scores:', error);
        process.exit(1);
    }
}

// ============================================
// VERIFY THE UPDATES
// ============================================

async function verifyUpdates() {
    console.log('🔍 Verifying updates...\n');
    
    try {
        for (let i = 0; i < week2Scores.length; i++) {
            const docId = `week-2-matchup-${i}`;
            const doc = await db.collection(COLLECTION_NAME).doc(docId).get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log(`  ✓ ${docId}: ${data.gm1} ${data.score1} - ${data.score2} ${data.gm2} (Winner: ${data.winner})`);
            }
        }
        
        console.log('\n✨ Verification complete!\n');
    } catch (error) {
        console.error('❌ Error verifying:', error);
    }
}

// ============================================
// RUN THE SCRIPT
// ============================================

(async () => {
    await addWeek2Scores();
    await verifyUpdates();
    
    console.log('👋 All done! Week 2 scores are now in Firestore.\n');
    console.log('💡 Run "node calculate-standings.js" to update the league standings.\n');
    process.exit(0);
})();