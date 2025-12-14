// home.js - Display League Standings
document.addEventListener('DOMContentLoaded', async function() {
    const gridContainer = document.getElementById('gm-teams-grid');

    // Initialize Firebase (using the same configuration as schedule.js)
    const firebaseConfig = {
        apiKey: "AIzaSyDtbnBa_wok-tRS-A2xraRBMJE8oM5Hc6c",
        authDomain: "wedding-snipe.firebaseapp.com",
        projectId: "wedding-snipe",
        storageBucket: "wedding-snipe.firebasestorage.app",
        messagingSenderId: "347732622266",
        appId: "1:347732622266:web:db85733e367e9c2ae37b83"
    };

    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore();

    try {
        // Fetch both standings from Firestore and GM data from JSON
        const [standingsData, gmsData] = await Promise.all([
            fetchStandingsFromFirestore(),
            fetch('gm.json').then(response => response.json())
        ]);

        // Create a map of GM names to their images
        const gmImageMap = new Map(gmsData.map(gm => [gm.name, gm.image]));

        // Display standings
        displayStandings(standingsData, gmImageMap);

    } catch (error) {
        console.error('Error loading standings:', error);
        gridContainer.innerHTML = '<p style="color: red; text-align: center;">Failed to load league standings.</p>';
    }
});

/**
 * Fetch standings from Firestore
 * @returns {Promise<Array>} Array of standings objects
 */
async function fetchStandingsFromFirestore() {
    console.log('📊 Fetching standings from Firestore...');

    try {
        const snapshot = await firebase.firestore().collection('standings').get();

        if (snapshot.empty) {
            console.warn('No standings found in Firestore');
            return [];
        }

        const standings = [];
        snapshot.forEach(doc => {
            standings.push(doc.data());
        });

        // Sort by wins (descending), then by points (descending)
        standings.sort((a, b) => {
            if (b.wins !== a.wins) {
                return b.wins - a.wins; // Sort by wins first
            }
            return b.points - a.points; // Then by points
        });

        console.log(`✅ Found ${standings.length} teams in standings`);
        return standings;

    } catch (error) {
        console.error('Error fetching standings:', error);
        throw error;
    }
}

/**
 * Display standings as a ranked list
 * @param {Array} standings - Array of standings objects
 * @param {Map} gmImageMap - Map of GM names to image URLs
 */
function displayStandings(standings, gmImageMap) {
    const gridContainer = document.getElementById('gm-teams-grid');
    gridContainer.innerHTML = ''; // Clear existing content
    gridContainer.className = 'standings-list'; // Change class for new layout

    if (standings.length === 0) {
        gridContainer.innerHTML = '<p class="no-standings">No standings data available yet.</p>';
        return;
    }

    standings.forEach((team, index) => {
        const standingRow = createStandingRow(team, index + 1, gmImageMap);
        gridContainer.appendChild(standingRow);
    });
}

/**
 * Create a standing row element
 * @param {Object} team - Team standings object
 * @param {number} rank - Current rank (1-based)
 * @param {Map} gmImageMap - Map of GM names to image URLs
 * @returns {HTMLElement} - The standings row element
 */
function createStandingRow(team, rank, gmImageMap) {
    const row = document.createElement('div');
    row.className = 'standing-row';

    // Add special class for top 3
    if (rank === 1) row.classList.add('rank-1');
    else if (rank === 2) row.classList.add('rank-2');
    else if (rank === 3) row.classList.add('rank-3');

    // Rank number
    const rankEl = document.createElement('div');
    rankEl.className = 'standing-rank';
    rankEl.textContent = rank;

    // GM info (photo + name)
    const gmInfo = document.createElement('div');
    gmInfo.className = 'standing-gm-info';

    const photo = document.createElement('img');
    photo.src = gmImageMap.get(team.gm) || 'assets/default-avatar.png';
    photo.alt = team.gm;
    photo.className = 'standing-gm-photo';

    const name = document.createElement('span');
    name.className = 'standing-gm-name';
    name.textContent = team.gm;

    gmInfo.appendChild(photo);
    gmInfo.appendChild(name);

    // Stats container
    const stats = document.createElement('div');
    stats.className = 'standing-stats';

    // Wins
    const wins = document.createElement('div');
    wins.className = 'stat-box stat-wins';
    wins.innerHTML = `<span class="stat-value">${team.wins}</span>`;

    // Losses
    const losses = document.createElement('div');
    losses.className = 'stat-box stat-losses';
    losses.innerHTML = `<span class="stat-value">${team.losses}</span>`;

    // Points
    const points = document.createElement('div');
    points.className = 'stat-box stat-points';
    points.innerHTML = `<span class="stat-value">${team.points.toFixed(2)}</span>`;

    stats.appendChild(wins);
    stats.appendChild(losses);
    stats.appendChild(points);

    // Assemble the row
    row.appendChild(rankEl);
    row.appendChild(gmInfo);
    row.appendChild(stats);

    return row;
}
