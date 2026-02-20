// add-week10-to-17-scores.js
// This script adds Week 10 through 17 scores to the matchups in Firestore
// Run with: node add-week10-to-17-scores.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'matchups';

// ============================================
// WEEK 10 SCORES
// ============================================
// Schedule: Bimm vs Trevor, Andy vs Dave, Colin vs Dan, Charlie vs Marinos,
//           Ryan vs Mike, Seedo vs Adam, Jordan vs Hordo
//
// NOTE: Matchups 4, 5, and 6 were obscured in the screenshot by a system
// overlay. Please fill in the correct scores before running this script.

const week10Scores = [
  // Matchup 0: Killin me Scheifle vs Willy Stylez
  { gm1: "Bimm", gm2: "Trevor", score1: 143.05, score2: 104.30 },

  // Matchup 1: Birth2Girth vs Tiny Muscles Big Hustle
  { gm1: "Andy", gm2: "Dave", score1: 138.30, score2: 68.20 },

  // Matchup 2: The Real West Coast Chat vs Mack Miller
  { gm1: "Colin", gm2: "Dan", score1: 133.85, score2: 118.40 },

  // Matchup 3: Medium Chuck vs Murricle on Ice
  { gm1: "Charlie", gm2: "Marinos", score1: 132.80, score2: 92.90 },

  // Matchup 4: Monkey Butt vs Shit The Driveway
  { gm1: "Ryan", gm2: "Mike", score1: 117.40, score2: 103.00 },

  // Matchup 5: Saltiest Spring vs SpudKick
  { gm1: "Seedo", gm2: "Adam", score1: 83.20, score2: 96.90 },

  // Matchup 6: It's Jibbers! vs Travis Fan Club
  { gm1: "Jordan", gm2: "Hordo", score1: 69.80, score2: 95.00 }
];

// ============================================
// WEEK 11 SCORES
// ============================================
// Schedule: Bimm vs Mike, Andy vs Dan, Dave vs Charlie, Colin vs Seedo,
//           Ryan vs Adam, Jordan vs Trevor, Marinos vs Hordo

const week11Scores = [
  // Matchup 0: Killin me Scheifle vs Shit The Driveway
  { gm1: "Bimm", gm2: "Mike", score1: 94.65, score2: 148.40 },

  // Matchup 1: Birth2Girth vs Mack Miller
  { gm1: "Andy", gm2: "Dan", score1: 128.40, score2: 87.15 },

  // Matchup 2: Tiny Muscles Big Hustle vs Medium Chuck
  { gm1: "Dave", gm2: "Charlie", score1: 109.30, score2: 95.10 },

  // Matchup 3: The Real West Coast Chat vs Saltiest Spring
  { gm1: "Colin", gm2: "Seedo", score1: 153.10, score2: 93.50 },

  // Matchup 4: Monkey Butt vs SpudKick
  { gm1: "Ryan", gm2: "Adam", score1: 134.00, score2: 130.30 },

  // Matchup 5: It's Jibbers! vs Willy Stylez
  { gm1: "Jordan", gm2: "Trevor", score1: 116.70, score2: 123.60 },

  // Matchup 6: Murricle on Ice vs Travis Fan Club
  { gm1: "Marinos", gm2: "Hordo", score1: 92.80, score2: 112.60 }
];

// ============================================
// WEEK 12 SCORES
// ============================================
// Schedule: Bimm vs Adam, Andy vs Seedo, Dave vs Hordo, Colin vs Ryan,
//           Charlie vs Dan, Jordan vs Marinos, Trevor vs Mike

const week12Scores = [
  // Matchup 0: Killin me Scheifle vs SpudKick
  { gm1: "Bimm", gm2: "Adam", score1: 37.60, score2: 54.30 },

  // Matchup 1: Birth2Girth vs Saltiest Spring
  { gm1: "Andy", gm2: "Seedo", score1: 53.40, score2: 71.05 },

  // Matchup 2: Tiny Muscles Big Hustle vs Travis Fan Club
  { gm1: "Dave", gm2: "Hordo", score1: 40.40, score2: 79.65 },

  // Matchup 3: The Real West Coast Chat vs Monkey Butt
  { gm1: "Colin", gm2: "Ryan", score1: 48.10, score2: 28.90 },

  // Matchup 4: Medium Chuck vs Mack Miller
  { gm1: "Charlie", gm2: "Dan", score1: 62.30, score2: 75.10 },

  // Matchup 5: It's Jibbers! vs Murricle on Ice
  { gm1: "Jordan", gm2: "Marinos", score1: 56.20, score2: 72.65 },

  // Matchup 6: Willy Stylez vs Shit The Driveway
  { gm1: "Trevor", gm2: "Mike", score1: 73.20, score2: 72.60 }
];

// ============================================
// WEEK 13 SCORES
// ============================================
// Schedule: Bimm vs Colin, Andy vs Ryan, Dave vs Marinos, Charlie vs Seedo,
//           Dan vs Hordo, Jordan vs Mike, Trevor vs Adam

const week13Scores = [
  // Matchup 0: Killin me Scheifle vs The Real West Coast Chat
  { gm1: "Bimm", gm2: "Colin", score1: 71.50, score2: 137.85 },

  // Matchup 1: Birth2Girth vs Monkey Butt
  { gm1: "Andy", gm2: "Ryan", score1: 136.95, score2: 87.85 },

  // Matchup 2: Tiny Muscles Big Hustle vs Murricle on Ice
  { gm1: "Dave", gm2: "Marinos", score1: 70.30, score2: 92.00 },

  // Matchup 3: Medium Chuck vs Saltiest Spring
  { gm1: "Charlie", gm2: "Seedo", score1: 127.85, score2: 92.50 },

  // Matchup 4: Mack Miller vs Travis Fan Club
  { gm1: "Dan", gm2: "Hordo", score1: 161.30, score2: 138.55 },

  // Matchup 5: It's Jibbers! vs Shit The Driveway
  { gm1: "Jordan", gm2: "Mike", score1: 146.20, score2: 155.50 },

  // Matchup 6: Willy Stylez vs SpudKick
  { gm1: "Trevor", gm2: "Adam", score1: 70.80, score2: 88.25 }
];

// ============================================
// WEEK 14 SCORES
// ============================================
// Schedule: Bimm vs Andy, Dave vs Jordan, Colin vs Trevor, Charlie vs Ryan,
//           Seedo vs Hordo, Dan vs Marinos, Adam vs Mike

const week14Scores = [
  // Matchup 0: Killin me Scheifle vs Birth2Girth
  { gm1: "Bimm", gm2: "Andy", score1: 142.65, score2: 101.70 },

  // Matchup 1: Tiny Muscles Big Hustle vs It's Jibbers!
  { gm1: "Dave", gm2: "Jordan", score1: 90.80, score2: 90.00 },

  // Matchup 2: The Real West Coast Chat vs Willy Stylez
  { gm1: "Colin", gm2: "Trevor", score1: 90.75, score2: 105.75 },

  // Matchup 3: Medium Chuck vs Monkey Butt
  { gm1: "Charlie", gm2: "Ryan", score1: 142.00, score2: 36.50 },

  // Matchup 4: Saltiest Spring vs Travis Fan Club
  { gm1: "Seedo", gm2: "Hordo", score1: 106.25, score2: 60.70 },

  // Matchup 5: Mack Miller vs Murricle on Ice
  { gm1: "Dan", gm2: "Marinos", score1: 70.30, score2: 107.95 },

  // Matchup 6: SpudKick vs Shit The Driveway
  { gm1: "Adam", gm2: "Mike", score1: 80.00, score2: 100.85 }
];

// ============================================
// WEEK 15 SCORES
// ============================================
// Schedule: Bimm vs Charlie, Andy vs Trevor, Dave vs Dan, Colin vs Mike,
//           Ryan vs Hordo, Seedo vs Marinos, Jordan vs Adam

const week15Scores = [
  // Matchup 0: Killin me Scheifle vs Medium Chuck
  { gm1: "Bimm", gm2: "Charlie", score1: 145.20, score2: 127.55 },

  // Matchup 1: Birth2Girth vs Willy Stylez
  { gm1: "Andy", gm2: "Trevor", score1: 136.30, score2: 83.50 },

  // Matchup 2: Tiny Muscles Big Hustle vs Mack Miller
  { gm1: "Dave", gm2: "Dan", score1: 101.50, score2: 143.50 },

  // Matchup 3: The Real West Coast Chat vs Shit The Driveway
  { gm1: "Colin", gm2: "Mike", score1: 144.25, score2: 139.20 },

  // Matchup 4: Monkey Butt vs Travis Fan Club
  { gm1: "Ryan", gm2: "Hordo", score1: 114.90, score2: 64.10 },

  // Matchup 5: Saltiest Spring vs Murricle on Ice
  { gm1: "Seedo", gm2: "Marinos", score1: 127.95, score2: 125.10 },

  // Matchup 6: It's Jibbers! vs SpudKick
  { gm1: "Jordan", gm2: "Adam", score1: 131.40, score2: 128.90 }
];

// ============================================
// WEEK 16 SCORES
// ============================================
// Schedule: Bimm vs Hordo, Andy vs Mike, Dave vs Seedo, Colin vs Adam,
//           Charlie vs Trevor, Ryan vs Marinos, Dan vs Jordan

const week16Scores = [
  // Matchup 0: Killin me Scheifle vs Travis Fan Club
  { gm1: "Bimm", gm2: "Hordo", score1: 151.20, score2: 92.50 },

  // Matchup 1: Birth2Girth vs Shit The Driveway
  { gm1: "Andy", gm2: "Mike", score1: 160.30, score2: 84.45 },

  // Matchup 2: Tiny Muscles Big Hustle vs Saltiest Spring
  { gm1: "Dave", gm2: "Seedo", score1: 81.10, score2: 113.20 },

  // Matchup 3: The Real West Coast Chat vs SpudKick
  { gm1: "Colin", gm2: "Adam", score1: 137.30, score2: 75.40 },

  // Matchup 4: Medium Chuck vs Willy Stylez
  { gm1: "Charlie", gm2: "Trevor", score1: 116.70, score2: 96.10 },

  // Matchup 5: Monkey Butt vs Murricle on Ice
  { gm1: "Ryan", gm2: "Marinos", score1: 115.05, score2: 95.30 },

  // Matchup 6: Mack Miller vs It's Jibbers!
  { gm1: "Dan", gm2: "Jordan", score1: 79.90, score2: 88.40 }
];

// ============================================
// WEEK 17 SCORES
// ============================================
// Schedule: Bimm vs Marinos, Andy vs Adam, Dave vs Ryan, Colin vs Jordan,
//           Charlie vs Mike, Seedo vs Dan, Trevor vs Hordo

const week17Scores = [
  // Matchup 0: Killin me Scheifle vs Murricle on Ice
  { gm1: "Bimm", gm2: "Marinos", score1: 78.30, score2: 53.00 },

  // Matchup 1: Birth2Girth vs SpudKick
  { gm1: "Andy", gm2: "Adam", score1: 136.30, score2: 96.90 },

  // Matchup 2: Tiny Muscles Big Hustle vs Monkey Butt
  { gm1: "Dave", gm2: "Ryan", score1: 71.40, score2: 68.50 },

  // Matchup 3: The Real West Coast Chat vs It's Jibbers!
  { gm1: "Colin", gm2: "Jordan", score1: 139.50, score2: 110.60 },

  // Matchup 4: Medium Chuck vs Shit The Driveway
  { gm1: "Charlie", gm2: "Mike", score1: 102.70, score2: 105.20 },

  // Matchup 5: Saltiest Spring vs Mack Miller
  { gm1: "Seedo", gm2: "Dan", score1: 89.40, score2: 86.70 },

  // Matchup 6: Willy Stylez vs Travis Fan Club
  { gm1: "Trevor", gm2: "Hordo", score1: 84.00, score2: 89.10 }
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

        for (let i = 0; i < weekScores.length; i++) {
            const matchup = weekScores[i];
            const docId = `week-${weekNumber}-matchup-${i}`;

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
    console.log('           WEEK 10 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(10, week10Scores);
    await verifyWeekUpdates(10, week10Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 11 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(11, week11Scores);
    await verifyWeekUpdates(11, week11Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 12 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(12, week12Scores);
    await verifyWeekUpdates(12, week12Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 13 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(13, week13Scores);
    await verifyWeekUpdates(13, week13Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 14 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(14, week14Scores);
    await verifyWeekUpdates(14, week14Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 15 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(15, week15Scores);
    await verifyWeekUpdates(15, week15Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 16 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(16, week16Scores);
    await verifyWeekUpdates(16, week16Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           WEEK 17 SCORES');
    console.log('═══════════════════════════════════════════\n');
    totalUpdated += await addWeekScores(17, week17Scores);
    await verifyWeekUpdates(17, week17Scores);

    console.log('═══════════════════════════════════════════');
    console.log('           SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`\n👋 All done! Updated ${totalUpdated} total matchups across Weeks 10-17.\n`);

    process.exit(0);
})();
