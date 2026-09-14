document.addEventListener('DOMContentLoaded', async () => {
    const ENDPOINT_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
    const CURRENT_SEASON_END_YEAR = 2026;

    const FANTASY_SCORING = {
        goals: 3, assists: 2, plusMinus: 1, pim: 0.25, powerPlayPoints: 1, shortHandedPoints: 1, gameWinningGoals: 1.5,
        wins: 3, goalsAgainst: -1.5, saves: 0.2, shutouts: 6
    };

    function calculateFantasyPointsForSkaterGame(game) {
        if (!game || game.toi === "00:00") return 0;
        const ppp = game.powerPlayPoints || 0;
        const shp = game.shorthandedPoints || 0;
        const { goals = 0, assists = 0, plusMinus = 0, pim = 0, gameWinningGoals = 0 } = game;
        return (goals * FANTASY_SCORING.goals) +
               (assists * FANTASY_SCORING.assists) +
               (plusMinus * FANTASY_SCORING.plusMinus) +
               (pim * FANTASY_SCORING.pim) +
               (ppp * FANTASY_SCORING.powerPlayPoints) +
               (shp * FANTASY_SCORING.shortHandedPoints) +
               (gameWinningGoals * FANTASY_SCORING.gameWinningGoals);
    }

    function calculateFantasyPointsForGoalieGame(game) {
        if (!game || game.toi === "00:00") return 0;
        const { decision, shotsAgainst = 0, goalsAgainst = 0, shutouts = 0 } = game;
        const calculatedSaves = shotsAgainst - goalsAgainst;
        let points = 0;
        if (decision === 'W') points += FANTASY_SCORING.wins;
        points += (calculatedSaves * FANTASY_SCORING.saves);
        points += (goalsAgainst * FANTASY_SCORING.goalsAgainst);
        points += (shutouts * FANTASY_SCORING.shutouts);
        return points;
    }

    async function fetchPlayerGameLog(playerId, season) {
        const apiUrl = `${ENDPOINT_URL}?requestType=gameLog&playerIds=${playerId}&season=${season}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) return [];
            const data = await response.json();
            return data.gameLog || [];
        } catch (error) {
            console.error(`Failed to fetch game log for season ${season}:`, error);
            return [];
        }
    }

    function getSeasonsFromDate(snipeDate) {
        const d = new Date(snipeDate + 'T00:00:00');
        // If snipe is Oct or later, the first relevant season starts that year.
        // If snipe is before Oct (off-season), the next season starts that fall.
        const startYear = d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear();
        const seasons = [];
        for (let y = startYear; y < CURRENT_SEASON_END_YEAR; y++) {
            seasons.push(`${y}${y + 1}`);
        }
        return seasons;
    }

    function formatSnipeDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const nhlId = params.get('nhlId');
    const playerName = params.get('name');
    const position = params.get('position');
    const snipeDate = params.get('snipeDate');

    if (!nhlId || !playerName || !snipeDate) {
        document.getElementById('loadingState').textContent = 'Missing player data. Go back and click a snipe card.';
        return;
    }

    // Populate header
    document.getElementById('playerName').textContent = playerName;
    document.getElementById('snipeContext').textContent = `Stolen on ${formatSnipeDate(snipeDate)}`;
    document.title = `${playerName} - Snipe Over Time`;

    const isGoalie = position.includes('G');
    const seasons = getSeasonsFromDate(snipeDate);

    // Fetch all seasons in parallel
    const allGameLogs = await Promise.all(
        seasons.map(season => fetchPlayerGameLog(nhlId, season))
    );

    // Concatenate, sort, and filter games on/after snipe date
    const allGames = allGameLogs.flat()
        .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate))
        .filter(game => game.gameDate >= snipeDate);

    if (allGames.length === 0) {
        document.getElementById('loadingState').textContent = 'No games found since the snipe date.';
        return;
    }

    // Build cumulative data
    const labels = [];
    const cumulativeData = [];
    let cumulative = 0;

    allGames.forEach(game => {
        const pts = isGoalie
            ? calculateFantasyPointsForGoalieGame(game)
            : calculateFantasyPointsForSkaterGame(game);
        cumulative += pts;
        labels.push(game.gameDate);
        cumulativeData.push(parseFloat(cumulative.toFixed(2)));
    });

    const totalFP = cumulativeData[cumulativeData.length - 1];

    // Show total stat
    const statBox = document.getElementById('statBox');
    document.getElementById('totalFP').textContent = totalFP.toFixed(1);
    document.getElementById('totalGames').textContent = allGames.length;
    document.getElementById('avgFPG').textContent = (totalFP / allGames.length).toFixed(2);
    statBox.style.display = 'block';

    // Hide loading
    document.getElementById('loadingState').classList.add('hidden');

    // Render chart
    const ctx = document.getElementById('snipeChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: playerName,
                data: cumulativeData,
                borderColor: '#4a9eff',
                backgroundColor: 'rgba(74, 158, 255, 0.1)',
                fill: true,
                tension: 0.1,
                pointRadius: 3,
                pointBackgroundColor: '#4a9eff',
                pointBorderColor: '#4a9eff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Cumulative Fantasy Points', color: '#e8e8e8' },
                    ticks: { color: '#e8e8e8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    title: { display: true, text: 'Game Date', color: '#e8e8e8' },
                    ticks: {
                        color: '#e8e8e8',
                        maxTicksLimit: 15,
                        maxRotation: 45
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const idx = items[0].dataIndex;
                            return labels[idx];
                        },
                        label: (item) => `${item.parsed.y.toFixed(1)} FP`
                    }
                }
            }
        }
    });
});
