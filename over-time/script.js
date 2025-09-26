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
    
    async function fetchPlayerGameLog(playerId, season) {
        const apiUrl = `${ENDPOINT_URL}?requestType=gameLog&playerIds=${playerId}&season=${season}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Your endpoint responded with status: ${response.status}`);
            }
            const data = await response.json();
            
            return data.gameLog; 
        } catch (error) {
            console.error("Failed to fetch player game log:", error);
            return [];
        }
    }
    
    async function fetchPlayerLanding(playerId) {
         const apiUrl = `${ENDPOINT_URL}?requestType=playerName&playerIds=${playerId}`;
         try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                return 'Player'; // Return default name on error
            }
            const data = await response.json();
            return data.fullName; // Directly return the full name from our endpoint's response
         } catch (e) {
            console.error("Failed to fetch player name:", e);
            return 'Player';
         }
    }
    
    // *** UPDATED: This function now calculates a running total ***
    function processDataForChart(gameLog) {
        const labels = [];
        const cumulativeGoalsData = [];
        let cumulativeGoals = 0; // Start a running total at 0

        if (!gameLog) return { labels, cumulativeGoalsData };
        
        // Loop through games in chronological order
        gameLog.slice().reverse().forEach(game => {
            labels.push(game.gameDate);
            cumulativeGoals += game.goals; // Add this game's goals to the total
            cumulativeGoalsData.push(cumulativeGoals); // Push the new total to our data array
        });

        return { labels, cumulativeGoalsData };
    }

    // *** UPDATED: This function now creates a LINE chart ***
    function createGoalsChart(chartData) {
        const ctx = document.getElementById('goalsChart').getContext('2d');
        
        if (currentChart) {
            currentChart.destroy();
        }
        
        currentChart = new Chart(ctx, {
            type: 'line', // Changed from 'bar' to 'line'
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Cumulative Goals', // Updated label
                    data: chartData.cumulativeGoalsData, // Use the new cumulative data
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    fill: true, // Fills the area under the line
                    tension: 0.1 // Makes the line slightly curved
                }]
            },
             options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#e8e8e8' }, // Removed stepSize to be automatic
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