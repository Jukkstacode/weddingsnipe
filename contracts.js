document.addEventListener('DOMContentLoaded', function() {
     // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDtbnBa_wok-tRS-A2xraRBMJE8oM5Hc6c",
        authDomain: "wedding-snipe.firebaseapp.com",
        projectId: "wedding-snipe",
        storageBucket: "wedding-snipe.firebasestorage.app",
        messagingSenderId: "347732622266",
        appId: "1:347732622266:web:db85733e367e9c2ae37b83"
    };
    
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    // Fantasy scoring system
    const FANTASY_SCORING = {
        goals: 3,
        assists: 2,
        plusMinus: 1,
        pim: 0.25,
        powerPlayPoints: 1,
        shortHandedPoints: 1,
        gameWinningGoals: 1.5,
        wins: 3,
        goalsAgainst: -1.5,
        saves: 0.2,
        shutouts: 6
    };

    function calculateSkaterFantasyPoints(stats) {
        if (!stats) return 0;
        // This logic is now aligned with debug_stats.html
        const { goals = 0, assists = 0, plusMinus = 0, pim = 0, powerPlayPoints = 0, shorthandedPoints = 0, gameWinningGoals = 0 } = stats;
        return (goals * FANTASY_SCORING.goals) +
               (assists * FANTASY_SCORING.assists) +
               (plusMinus * FANTASY_SCORING.plusMinus) +
               (pim * FANTASY_SCORING.pim) +
               (powerPlayPoints * FANTASY_SCORING.powerPlayPoints) +
               (shorthandedPoints * FANTASY_SCORING.shortHandedPoints) +
               (gameWinningGoals * FANTASY_SCORING.gameWinningGoals);
    }

    function calculateGoalieFantasyPoints(stats) {
        if (!stats) return 0;
        // This logic is now aligned with debug_stats.html
        const { wins = 0, goalsAgainst = 0, shotsAgainst = 0, shutouts = 0 } = stats;
        const calculatedSaves = shotsAgainst - goalsAgainst;
        return (wins * FANTASY_SCORING.wins) +
               (goalsAgainst * FANTASY_SCORING.goalsAgainst) +
               (calculatedSaves * FANTASY_SCORING.saves) +
               (shutouts * FANTASY_SCORING.shutouts);
    }

    async function fetchAllPlayerStats() {
        try {
            const snapshot = await db.collection('player-stats').get();
            const stats = {};
            snapshot.forEach(doc => {
                stats[doc.id] = doc.data();
            });
            return stats;
        } catch (error) {
            console.error('Error loading player stats:', error);
            return {};
        }
    }

    function formatStatsHtml(stats, position) {
        if (!stats) return '<span class="no-stats">No stats available for this season</span>';
        
        // Use 'season' instead of 'seasonId' from the new API response
        const season = stats.season; 
        const seasonDisplay = `${String(season).substring(0, 4)}-${String(season).substring(4)}`;

        if (position === 'G') {
            const fantasyPts = calculateGoalieFantasyPoints(stats).toFixed(2);
            return `
                <span class="stats-season">${seasonDisplay} Season</span>
                <span class="stats-line">GP: ${stats.gamesPlayed || 0} | W: ${stats.wins || 0} | L: ${stats.losses || 0}</span>
                <span class="stats-line">GAA: ${stats.goalAgainstAverage?.toFixed(2) || 'N/A'} | SV%: ${stats.savePctg?.toFixed(3) || 'N/A'}</span>
                <span class="stats-line fantasy-pts">Fantasy Pts: ${fantasyPts}</span>
            `;
        } else {
            const fantasyPts = calculateSkaterFantasyPoints(stats).toFixed(2);
            return `
                <span class="stats-season">${seasonDisplay} Season</span>
                <span class="stats-line">GP: ${stats.gamesPlayed || 0} | G: ${stats.goals || 0} | A: ${stats.assists || 0} | P: ${stats.points || 0}</span>
                <span class="stats-line">+/-: ${stats.plusMinus > 0 ? '+' : ''}${stats.plusMinus || 0} | PIM: ${stats.pim || 0}</span>
                <span class="stats-line fantasy-pts">Fantasy Pts: ${fantasyPts}</span>
            `;
        }
    }

    Promise.all([
        fetch('/contracts.json').then(response => response.json()),
        fetch('/gm.json').then(response => response.json())
    ]).then(async ([contracts, gms]) => {
        const container = document.querySelector('.gm-list-container');
        if (!container) {
            console.error('GM list container not found!');
            return;
        }

        const allPlayerIds = contracts.map(contract => contract.nhlId).filter(id => id);
        const uniquePlayerIds = [...new Set(allPlayerIds)];
        const allPlayerStats = await fetchAllPlayerStats(uniquePlayerIds);

        const gmsMap = new Map(gms.map(gm => [gm.name, gm]));
        const contractsByGm = contracts.reduce((acc, contract) => {
            const gmName = contract.GM;
            if (!acc[gmName]) acc[gmName] = [];
            acc[gmName].push(contract);
            return acc;
        }, {});

        for (const gmName in contractsByGm) {
            const gm = gmsMap.get(gmName);
            if (gm) {
                const gmDiv = document.createElement('div');
                gmDiv.className = 'gm-container';
                const photoDiv = document.createElement('div');
                photoDiv.className = 'gm-photo';
                const img = document.createElement('img');
                img.src = gm.image;
                img.alt = gm.name;
                photoDiv.appendChild(img);
                const playersDiv = document.createElement('div');
                playersDiv.className = 'players-container';

                for (const contract of contractsByGm[gmName]) {
                    const playerChip = document.createElement('div');
                    playerChip.className = 'player-chip';
                    const nhlId = contract.nhlId;
                    const stats = allPlayerStats[nhlId];
                    const statsHtml = formatStatsHtml(stats, contract.Position);
                    let stolenBadge = contract['Stolen?'] ? `<div class="stolen-badge"></div>` : '';
                    playerChip.innerHTML = `
                        <div class="player-name">${contract.Player}</div>
                        <div class="player-info">
                            <span class="position-team">${contract.Position} | ${contract.Team} | ${contract['Contract Length']} years</span>
                            <div class="player-stats">${statsHtml}</div>
                        </div>
                        ${stolenBadge}
                    `;
                    playersDiv.appendChild(playerChip);
                }
                gmDiv.appendChild(photoDiv);
                gmDiv.appendChild(playersDiv);
                container.appendChild(gmDiv);
            }
        }
    }).catch(error => {
        console.error('Error fetching initial data:', error);
    });
});