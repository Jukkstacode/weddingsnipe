// add-week5-scores.js
// This script adds Week 5 scores to the matchups in Firestore
// Run with: node add-week5-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 5 scores from the screenshot
// Matchup order matches the schedule (index 0-6)
const week5Scores = [
  // Matchup 0: Killin me Scheifle vs Tiny Muscles Big Hustle
  { gm1: "Bimm", gm2: "Dave", score1: 74.80, score2: 79.20 },
  
  // Matchup 1: Birth2Girth vs The Real West Coast Chat
  { gm1: "Andy", gm2: "Colin", score1: 129.20, score2: 103.50 },
  
  // Matchup 2: Medium Chuck vs SpudKick
  { gm1: "Charlie", gm2: "Adam", score1: 131.80, score2: 111.40 },
  
  // Matchup 3: Monkey Butt vs Mack Miller
  { gm1: "Ryan", gm2: "Dan", score1: 96.80, score2: 124.90 },
  
  // Matchup 4: Saltiest Spring vs It's Jibbers!
  { gm1: "Seedo", gm2: "Jordan", score1: 149.75, score2: 103.00 },
  
  // Matchup 5: Murricle on Ice vs Willy Stylez
  { gm1: "Marinos", gm2: "Trevor", score1: 96.05, score2: 75.50 },
  
  // Matchup 6: Travis Fan Club vs Shit The Driveway
  { gm1: "Hordo", gm2: "Mike", score1: 74.30, score2: 172.10 }
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

async function addWeek5Scores() {
    console.log('🏒 Adding Week 5 scores to Firestore...\n');
    
    try {
        const batch = db.batch();
        let updateCount = 0;
        
        // Process each matchup
        for (let i = 0; i < week5Scores.length; i++) {
            const matchup = week5Scores[i];
            const docId = `week-5-matchup-${i}`;
            
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
        
        console.log('\n🎉 SUCCESS! Week 5 scores added!');
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
        for (let i = 0; i < week5Scores.length; i++) {
            const docId = `week-5-matchup-${i}`;
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
    await addWeek5Scores();
    await verifyUpdates();
    
    console.log('👋 All done! Week 5 scores are now in Firestore.\n');
    process.exit(0);
})();