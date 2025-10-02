document.addEventListener('DOMContentLoaded', function() {
    let allMatchupsData = []; // Store all matchups for filtering
    let gmMap = new Map();
    let currentGMFilter = 'all';
    let currentSpicyFilter = false;
    
    // Fetch both matchup data and GM data
    Promise.all([
        fetch('schedule/matchups.json').then(response => response.json()),
        fetch('gm.json').then(response => response.json())
    ]).then(([matchupsData, gms]) => {
        // Store data globally
        allMatchupsData = matchupsData;
        gmMap = new Map(gms.map(gm => [gm.name, gm.image]));
        
        // Populate the GM filter dropdown
        populateGMFilter(matchupsData);
        
        // Display all matchups initially
        displayMatchups(matchupsData);
        
        // Set up GM filter event listener
        const gmFilterSelect = document.getElementById('gm-filter');
        gmFilterSelect.addEventListener('change', function() {
            currentGMFilter = this.value;
            applyFilters();
        });
        
        // Set up Spicy filter event listener
        const spicyCheckbox = document.getElementById('spicy-filter');
        spicyCheckbox.addEventListener('change', function() {
            currentSpicyFilter = this.checked;
            applyFilters();
        });
        
    }).catch(error => {
        console.error('Error fetching data:', error);
        document.getElementById('schedule-container').innerHTML = 
            '<p style="color: red; text-align: center;">Failed to load schedule data.</p>';
    });
    
    // Populate the GM filter dropdown with all unique GMs
    function populateGMFilter(matchupsData) {
        const gmSet = new Set();
        
        // Collect all unique GM names
        matchupsData.forEach(week => {
            week.Matchups.forEach(matchup => {
                gmSet.add(matchup.GM1);
                gmSet.add(matchup.GM2);
            });
        });
        
        // Sort GMs alphabetically
        const sortedGMs = Array.from(gmSet).sort();
        
        // Add them to the dropdown
        const filterSelect = document.getElementById('gm-filter');
        sortedGMs.forEach(gm => {
            const option = document.createElement('option');
            option.value = gm;
            option.textContent = gm;
            filterSelect.appendChild(option);
        });
    }
    
    // Apply both filters together
    function applyFilters() {
        let filteredData = allMatchupsData.map(week => {
            let matchups = week.Matchups;
            
            // Apply GM filter
            if (currentGMFilter !== 'all') {
                matchups = matchups.filter(matchup => 
                    matchup.GM1 === currentGMFilter || matchup.GM2 === currentGMFilter
                );
            }
            
            // Apply Spicy filter
            if (currentSpicyFilter) {
                matchups = matchups.filter(matchup => matchup.isSpecial === true);
            }
            
            return {
                Week: week.Week,
                Matchups: matchups,
                hasMatchups: matchups.length > 0
            };
        });
        
        displayMatchups(filteredData);
    }
    
    // Display matchups on the page
    function displayMatchups(matchupsData) {
        const container = document.getElementById('schedule-container');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        matchupsData.forEach(week => {
            // Create container for the week
            const weekContainer = document.createElement('div');
            weekContainer.className = 'week-container';
            
            const weekTitle = document.createElement('h2');
            weekTitle.textContent = `Week ${week.Week}`;
            weekContainer.appendChild(weekTitle);

            const matchupsList = document.createElement('div');
            matchupsList.className = 'matchups-list';

            // Check if there are matchups to display
            if (week.Matchups.length === 0) {
                // Show "No spicy matchups" message
                const noMatchupsDiv = document.createElement('div');
                noMatchupsDiv.className = 'no-matchups-message';
                noMatchupsDiv.textContent = currentSpicyFilter ? 
                    '🌶️ No spicy matchups this week' : 
                    'No matchups found';
                matchupsList.appendChild(noMatchupsDiv);
            } else {
                // Display matchups
                week.Matchups.forEach(matchup => {
                    const gm1Name = matchup.GM1;
                    const gm2Name = matchup.GM2;
                    const isSpecial = matchup.isSpecial;
                    
                    // Get image paths, use placeholder if not found
                    const gm1Image = gmMap.get(gm1Name) || 'assets/placeholder.jpg';
                    const gm2Image = gmMap.get(gm2Name) || 'assets/placeholder.jpg';

                    const matchupDiv = document.createElement('div');
                    matchupDiv.className = 'matchup-item';
                    
                    // Add special styling if needed
                    if (isSpecial) {
                        matchupDiv.classList.add('on-fire'); 
                    }
                    
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
            }

            weekContainer.appendChild(matchupsList);
            container.appendChild(weekContainer);
        });
    }
});