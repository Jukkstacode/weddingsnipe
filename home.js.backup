// home.js
document.addEventListener('DOMContentLoaded', function() {
    const gridContainer = document.getElementById('gm-teams-grid');
    
    // Fetch GM data and build the team links
    fetch('gm.json')
        .then(response => response.json())
        .then(gms => {
            // Generate a card for each GM
            gms.forEach(gm => {
                const card = createGMCard(gm);
                gridContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error loading GM data:', error);
            gridContainer.innerHTML = '<p style="color: red; text-align: center;">Failed to load GM teams.</p>';
        });
});

/**
 * Creates a GM card element
 * @param {Object} gm - GM object from gm.json
 * @returns {HTMLElement} - The complete GM card as a link
 */
function createGMCard(gm) {
    // Create the main link element
    const card = document.createElement('a');
    card.href = gm.teamUrl;
    card.className = 'gm-card';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    
    // Create and add the GM photo
    const photo = document.createElement('img');
    photo.src = gm.image;
    photo.alt = gm.name;
    photo.className = 'gm-photo';
    
    // Create and add the GM name
    const name = document.createElement('span');
    name.className = 'gm-name';
    name.textContent = `${gm.name}'s Team`;
    
    // Append elements to the card
    card.appendChild(photo);
    card.appendChild(name);
    
    return card;
}