document.addEventListener('DOMContentLoaded', function() {
    // Fetch both player and GM data
    Promise.all([
        fetch('players.json').then(response => response.json()),
        fetch('gm.json').then(response => response.json())
    ]).then(([players, gms]) => {
        const container = document.getElementById('card-container');
        if (!container) {
            console.error('Card container element not found!');
            return;
        }

        // Assuming a 1-to-1 mapping between GMs and players
        players.forEach((player, index) => {
            const gm = gms[index]; // Get the corresponding GM
            const card = document.createElement('div');
            card.className = 'card';

            let statsHtml = '';
            for (const [key, value] of Object.entries(player.stats)) {
                statsHtml += `<li><strong>${key}:</strong> ${value}</li>`;
            }

            // Check if the player has a phone number and add it to the HTML
            let phoneHtml = '';
            if (player.phone) {
                phoneHtml = `<p><strong>Phone:</strong> ${player.phone}</p>`;
            }

            let oddsHtml = '';
            if (gm.bimmbetOdds) {
                oddsHtml = `<div class="odds-container">
                                <p>Andy Snipe Odds</p>
                                <p>${gm.bimmbetOdds}</p>
                            </div>`;
            }

            // Dynamically add the GM's image to the front of the card
            const cardFrontContent = `<img src="${gm.image}" alt="${gm.name}" style="width:100%; height:100%; object-fit: cover; border-radius: 15px;">${oddsHtml}`;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        ${cardFrontContent}
                    </div>
                    <div class="card-back" style="background-image: url('${player.image}')">
                        <h2>${player.name}</h2>
                        <p>2024 Season Stats:</p>
                        <ul>
                            ${statsHtml}
                        </ul>
                        ${phoneHtml}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Add click event listener to each card to toggle the flip
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const cardInner = card.querySelector('.card-inner');
                if (cardInner.style.transform === 'rotateY(180deg)') {
                    cardInner.style.transform = '';
                } else {
                    cardInner.style.transform = 'rotateY(180deg)';
                }
            });
        });

    }).catch(error => {
        console.error('Error fetching data:', error);
        const container = document.getElementById('card-container');
        if(container) {
            container.innerHTML = '<p style="color: white; text-align: center;">Could not load data.</p>';
        }
    });
});