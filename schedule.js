document.addEventListener('DOMContentLoaded', function() {
    // Fetch both matchup data and GM data
    Promise.all([
        fetch('schedule/matchups.json').then(response => response.json()),
        fetch('gm.json').then(response => response.json())
    ]).then(([matchupsData, gms]) => {
        const container = document.getElementById('schedule-container');
        if (!container) return;

        // Create a map for easy GM lookup
        const gmMap = new Map(gms.map(gm => [gm.name, gm.image]));

        matchupsData.forEach(week => {
            // Create container for the week
            const weekContainer = document.createElement('div');
            weekContainer.className = 'week-container';
            
            const weekTitle = document.createElement('h2');
            weekTitle.textContent = `Week ${week.Week}`;
            weekContainer.appendChild(weekTitle);

            const matchupsList = document.createElement('div');
            matchupsList.className = 'matchups-list';

            week.Matchups.forEach(matchup => {
                const gm1Name = matchup.GM1;
                const gm2Name = matchup.GM2;
                
                // Get image paths, use placeholder if not found
                const gm1Image = gmMap.get(gm1Name) || 'assets/placeholder.jpg';
                const gm2Image = gmMap.get(gm2Name) || 'assets/placeholder.jpg';

                const matchupDiv = document.createElement('div');
                matchupDiv.className = 'matchup-item';
                
                matchupDiv.innerHTML = `
                    <div class="gm-matchup-container gm1">
                        <img src="${gm1Image}" alt="${gm1Name}" class="gm-photo-matchup">
                        <span class="gm-name">${gm1Name}</span>
                    </div>
                    <span class="vs-label">vs</span>
                    <div class="gm-matchup-container gm2">
                        <img src="${gm2Image}" alt="${gm2Name}" class="gm-photo-matchup">
                        <span class="gm-name">${gm2Name}</span>
                    </div>
                `;
                matchupsList.appendChild(matchupDiv);
            });

            weekContainer.appendChild(matchupsList);
            container.appendChild(weekContainer);
        });
    }).catch(error => {
        console.error('Error fetching data:', error);
        document.getElementById('schedule-container').innerHTML = '<p style="color: red; text-align: center;">Failed to load schedule data.</p>';
    });
});