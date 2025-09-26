document.addEventListener('DOMContentLoaded', async () => {
    const SEASON = '20242025';
    const ENDPOINT_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
    let currentChart = null;

    // --- SCORING LOGIC (from contracts.js) ---
    const FANTASY_SCORING = {
        goals: 3, assists: 2, plusMinus: 1, pim: 0.25, powerPlayPoints: 1, shortHandedPoints: 1, gameWinningGoals: 1.5,
        wins: 3, goalsAgainst: -1.5, saves: 0.2, shutouts: 6
    };

    // --- CORRECTED PER-GAME CALCULATION FUNCTIONS ---
    function calculateFantasyPointsForSkaterGame(game) {
        if (!game) return 0;
        
        // Calculate combined points from their components, which are in the game log
        const calculatedPowerPlayPoints = (game.powerPlayPoints || 0);
        const calculatedShorthandedPoints = (game.shorthandedGoals || 0) + (game.shorthandedAssists || 0);

        const { goals = 0, assists = 0, plusMinus = 0, pim = 0, gameWinningGoal = 0 } = game;

        return (goals * FANTASY_SCORING.goals) +
               (assists * FANTASY_SCORING.assists) +
               (plusMinus * FANTASY_SCORING.plusMinus) +
               (pim * FANTASY_SCORING.pim) +
               (calculatedPowerPlayPoints * FANTASY_SCORING.powerPlayPoints) +
               (calculatedShorthandedPoints * FANTASY_SCORING.shortHandedPoints) +
               (gameWinningGoal * FANTASY_SCORING.gameWinningGoals);
    }

    function calculateFantasyPointsForGoalieGame(game) {
        if (!game) return 0;
        const { decision, saves = 0, goalsAgainst = 0 } = game;
        let points = 0;

        if (decision === 'W') {
            points += FANTASY_SCORING.wins;
        }
        
        points += (saves * FANTASY_SCORING.saves);
        points += (goalsAgainst * FANTASY_SCORING.goalsAgainst);
        
        // A shutout is awarded for 0 goals against, regardless of win/loss decision.
        if (goalsAgainst === 0) {
            points += FANTASY_SCORING.shutouts;
        }
        return points;
    }


    const chartColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#E7E9ED', '#8D5B4C', '#D64541', '#8E44AD', '#27AE60', '#F39C12'
    ];

    async function fetchPlayerGameLog(playerId, season) {
        const apiUrl = `${ENDPOINT_URL}?requestType=gameLog&playerIds=${playerId}&season=${season}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error(`Endpoint responded with status: ${response.status} for player ${playerId}`);
                return [];
            }
            const data = await response.json();
            return data.gameLog || [];
        } catch (error) {
            console.error(`Failed to fetch player game log for ${playerId}:`, error);
            return [];
        }
    }

    function processGameLogForChart(gameLog, position) {
        const labels = [];
        const cumulativeFantasyPointsData = [];
        let cumulativeFantasyPoints = 0;
        
        if (!gameLog || gameLog.length === 0) return { labels, data: [] };
        
        const sortedGameLog = gameLog.slice().sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

        sortedGameLog.forEach(game => {
            labels.push(game.gameDate);
            let gamePoints = 0;
            if (position.includes('G')) {
                gamePoints = calculateFantasyPointsForGoalieGame(game);
            } else {
                gamePoints = calculateFantasyPointsForSkaterGame(game);
            }
            cumulativeFantasyPoints += gamePoints;
            // Round to 2 decimal places to avoid floating point issues
            cumulativeFantasyPointsData.push(parseFloat(cumulativeFantasyPoints.toFixed(2)));
        });

        return { labels, data: cumulativeFantasyPointsData };
    }
    
    function createOrUpdateChart(datasets) {
        const ctx = document.getElementById('goalsChart').getContext('2d');
        if (currentChart) {
            currentChart.destroy();
        }

        const allLabels = datasets.map(d => d.labels).flat();
        const masterXAxisLabels = [...new Set(allLabels)].sort((a, b) => new Date(a) - new Date(b));

        const processedDatasets = datasets.map((playerData, index) => {
            const dataMap = new Map(playerData.labels.map((label, i) => [label, playerData.data[i]]));
            let lastValue = 0;
            const fullData = masterXAxisLabels.map(date => {
                if (dataMap.has(date)) {
                    lastValue = dataMap.get(date);
                }
                return lastValue;
            });

            return {
                label: playerData.playerName,
                data: fullData,
                borderColor: chartColors[index % chartColors.length],
                backgroundColor: chartColors[index % chartColors.length] + '33',
                fill: false,
                tension: 0.1,
                pointRadius: 2,
            };
        });

        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: masterXAxisLabels,
                datasets: processedDatasets
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
                        ticks: { color: '#e8e8e8' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#e8e8e8' } }
                }
            }
        });
    }

    async function initialize() {
        const response = await fetch('../contracts.json');
        const contracts = await response.json();
        const selectionListDiv = document.getElementById('player-selection-list');
        
        contracts
            .filter(c => c.nhlId) 
            .sort((a,b) => a.Player.localeCompare(b.Player))
            .forEach(player => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'player-item';
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = player.nhlId;
                checkbox.dataset.name = player.Player;
                checkbox.dataset.position = player.Position;
                checkbox.id = `player-${player.nhlId}`;
                label.htmlFor = checkbox.id;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(`${player.Player} (${player.Position})`));
                itemDiv.appendChild(label);
                selectionListDiv.appendChild(itemDiv);
            });

        document.getElementById('updateChartBtn').addEventListener('click', async () => {
            const selectedPlayers = [];
            document.querySelectorAll('#player-selection-list input:checked').forEach(checkbox => {
                selectedPlayers.push({
                    id: checkbox.value,
                    name: checkbox.dataset.name,
                    position: checkbox.dataset.position
                });
            });

            if (selectedPlayers.length === 0) {
                alert('Please select at least one player.');
                return;
            }

            const datasets = [];
            for (const player of selectedPlayers) {
                const gameLog = await fetchPlayerGameLog(player.id, SEASON);
                const processedData = processGameLogForChart(gameLog, player.position);
                datasets.push({
                    playerName: player.name,
                    labels: processedData.labels,
                    data: processedData.data
                });
            }
            createOrUpdateChart(datasets);
        });
    }

    initialize();
});