// add-weeks-6-to-9-scores.js
// This script adds Week 6, 7, 8, and 9 scores to the matchups in Firestore
// Run with: node add-weeks-6-to-9-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// ============================================
// WEEK 6 SCORES
// ============================================
// Schedule: Bimm vs Dan, Andy vs Jordan, Dave vs Trevor, Colin vs Charlie, 
//           Ryan vs Seedo, Marinos vs Mike, Hordo vs Adam (isSpecial)

const week6Scores = [
  // Matchup 0: Killin me Scheifle vs Mack Miller
  { gm1: "Bimm", gm2: "Dan", score1: 89.20, score2: 76.55 },
  
  // Matchup 1: Birth2Girth vs It's Jibbers!
  { gm1: "Andy", gm2: "Jordan", score1: 98.60, score2: 159.75 },
  
  // Matchup 2: Tiny Muscles Big Hustle vs Willy Stylez
  { gm1: "Dave", gm2: "Trevor", score1: 104.00, score2: 88.00 },
  
  // Matchup 3: The Real West Coast Chat vs Medium Chuck
  { gm1: "Colin", gm2: "Charlie", score1: 129.90, score2: 86.50 },
  
  // Matchup 4: Monkey Butt vs Saltiest Spring
  { gm1: "Ryan", gm2: "Seedo", score1: 90.20, score2: 29.90 },
  
  // Matchup 5: Murricle on Ice vs Shit The Driveway
  { gm1: "Marinos", gm2: "Mike", score1: 125.70, score2: 137.60 },
  
  // Matchup 6: Travis Fan Club vs SpudKick (SIDEBET MATCHUP)
  { gm1: "Hordo", gm2: "Adam", score1: 81.20, score2: 76.60 }
];

// ============================================
// WEEK 7 SCORES
// ============================================
// Schedule: Bimm vs Seedo, Andy vs Charlie, Dave vs Mike, Colin vs Hordo,
//           Ryan vs Jordan, Dan vs Trevor, Marinos vs Adam

const week7Scores = [
  // Matchup 0: Killin me Scheifle vs Saltiest Spring
  { gm1: "Bimm", gm2: "Seedo", score1: 102.50, score2: 47.70 },
  
  // Matchup 1: Birth2Girth vs Medium Chuck
  { gm1: "Andy", gm2: "Charlie", score1: 129.80, score2: 120.30 },
  
  // Matchup 2: Tiny Muscles Big Hustle vs Shit The Driveway
  { gm1: "Dave", gm2: "Mike", score1: 89.90, score2: 127.85 },
  
  // Matchup 3: The Real West Coast Chat vs Travis Fan Club
  { gm1: "Colin", gm2: "Hordo", score1: 119.65, score2: 129.00 },
  
  // Matchup 4: Monkey Butt vs It's Jibbers!
  { gm1: "Ryan", gm2: "Jordan", score1: 108.60, score2: 97.50 },
  
  // Matchup 5: Mack Miller vs Willy Stylez
  { gm1: "Dan", gm2: "Trevor", score1: 111.70, score2: 101.70 },
  
  // Matchup 6: Murricle on Ice vs SpudKick
  { gm1: "Marinos", gm2: "Adam", score1: 65.30, score2: 83.50 }
];

// ============================================
// WEEK 8 SCORES
// ============================================
// Schedule: Bimm vs Ryan, Andy vs Hordo, Dave vs Adam, Colin vs Marinos,
//           Charlie vs Jordan, Seedo vs Trevor, Dan vs Mike

const week8Scores = [
  // Matchup 0: Killin me Scheifle vs Monkey Butt
  { gm1: "Bimm", gm2: "Ryan", score1: 72.85, score2: 108.30 },
  
  // Matchup 1: Birth2Girth vs Travis Fan Club
  { gm1: "Andy", gm2: "Hordo", score1: 127.80, score2: 112.50 },
  
  // Matchup 2: Tiny Muscles Big Hustle vs SpudKick
  { gm1: "Dave", gm2: "Adam", score1: 94.30, score2: 145.20 },
  
  // Matchup 3: The Real West Coast Chat vs Murricle on Ice
  { gm1: "Colin", gm2: "Marinos", score1: 144.30, score2: 88.85 },
  
  // Matchup 4: Medium Chuck vs It's Jibbers!
  { gm1: "Charlie", gm2: "Jordan", score1: 98.25, score2: 133.90 },
  
  // Matchup 5: Saltiest Spring vs Willy Stylez
  { gm1: "Seedo", gm2: "Trevor", score1: 112.40, score2: 61.00 },
  
  // Matchup 6: Mack Miller vs Shit The Driveway
  { gm1: "Dan", gm2: "Mike", score1: 108.50, score2: 155.10 }
];

// ============================================
// WEEK 9 SCORES
// ============================================
// Schedule: Bimm vs Jordan, Andy vs Marinos, Dave vs Colin, Charlie vs Hordo,
//           Ryan vs Trevor, Seedo vs Mike, Dan vs Adam

const week9Scores = [
  // Matchup 0: Killin me Scheifle vs It's Jibbers!
  { gm1: "Bimm", gm2: "Jordan", score1: 127.35, score2: 112.25 },
  
  // Matchup 1: Birth2Girth vs Murricle on Ice
  { gm1: "Andy", gm2: "Marinos", score1: 121.50, score2: 157.40 },
  
  // Matchup 2: Tiny Muscles Big Hustle vs The Real West Coast Chat
  { gm1: "Dave", gm2: "Colin", score1: 62.30, score2: 98.50 },
  
  // Matchup 3: Medium Chuck vs Travis Fan Club
  { gm1: "Charlie", gm2: "Hordo", score1: 126.90, score2: 71.50 },
  
  // Matchup 4: Monkey Butt vs Willy Stylez
  { gm1: "Ryan", gm2: "Trevor", score1: 129.30, score2: 108.00 },
  
  // Matchup 5: Saltiest Spring vs Shit The Driveway
  { gm1: "Seedo", gm2: "Mike", score1: 59.40, score2: 120.70 },
  
  // Matchup 6: Mack Miller vs SpudKick
  { gm1: "Dan", gm2: "Adam", score1: 103.20, score2: 110.00 }
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

async function addWeekScores(weekNumber, weekScores) {
    console.log(`🏒 Adding Week ${weekNumber} scores to Firestore...\n`);
    
    try {
        const batch = db.batch();
        let updateCount = 0;
        
        // Process each matchup
        for (let i = 0; i < weekScores.length; i++) {
            const matchup = weekScores[i];
            const docId = `week-${weekNumber}-matchup-${i}`;
            
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
        
        console.log(`\n🎉 SUCCESS! Week ${weekNumber} scores added!`);
        console.log(`📊 Updated ${updateCount} matchups\n`);
        
        return updateCount;
        
    } catch (error) {
        console.error(`❌ Error adding Week ${weekNumber} scores:`, error);
        throw error;
    }
}

// ============================================
// VERIFY THE UPDATES
// ============================================

async function verifyWeekUpdates(weekNumber, weekScores) {
    console.log(`🔍 Verifying Week ${weekNumber} updates...\n`);
    
    try {
        for (let i = 0; i < weekScores.length; i++) {
            const docId = `week-${weekNumber}-matchup-${i}`;
            const doc = await db.collection(COLLECTION_NAME).doc(docId).get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log(`  ✓ ${docId}: ${data.gm1} ${data.score1} - ${data.score2} ${data.gm2} (Winner: ${data.winner})`);
            }
        }
        
        console.log('\n');
    } catch (error) {
        console.error('❌ Error verifying:', error);
    }
}

// ============================================
// RUN THE SCRIPT
// ============================================

(async () => {
    let totalUpdated = 0;
    
    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 6 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(6, week6Scores);
    await verifyWeekUpdates(6, week6Scores);
    
    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 7 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(7, week7Scores);
    await verifyWeekUpdates(7, week7Scores);
    
    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 8 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(8, week8Scores);
    await verifyWeekUpdates(8, week8Scores);
    
    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 9 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(9, week9Scores);
    await verifyWeekUpdates(9, week9Scores);
    
    console.log('═══════════════════════════════════════════');
    console.log('           SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`\n👋 All done! Updated ${totalUpdated} total matchups across Weeks 6-9.\n`);
    
    process.exit(0);
})();