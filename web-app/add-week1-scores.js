// add-week1-scores.js
// This script adds Week 1 scores to the matchups in Firestore
// Run with: node add-week1-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// Week 1 scores from the screenshot
// Matchup order matches the schedule (index 0-6)
const week1Scores = [
  // Matchup 0: Killin me Scheifle vs Birth2Girth
  { gm1: "Bimm", gm2: "Andy", score1: 62.55, score2: 66.40 },
  
  // Matchup 1: Tiny Muscles Big Hustle vs It's Jibbers!
  { gm1: "Dave", gm2: "Jordan", score1: 92.40, score2: 109.30 },
  
  // Matchup 2: The Real West Coast Chat vs Willy Stylez
  { gm1: "Colin", gm2: "Trevor", score1: 68.00, score2: 97.10 },
  
  // Matchup 3: Medium Chuck vs Monkey Butt
  { gm1: "Charlie", gm2: "Ryan", score1: 30.30, score2: 56.20 },
  
  // Matchup 4: Saltiest Spring vs Travis Fan Club
  { gm1: "Seedo", gm2: "Hordo", score1: 60.70, score2: 68.50 },
  
  // Matchup 5: Mack Miller vs Murricle on Ice
  { gm1: "Dan", gm2: "Marinos", score1: 97.90, score2: 74.50 },
  
  // Matchup 6: SpudKick vs Shit The Driveway
  { gm1: "Adam", gm2: "Mike", score1: 61.40, score2: 60.70 }
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

async function addWeek1Scores() {
    console.log('🏒 Adding Week 1 scores to Firestore...\n');
    
    try {
        const batch = db.batch();
        let updateCount = 0;
        
        // Process each matchup
        for (let i = 0; i < week1Scores.length; i++) {
            const matchup = week1Scores[i];
            const docId = `week-1-matchup-${i}`;
            
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
        
        console.log('\n🎉 SUCCESS! Week 1 scores added!');
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
        for (let i = 0; i < week1Scores.length; i++) {
            const docId = `week-1-matchup-${i}`;
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
    await addWeek1Scores();
    await verifyUpdates();
    
    console.log('👋 All done! Week 1 scores are now in Firestore.\n');
    process.exit(0);
})();