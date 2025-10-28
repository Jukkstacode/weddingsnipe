// add-week3-scores.js
// This script adds Week 3 scores to the matchups in Firestore
// Run with: node add-week3-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 3 scores from the screenshot
// Matchup order matches the schedule (index 0-6)
const week3Scores = [
  // Matchup 0: Killin me Scheifle vs Travis Fan Club
  { gm1: "Bimm", gm2: "Hordo", score1: 124.80, score2: 109.00 },
  
  // Matchup 1: Birth2Girth vs Shit The Driveway
  { gm1: "Andy", gm2: "Mike", score1: 117.60, score2: 96.25 },
  
  // Matchup 2: Tiny Muscles Big Hustle vs Saltiest Spring
  { gm1: "Dave", gm2: "Seedo", score1: 174.90, score2: 97.15 },
  
  // Matchup 3: The Real West Coast Chat vs SpudKick
  { gm1: "Colin", gm2: "Adam", score1: 86.45, score2: 113.40 },
  
  // Matchup 4: Medium Chuck vs Willy Stylez
  { gm1: "Charlie", gm2: "Trevor", score1: 160.90, score2: 95.00 },
  
  // Matchup 5: Monkey Butt vs Murricle on Ice
  { gm1: "Ryan", gm2: "Marinos", score1: 116.60, score2: 100.00 },
  
  // Matchup 6: Mack Miller vs It's Jibbers!
  { gm1: "Dan", gm2: "Jordan", score1: 101.80, score2: 94.40 }
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

async function addWeek3Scores() {
    console.log('🏒 Adding Week 3 scores to Firestore...\n');
    
    try {
        const batch = db.batch();
        let updateCount = 0;
        
        // Process each matchup
        for (let i = 0; i < week3Scores.length; i++) {
            const matchup = week3Scores[i];
            const docId = `week-3-matchup-${i}`;
            
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
        
        console.log('\n🎉 SUCCESS! Week 3 scores added!');
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
        for (let i = 0; i < week3Scores.length; i++) {
            const docId = `week-3-matchup-${i}`;
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
    await addWeek3Scores();
    await verifyUpdates();
    
    console.log('👋 All done! Week 3 scores are now in Firestore.\n');
    console.log('💡 Run "node calculate-standings.js" to update the league standings.\n');
    process.exit(0);
})();