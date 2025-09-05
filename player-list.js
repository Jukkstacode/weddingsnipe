document.addEventListener('DOMContentLoaded', function() {
    fetch('players.json')
        .then(response => response.json())
        .then(playersData => {
            const container = document.getElementById('list-container');
            if (!container) {
                console.error('List container element not found!');
                return;
            }

            playersData.forEach(player => {
                const playerCard = document.createElement('div');
                // Use the new 'player-card' class to match cards.css
                playerCard.className = 'player-card';

                let statsHtml = '';
                for (const [key, value] of Object.entries(player.stats)) {
                    statsHtml += `<li><strong>${key}:</strong> ${value}</li>`;
                }

                playerCard.innerHTML = `
                    <div class="player-image">
                        <img src="${player.image}" alt="${player.name}">
                    </div>
                    <div class="player-info">
                        <h3>${player.name}</h3>
                        <ul>
                            ${statsHtml}
                        </ul>
                    </div>
                `;
                container.appendChild(playerCard);
            });
        })
        .catch(error => {
            console.error('Error fetching player data:', error);
            const container = document.getElementById('list-container');
            if(container) {
                container.innerHTML = '<p style="color: white; text-align: center;">Could not load player data.</p>';
            }
        });
});