document.addEventListener('DOMContentLoaded', () => {
    const SEASON = '20242025';
    const ENDPOINT_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
    let currentChart = null; 

    const loadChartBtn = document.getElementById('loadChartBtn');
    const playerIdInput = document.getElementById('playerIdInput');
    const playerNameDisplay = document.getElementById('playerName');

    loadChartBtn.addEventListener('click', () => {
        const playerId = playerIdInput.value.trim();
        if (playerId) {
            initialize(playerId);
        } else {
            alert('Please enter a valid Player ID.');
        }
    });
    
    // This function now calls YOUR endpoint

    async function fetchPlayerGameLog(playerId, season) {
        const apiUrl = `${ENDPOINT_URL}?requestType=gameLog&playerIds=${playerId}&season=${season}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Your endpoint responded with status: ${response.status}`);
            }
            const data = await response.json();
            
            // --- THIS IS THE FIX ---
            // The API returns an object with a "gameLog" property, which is the array we need.
            // We now correctly return that array.
            return data.gameLog; 
        } catch (error) {
            console.error("Failed to fetch player game log:", error);
            return []; // Return an empty array on error
        }
    }
    
    // No changes needed for the functions below this line
    // ... (fetchPlayerLanding, processDataForChart, createGoalsChart, initialize)

    async function fetchPlayerLanding(playerId) {
         // This can still call the NHL API directly as it's just for display name
         // and isn't the core data. Or we could build this into the endpoint too.
         // For now, let's proxy it through a free CORS proxy to be safe.
         const apiUrl = `https://api-web.nhle.com/v1/player/${playerId}/landing`;
         const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
         try {
            const response = await fetch(proxyUrl);
            if (!response.ok) return 'Player';
            const data = await response.json();
            return `${data.firstName.default} ${data.lastName.default}`;
         } catch (e) {
            return 'Player';
         }
    }
    
    function processDataForChart(gameLog) {
        const labels = [];
        const goals = [];

        if (!gameLog) return { labels, goals };
        
        gameLog.slice().reverse().forEach(game => {
            labels.push(game.gameDate);
            goals.push(game.goals);
        });

        return { labels, goals };
    }

    function createGoalsChart(chartData) {
        const ctx = document.getElementById('goalsChart').getContext('2d');
        
        if (currentChart) {
            currentChart.destroy();
        }
        
        currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Goals',
                    data: chartData.goals,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
             options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#e8e8e8', stepSize: 1 },
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

    async function initialize(playerId) {
        const [gameLog, playerName] = await Promise.all([
            fetchPlayerGameLog(playerId, SEASON),
            fetchPlayerLanding(playerId)
        ]);

        playerNameDisplay.textContent = playerName;
        const container = document.querySelector('.chart-container');
        const canvas = document.getElementById('goalsChart');

        if (gameLog && gameLog.length > 0) {
             canvas.style.display = 'block';
             if (container.querySelector('p')) {
                container.querySelector('p').remove();
             }
            const chartData = processDataForChart(gameLog);
            createGoalsChart(chartData);
        } else {
            if (currentChart) currentChart.destroy();
            canvas.style.display = 'none';
            if (container.querySelector('p')) {
                container.querySelector('p').remove();
             }
            const message = document.createElement('p');
            message.textContent = `No game data available for player ID ${playerId} for the 2024-2025 season yet.`;
            container.appendChild(message);
        }
    }
});