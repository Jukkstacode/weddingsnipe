const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://wedding-snipe.firebaseio.com' // Replace with your project ID
});

const db = admin.firestore();

async function fetchAllPlayerStatsAndPositions() {
    const playerStatsCollection = db.collection('player-stats');
    const snapshot = await playerStatsCollection.get();
    const playerIds = snapshot.docs.map(doc => doc.id);

    const functionUrl = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
    
    try {
        // Fetch Positions
        const positionResponse = await fetch(`${functionUrl}?requestType=playerPosition&playerIds=${playerIds.join(',')}`);
        if (!positionResponse.ok) {
            throw new Error('Failed to fetch player positions');
        }
        const positions = await positionResponse.json();

        // Update Firestore with positions
        const batch = db.batch();
        for (const playerId in positions) {
            const playerRef = playerStatsCollection.doc(playerId);
            batch.update(playerRef, { position: positions[playerId].position });
        }
        await batch.commit();
        
        console.log('Player positions saved to Firestore');
        
    } catch (error) {
        console.error('Error fetching and updating player data:', error);
    }
}

fetchAllPlayerStatsAndPositions();