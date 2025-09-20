document.addEventListener('DOMContentLoaded', function() {
    // NHL Player ID mapping - you'll need to add these for your contract players
    const playerNHLIds = {
        "Robert Thomas": "8479337",
        "Roope Hintz": "8479425", 
        "MacKenzie Weegar": "8477346",
        "Dougie Hamilton": "8476462",
        "Thatcher Demko": "8477967",
        "Ryan Nugent-Hopkins": "8476454",
        "Brayden Point": "8478010",
        "Jake Oettinger": "8480313",
        "Nikita Kucherov": "8476453",
        "Jason Robertson": "8480027",
        "Brady Tkachuk": "8480801",
        "Ilya Sorokin": "8480585",
        "Lane Hutson": "8483503",
        "Evan Bouchard": "8480803",
        "Macklin Celebrini": "8484144",
        "David Pastrnak": "8477956",
        "John Tavares": "8475166",
        "Mason McTavish": "8482745",
        "Frederik Andersen": "8471469",
        "Brandon Hagel": "8479061",
        "Mitch Marner": "8478483",
        "Josh Morrisey": "8477504",
        "Pavel Buchnevich": "8478420",
        "Rasmus Dahlin": "8480839",
        "Dylan Larkin": "8477946",
        "Mark Scheifele": "8476460",
        "Tage Thompson": "8479420",
        "Adrian Kempe": "8477960",
        "Elias Pettersson": "8480012",
        "Alex DeBrincat": "8479337",
        "Zach Hyman": "8475786",
        "Charlie McAvoy": "8479325",
        "Tim Stutzle": "8482116",
        "Dylan Strome": "8478440",
        "Nathan MacKinnon": "8477492",
        "Auston Matthews": "8479318",
        "Kyle Connor": "8479715",
        "Jake Guentzel": "8477404",
        "J.T. Miller": "8476468",
        "Nazem Kadri": "8475172",
        "Anthony Stolarz": "8475303",
        "Leon Draisaitl": "8477934",
        "Matt Boldy": "8482073",
        "Jack Hughes": "8481559",
        "Connor Hellebuyck": "8475883",
        "Juuse Saros": "8477424",
        "Timo Meier": "8478188",
        "Josh Norris": "8481593",
        "Victor Hedman": "8475167",
        "Mathew Barzal": "8478445",
        "Joel Eriksson Ek": "8478493",
        "Kirill Kaprizov": "8478864",
        "Jordan Binnington": "8477361",
        "Adam Fox": "8479323",
        "Quinn Hughes": "8481542",
        "Elias Lindholm": "8477496",
        "Igor Shesterkin": "8478048",
        "Artemi Panarin": "8478550",
        "Alexis Lafreniere": "8481563",
        "Jack Eichel": "8478403",
        "Aleksander Barkov": "8477493",
        "Gabriel Landeskog": "8476455",
        "Cole Caufield": "8481540",
        "Wyatt Johnston": "8482745",
        "Sam Montembeault": "8477946",
        "Cale Makar": "8480069",
        "Sebastian Aho": "8478427",
        "Andrei Vasilevskiy": "8476883",
        "Connor Bedard": "8484144",
        "Mikko Rantanen": "8478420",
        "Mika Zibanejad": "8476459",
        "Alex Tuch": "8477949",
        "Martin Necas": "8480039",
        "Matthew Tkachuk": "8479314",
        "Trevor Zegras": "8481533",
        "Seth Jarvis": "8481559",
        "Jesper Bratt": "8479407",
        "Sam Reinhart": "8477933",
        "Mackenzie Blackwood": "8478406",
        "William Nylander": "8477939",
        "Pierre-Luc Dubois": "8479400",
        "Shea Theodore": "8477950",
        "Nico Hischier": "8481521",
        "Jacob Markstrom": "8474593",
        "Sergei Bobrovsky": "8475683"
    };

    // Fantasy scoring system based on your tables
    const FANTASY_SCORING = {
        // Forwards/Defensemen
        goals: 3,
        assists: 2,
        plusMinus: 1, // per +1
        pim: 0.25, // penalty minutes
        powerPlayPoints: 1, // PPP (goals + assists on PP)
        shortHandedPoints: 1, // SHP (goals + assists on SH)  
        gameWinningGoals: 1.5,
        
        // Goalies
        wins: 3,
        goalsAgainst: -1.5, // GA
        saves: 0.2,
        shutouts: 6
    };

    // Calculate fantasy points for skaters
    function calculateSkaterFantasyPoints(stats) {
        const {
            goals = 0,
            assists = 0,
            plusMinus = 0,
            pim = 0,
            powerPlayGoals = 0,
            powerPlayAssists = 0,
            shortHandedGoals = 0,
            shortHandedAssists = 0,
            gameWinningGoals = 0
        } = stats;

        const powerPlayPoints = powerPlayGoals + powerPlayAssists;
        const shortHandedPoints = shortHandedGoals + shortHandedAssists;

        return (
            goals * FANTASY_SCORING.goals +
            assists * FANTASY_SCORING.assists +
            plusMinus * FANTASY_SCORING.plusMinus +
            pim * FANTASY_SCORING.pim +
            powerPlayPoints * FANTASY_SCORING.powerPlayPoints +
            shortHandedPoints * FANTASY_SCORING.shortHandedPoints +
            gameWinningGoals * FANTASY_SCORING.gameWinningGoals
        );
    }

    // Calculate fantasy points for goalies
    function calculateGoalieFantasyPoints(stats) {
        const {
            wins = 0,
            goalsAgainst = 0,
            saves = 0,
            shutouts = 0
        } = stats;

        return (
            wins * FANTASY_SCORING.wins +
            goalsAgainst * FANTASY_SCORING.goalsAgainst +
            saves * FANTASY_SCORING.saves +
            shutouts * FANTASY_SCORING.shutouts
        );
    }

    // Cache for NHL stats to avoid repeated API calls
    const statsCache = new Map();

    // Get current NHL season (starts in October)
    function getCurrentNHLSeason() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-based (September = 8)
        
        // If it's before October, we're still in the previous season
        if (currentMonth < 9) { // Before October
            return (currentYear - 1) * 10000 + currentYear;
        } else {
            return currentYear * 10000 + (currentYear + 1);
        }
    }

    // Fetch NHL stats for a player
    async function fetchNHLStats(playerId) {
        if (statsCache.has(playerId)) {
            return statsCache.get(playerId);
        }

        try {
            const response = await fetch(`https://api-web.nhle.com/v1/player/${playerId}/landing`);
            if (!response.ok) throw new Error('Player not found');
            
            const data = await response.json();
            console.log(`Player ${playerId} seasons:`, data.seasonTotals?.map(s => s.season)); // Debug log
            
            const currentSeason = getCurrentNHLSeason();
            console.log(`Looking for season: ${currentSeason}`); // Debug log
            
            // Try current season first, then fall back to most recent season
            let stats = data.seasonTotals?.find(season => 
                season.season === currentSeason && season.leagueAbbrev === 'NHL'
            );
            
            if (!stats && data.seasonTotals?.length > 0) {
                // Fall back to most recent NHL season
                stats = data.seasonTotals
                    .filter(season => season.leagueAbbrev === 'NHL')
                    .sort((a, b) => b.season - a.season)[0];
                console.log(`Using fallback season ${stats.season} for player ${playerId}`); // Debug log
            }
            
            statsCache.set(playerId, stats);
            return stats || null;
        } catch (error) {
            console.error(`Error fetching stats for player ${playerId}:`, error);
            statsCache.set(playerId, null);
            return null;
        }
    }

    // Format stats for display
    function formatStatsHtml(stats, position) {
        if (!stats) return '<span class="no-stats">No recent NHL stats available</span>';

        const season = stats.season;
        const seasonDisplay = `${Math.floor(season / 10000)}-${season % 10000}`;

        if (position === 'G') {
            // Goalie stats
            const fantasyPts = calculateGoalieFantasyPoints(stats).toFixed(1);
            return `
                <span class="stats-season">${seasonDisplay} Season</span>
                <span class="stats-line">GP: ${stats.gamesPlayed || 0} | W: ${stats.wins || 0} | L: ${stats.losses || 0}</span>
                <span class="stats-line">GAA: ${stats.goalsAgainstAverage?.toFixed(2) || 'N/A'} | SV%: ${stats.savePctg?.toFixed(3) || 'N/A'}</span>
                <span class="stats-line fantasy-pts">Fantasy Pts: ${fantasyPts}</span>
            `;
        } else {
            // Skater stats
            const fantasyPts = calculateSkaterFantasyPoints(stats).toFixed(1);
            return `
                <span class="stats-season">${seasonDisplay} Season</span>
                <span class="stats-line">GP: ${stats.gamesPlayed || 0} | G: ${stats.goals || 0} | A: ${stats.assists || 0} | P: ${stats.points || 0}</span>
                <span class="stats-line">+/-: ${stats.plusMinus > 0 ? '+' : ''}${stats.plusMinus || 0} | SOG: ${stats.shots || 0}</span>
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

        const gmsMap = new Map(gms.map(gm => [gm.name, gm]));

        const contractsByGm = contracts.reduce((acc, contract) => {
            const gmName = contract.GM;
            if (!acc[gmName]) {
                acc[gmName] = [];
            }
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

                // Process each contract and fetch stats
                for (const contract of contractsByGm[gmName]) {
                    const playerChip = document.createElement('div');
                    playerChip.className = 'player-chip';

                    // Get NHL stats if player ID exists
                    let statsHtml = '';
                    const nhlId = playerNHLIds[contract.Player];
                    if (nhlId) {
                        const stats = await fetchNHLStats(nhlId);
                        statsHtml = formatStatsHtml(stats, contract.Position);
                    } else {
                        statsHtml = '<span class="no-stats">NHL ID not found</span>';
                    }

                    let stolenBadge = '';
                    if (contract['Stolen?']) {
                        stolenBadge = `<div class="stolen-badge"></div>`;
                    }

                    playerChip.innerHTML = `
                        <div class="player-name">${contract.Player}</div>
                        <div class="player-info">
                            <span class="position-team">${contract.Position} | ${contract.Team} | ${contract['Contract Length']} years</span>
                            <div class="player-stats">
                                ${statsHtml}
                            </div>
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
        console.error('Error fetching data:', error);
    });
});