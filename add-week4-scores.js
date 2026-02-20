// add-week4-scores.js
// This script adds Week 4 scores to the matchups in Firestore
// Run with: node add-week4-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 4 scores from the screenshot
// Matchup order matches the schedule (index 0-6)
const week4Scores = [
  // Matchup 0: Killin me Scheifle vs Murricle on Ice
  { gm1: "Bimm", gm2: "Marinos", score1: 97.80, score2: 96.20 },
  
  // Matchup 1: Birth2Girth vs SpudKick
  { gm1: "Andy", gm2: "Adam", score1: 84.40, score2: 68.10 },
  
  // Matchup 2: Tiny Muscles Big Hustle vs Monkey Butt
  { gm1: "Dave", gm2: "Ryan", score1: 79.40, score2: 35.50 },
  
  // Matchup 3: The Real West Coast Chat vs It's Jibbers!
  { gm1: "Colin", gm2: "Jordan", score1: 75.25, score2: 98.10 },
  
  // Matchup 4: Medium Chuck vs Shit The Driveway
  { gm1: "Charlie", gm2: "Mike", score1: 134.20, score2: 131.40 },
  
  // Matchup 5: Saltiest Spring vs Mack Miller (SIDEBET MATCHUP)
  { gm1: "Seedo", gm2: "Dan", score1: 105.10, score2: 130.50 },
  
  // Matchup 6: Willy Stylez vs Travis Fan Club
  { gm1: "Trevor", gm2: "Hordo", score1: 72.70, score2: 74.90 }
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

async function addWeek4Scores() {
    console.log('🏒 Adding Week 4 scores to Firestore...\n');
    
    try {
        const batch = db.batch();
        let updateCount = 0;
        
        // Process each matchup
        for (let i = 0; i < week4Scores.length; i++) {
            const matchup = week4Scores[i];
            const docId = `week-4-matchup-${i}`;
            
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
        
        console.log('\n🎉 SUCCESS! Week 4 scores added!');
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
        for (let i = 0; i < week4Scores.length; i++) {
            const docId = `week-4-matchup-${i}`;
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
    await addWeek4Scores();
    await verifyUpdates();
    
    console.log('👋 All done! Week 4 scores are now in Firestore.\n');
    process.exit(0);
})();