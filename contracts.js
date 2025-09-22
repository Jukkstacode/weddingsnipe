document.addEventListener('DOMContentLoaded', function() {
    // NHL Player ID mapping
    const playerNHLIds = {
            "Robert Thomas": "8480023",
            "Roope Hintz": "8478449",
            "MacKenzie Weegar": "8477346",
            "Dougie Hamilton": "8476462",
            "Thatcher Demko": "8477967",
            "Ryan Nugent-Hopkins": "8476454",
            "Brayden Point": "8478010",
            "Jake Oettinger": "8479979",
            "Nikita Kucherov": "8476453",
            "Jason Robertson": "8480027",
            "Brady Tkachuk": "8480801",
            "Ilya Sorokin": "8478009",
            "Lane Hutson": "8483457",
            "Evan Bouchard": "8480803",
            "Macklin Celebrini": "8484801",
            "David Pastrnak": "8477956",
            "John Tavares": "8475166",
            "Mason McTavish": "8482745", // ⚠️ Unmatched
            "Frederik Andersen": "8475883",
            "Brandon Hagel": "8479542",
            "Mitch Marner": "8478483",
            "Josh Morrissey": "8477504",
            "Pavel Buchnevich": "8477402",
            "Rasmus Dahlin": "8480839",
            "Dylan Larkin": "8477946",
            "Mark Scheifele": "8476460",
            "Tage Thompson": "8479420",
            "Adrian Kempe": "8477960",
            "Elias Pettersson": "8480012",
            "Alex DeBrincat": "8479337",
            "Zach Hyman": "8475786",
            "Charlie McAvoy": "8479325",
            "Tim Stützle": "8482116",
            "Dylan Strome": "8478440",
            "Nathan MacKinnon": "8477492",
            "Auston Matthews": "8479318",
            "Kyle Connor": "8478398",
            "Jake Guentzel": "8477404",
            "J.T. Miller": "8476468",
            "Nazem Kadri": "8475172",
            "Anthony Stolarz": "8476440", // corrected from wrong ID
            "Leon Draisaitl": "8477934",
            "Matt Boldy": "8481557",
            "Jack Hughes": "8481559",
            "Connor Hellebuyck": "8476945",
            "Juuse Saros": "8477424",
            "Timo Meier": "8478414",
            "Josh Norris": "8480064",
            "Victor Hedman": "8475167",
            "Mathew Barzal": "8478445",
            "Joel Eriksson Ek": "8478493",
            "Kirill Kaprizov": "8478864",
            "Jordan Binnington": "8476412",
            "Adam Fox": "8479323",
            "Quinn Hughes": "8480800",
            "Elias Lindholm": "8477496",
            "Igor Shesterkin": "8478048",
            "Artemi Panarin": "8478550",
            "Alexis Lafrenière": "8482109",
            "Jack Eichel": "8478403",
            "Aleksander Barkov": "8477493",
            "Gabriel Landeskog": "8476455",
            "Cole Caufield": "8481540",
            "Wyatt Johnston": "8482740",
            "Sam Montembeault": "8478470",
            "Cale Makar": "8480069",
            "Sebastian Aho": "8478427",
            "Andrei Vasilevskiy": "8476883",
            "Connor Bedard": "8484144",
            "Mikko Rantanen": "8478420",
            "Mika Zibanejad": "8476459",
            "Alex Tuch": "8477949",
            "Martin Nečas": "8480039",
            "Matthew Tkachuk": "8479314",
            "Trevor Zegras": "8481533",
            "Seth Jarvis": "8482093",
            "Jesper Bratt": "8479407",
            "Sam Reinhart": "8477933",
            "Mackenzie Blackwood": "8478406",
            "William Nylander": "8477939",
            "Pierre-Luc Dubois": "8479400",
            "Shea Theodore": "8477447",
            "Nico Hischier": "8480002",
            "Jacob Markstrom": "8474593",
            "Sergei Bobrovsky": "8475683"
    };

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

    async function fetchAllPlayerStats(playerIds) {
        const functionUrl = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
        const season = '20242025'; // Specify the season you want
        try {
            // Add the season as a query parameter to the request
            const response = await fetch(`${functionUrl}?playerIds=${playerIds.join(',')}&season=${season}`);
            if (!response.ok) {
                throw new Error('Failed to fetch player stats from cloud function');
            }
            return response.json();
        } catch (error) {
            console.error('Error calling the cloud function:', error);
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
        fetch('contracts.json').then(response => response.json()),
        fetch('gm.json').then(response => response.json())
    ]).then(async ([contracts, gms]) => {
        const container = document.querySelector('.gm-list-container');
        if (!container) {
            console.error('GM list container not found!');
            return;
        }

        const allPlayerIds = contracts.map(contract => playerNHLIds[contract.Player]).filter(id => id);
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
                    const nhlId = playerNHLIds[contract.Player];
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