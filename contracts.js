document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetch('contracts.json').then(response => response.json()),
        fetch('gm.json').then(response => response.json())
    ]).then(([contracts, gms]) => {
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

                contractsByGm[gmName].forEach(contract => {
                    const playerChip = document.createElement('div');
                    playerChip.className = 'player-chip';

                    let stolenBadge = '';
                    if (contract['Stolen?']) {
                        stolenBadge = `<div class="stolen-badge"></div>`;
                    }

                    playerChip.innerHTML = `
                        ${contract.Player}
                        <span class="player-info">
                            ${contract.Position} </br> ${contract.Team} </br> ${contract['Contract Length']} years
                        </span>
                        ${stolenBadge}
                    `;
                    playersDiv.appendChild(playerChip);
                });

                gmDiv.appendChild(photoDiv);
                gmDiv.appendChild(playersDiv);
                container.appendChild(gmDiv);
            }
        }
    }).catch(error => {
        console.error('Error fetching data:', error);
    });
});