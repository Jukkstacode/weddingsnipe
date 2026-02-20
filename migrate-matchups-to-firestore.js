// migrate-matchups-to-firestore.js
// This script migrates matchups from matchups.json to Firestore
// Run with: node migrate-matchups-to-firestore.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

// Path to your service account key JSON file
// You'll need to download this from Google Cloud Console
const SERVICE_ACCOUNT_PATH = './service-account-key.json';

// Path to your matchups.json file
const MATCHUPS_JSON_PATH = './schedule/matchups.json';

// Firestore collection name
const COLLECTION_NAME = 'matchups';

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
    console.error('\n💡 Make sure you have downloaded your service account key from:');
    console.error('   Google Cloud Console → IAM & Admin → Service Accounts');
    console.error('   Save it as "service-account-key.json" in your project root\n');
    process.exit(1);
}

const db = admin.firestore();

// ============================================
// LOAD MATCHUPS DATA
// ============================================

console.log('📖 Reading matchups.json...');

let matchupsData;
try {
    const jsonPath = path.resolve(MATCHUPS_JSON_PATH);
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    matchupsData = JSON.parse(rawData);
    console.log(`✅ Loaded ${matchupsData.length} weeks of matchups\n`);
} catch (error) {
    console.error('❌ Error reading matchups.json:', error.message);
    process.exit(1);
}

// ============================================
// MIGRATE DATA TO FIRESTORE
// ============================================

async function migrateMatchups() {
    console.log('🚀 Starting migration to Firestore...\n');
    
    let totalMatchups = 0;
    
    try {
        // Use a batch write for efficiency
        // Firestore limits batches to 500 operations, but we're well under that
        const batch = db.batch();
        
        // Process each week
        for (const week of matchupsData) {
            const weekNumber = week.Week;
            
            console.log(`  📅 Processing Week ${weekNumber}...`);
            
            // Process each matchup in the week
            for (let i = 0; i < week.Matchups.length; i++) {
                const matchup = week.Matchups[i];
                
                // Create a document ID: "week-{weekNumber}-matchup-{index}"
                // Example: "week-1-matchup-0", "week-1-matchup-1", etc.
                const docId = `week-${weekNumber}-matchup-${i}`;
                
                // Create the document data (WITHOUT isSpecial flag)
                const matchupData = {
                    week: weekNumber,
                    gm1: matchup.GM1,
                    gm2: matchup.GM2,
                    matchupIndex: i, // Store the order within the week
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };
                
                // Add to batch
                const docRef = db.collection(COLLECTION_NAME).doc(docId);
                batch.set(docRef, matchupData);
                
                totalMatchups++;
                
                console.log(`    ✓ ${matchup.GM1} vs ${matchup.GM2}`);
            }
            
            console.log(`  ✅ Week ${weekNumber} complete (${week.Matchups.length} matchups)\n`);
        }
        
        // Commit the batch
        console.log('💾 Committing all changes to Firestore...');
        await batch.commit();
        
        console.log('\n🎉 SUCCESS! Migration complete!');
        console.log(`📊 Total matchups migrated: ${totalMatchups}`);
        console.log(`📂 Collection: ${COLLECTION_NAME}\n`);
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

// ============================================
// VERIFY MIGRATION (OPTIONAL)
// ============================================

async function verifyMigration() {
    console.log('🔍 Verifying migration...\n');
    
    try {
        const snapshot = await db.collection(COLLECTION_NAME).get();
        console.log(`✅ Found ${snapshot.size} documents in Firestore`);
        
        // Show a sample document
        if (!snapshot.empty) {
            const sampleDoc = snapshot.docs[0];
            console.log('\n📄 Sample document:');
            console.log(`   ID: ${sampleDoc.id}`);
            console.log(`   Data:`, JSON.stringify(sampleDoc.data(), null, 2));
        }
        
        console.log('\n✨ Verification complete!\n');
    } catch (error) {
        console.error('❌ Error verifying migration:', error);
    }
}

// ============================================
// RUN THE MIGRATION
// ============================================

(async () => {
    await migrateMatchups();
    await verifyMigration();
    
    console.log('👋 All done! You can now close this script.\n');
    process.exit(0);
})();