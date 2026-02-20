// migrate-sidebets-simplify.js
// This script simplifies sidebets in Firestore
// Removes: status, isWinner properties
// Adds: isFulfilled property (defaults to false)
// Run with: node migrate-sidebets-simplify.js

const admin = require('firebase-admin');

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_ACCOUNT_PATH = './service-account-key.json';
const COLLECTION_NAME = 'sidebets';

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
    process.exit(1);
}

const db = admin.firestore();

// ============================================
// MIGRATE SIDEBETS
// ============================================

async function migrateSidebets() {
    console.log('🚀 Starting sidebet migration...\n');
    
    try {
        // Get all sidebets
        const snapshot = await db.collection(COLLECTION_NAME).get();
        
        if (snapshot.empty) {
            console.log('⚠️  No sidebets found in Firestore');
            return;
        }
        
        console.log(`📊 Found ${snapshot.size} sidebets to migrate\n`);
        
        const batch = db.batch();
        let updateCount = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            console.log(`  📝 Processing: "${data.suggestion.substring(0, 50)}..."`);
            console.log(`     Current status: ${data.status || 'none'}`);
            console.log(`     Current isWinner: ${data.isWinner || false}`);
            
            // Create the new simplified structure
            const updatedData = {
                suggestion: data.suggestion,
                submittedBy: data.submittedBy,
                targetMatchup: data.targetMatchup || null,
                submittedAt: data.submittedAt,
                // Default isFulfilled to false, unless it was marked as a winner
                isFulfilled: data.isWinner === true ? true : false
            };
            
            console.log(`     New isFulfilled: ${updatedData.isFulfilled}`);
            
            // Update the document (this replaces all fields)
            batch.set(doc.ref, updatedData);
            updateCount++;
            console.log(`     ✅ Queued for update\n`);
        });
        
        // Commit all changes
        console.log('💾 Committing changes to Firestore...');
        await batch.commit();
        
        console.log('\n🎉 SUCCESS! Migration complete!');
        console.log(`📊 Updated ${updateCount} sidebets\n`);
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

// ============================================
// VERIFY MIGRATION
// ============================================

async function verifyMigration() {
    console.log('🔍 Verifying migration...\n');
    
    try {
        const snapshot = await db.collection(COLLECTION_NAME).get();
        
        // Check a sample document
        if (!snapshot.empty) {
            const sampleDoc = snapshot.docs[0];
            const data = sampleDoc.data();
            
            console.log('📄 Sample sidebet after migration:');
            console.log(`   ID: ${sampleDoc.id}`);
            console.log(`   Fields:`, Object.keys(data));
            console.log(`   Data:`, JSON.stringify(data, null, 2));
            
            // Check for old fields
            const hasOldFields = data.status || data.isWinner !== undefined;
            if (hasOldFields) {
                console.log('\n⚠️  WARNING: Old fields still present!');
            } else {
                console.log('\n✅ Old fields successfully removed');
            }
            
            // Check for new field
            if (data.isFulfilled !== undefined) {
                console.log('✅ New isFulfilled field present');
            } else {
                console.log('⚠️  WARNING: isFulfilled field missing!');
            }
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
    console.log('⚠️  WARNING: This will modify all sidebets in Firestore!');
    console.log('⚠️  Make sure you have a backup before proceeding.\n');
    
    // Wait 3 seconds to give user time to cancel
    console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await migrateSidebets();
    await verifyMigration();
    
    console.log('👋 All done! You can now close this script.\n');
    process.exit(0);
})();