const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://<YOUR_PROJECT_ID>.firebaseio.com' // Replace with your project ID
});

const db = admin.firestore();

async function fetchAllPlayerStats() {
    const playerIds = [
        "8480023", "8478449", "8477346", "8476462", "8477967", "8476454", "8478010", 
        "8479979", "8476453", "8480027", "8480801", "8478009", "8483457", "8480803", 
        "8484801", "8477956", "8475166", "8482745", "8475883", "8479542", "8478483", 
        "8477504", "8477402", "8480839", "8477946", "8476460", "8479420", "8477960", 
        "8480012", "8479337", "8475786", "8479325", "8482116", "8478440", "8477492", 
        "8479318", "8478398", "8477404", "8476468", "8475172", "8476932", "8477934", 
        "8481557", "8481559", "8476945", "8477424", "8478414", "8480064", "8475167", 
        "8478445", "8478493", "8478864", "8476412", "8479323", "8480800", "8477496", 
        "8478048", "8478550", "8482109", "8478403", "8477493", "8476455", "8481540", 
        "8482740", "8478470", "8480069", "8478427", "8476883", "8484144", "8478420", 
        "8476459", "8477949", "8480039", "8479314", "8481533", "8482093", "8479407", 
        "8477933", "8478406", "8477939", "8479400", "8477447", "8480002", "8474593", 
        "8475683", "8471675", "8480192", "8484166", "8478402", "8480018"
    ];
    
    const functionUrl = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
    const season = '20242025';
    
    try {
        const response = await fetch(`${functionUrl}?playerIds=${playerIds.join(',')}&season=${season}`);
        if (!response.ok) {
            throw new Error('Failed to fetch player stats');
        }
        const stats = await response.json();
        
        // Write the stats to Firestore
        const batch = db.batch();
        for (const playerId in stats) {
            const playerRef = db.collection('player-stats').doc(playerId);
            batch.set(playerRef, stats[playerId]);
        }
        await batch.commit();
        
        console.log('Player stats saved to Firestore');
        
    } catch (error) {
        console.error('Error fetching player stats:', error);
    }
}

fetchAllPlayerStats();