document.addEventListener('DOMContentLoaded', () => {
    fetch('contracts.json')
        .then(response => response.json())
        .then(data => {
            const container = document.querySelector('.contracts-list');
            const table = document.createElement('table');
            table.classList.add('contracts-table');

            // ... (header creation code remains the same) ...
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const gmHeader = document.createElement('th');
            gmHeader.textContent = 'GM';
            headerRow.appendChild(gmHeader);

            const expiryDates = Object.keys(data.expiring_players);
            expiryDates.forEach(date => {
                const th = document.createElement('th');
                th.textContent = date;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);


            const tbody = document.createElement('tbody');
            const gms = getAllGms(data.expiring_players);

            gms.forEach(gm => {
                const row = document.createElement('tr');
                const gmCell = document.createElement('td');
                gmCell.textContent = gm;
                row.appendChild(gmCell);

                expiryDates.forEach(date => {
                    const cell = document.createElement('td');
                    const players = data.expiring_players[date]
                        .filter(p => p.gm === gm)
                        .map(p => p.player)
                        .join('<br>'); // Use <br> for line breaks

                    cell.innerHTML = players || '—'; // Use innerHTML to render breaks
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);
        })
        .catch(error => console.error('Error loading contract data:', error));
});

function getAllGms(expiringData) {
    const gmSet = new Set();
    for (const year in expiringData) {
        expiringData[year].forEach(player => {
            gmSet.add(player.gm);
        });
    }
    return Array.from(gmSet).sort();
}