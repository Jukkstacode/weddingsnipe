// Sidebets Display Page with Filtering
document.addEventListener('DOMContentLoaded', async () => {
    let allSidebets = [];
    let currentStatusFilter = 'all';
    let currentMatchupFilter = 'all';
    let hideNoMatchup = false;

    // Get elements
    const sidebetsList = document.getElementById('sidebets-list');
    const noResults = document.getElementById('noResults');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const matchupDropdown = document.getElementById('matchupFilter');
    const hideNoMatchupCheckbox = document.getElementById('hideNoMatchup');

    // Load sidebets from the API
    async function loadSidebets() {
        try {
            const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app?requestType=sidebets');
            
            if (!response.ok) {
                throw new Error('Failed to fetch sidebets');
            }

            allSidebets = await response.json();
            
            // Populate matchup filter dropdown
            populateMatchupFilter();
            
            // Display sidebets
            displaySidebets();

        } catch (error) {
            console.error('Error loading sidebets:', error);
            sidebetsList.innerHTML = `
                <div class="loading" style="color: red;">
                    ⚠️ Error loading sidebets. Please try again later.
                </div>
            `;
        }
    }

    // Populate matchup dropdown with unique matchups
    function populateMatchupFilter() {
        const matchups = new Set();
        
        allSidebets.forEach(sidebet => {
            if (sidebet.targetMatchup) {
                const matchupKey = `${sidebet.targetMatchup.gm1} vs ${sidebet.targetMatchup.gm2} (Week ${sidebet.targetMatchup.week})`;
                matchups.add(matchupKey);
            }
        });

        // Add matchups to dropdown in sorted order
        Array.from(matchups).sort().forEach(matchup => {
            const option = document.createElement('option');
            option.value = matchup;
            option.textContent = matchup + ' 🔥';
            matchupDropdown.appendChild(option);
        });
    }

    // Filter and display sidebets
    function displaySidebets() {
        // Apply all filters
        let filteredSidebets = allSidebets.filter(sidebet => {
            // Status filter
            if (currentStatusFilter !== 'all' && sidebet.status !== currentStatusFilter) {
                return false;
            }

            // Matchup filter
            if (currentMatchupFilter !== 'all') {
                if (!sidebet.targetMatchup) {
                    return false;
                }
                const matchupKey = `${sidebet.targetMatchup.gm1} vs ${sidebet.targetMatchup.gm2} (Week ${sidebet.targetMatchup.week})`;
                if (matchupKey !== currentMatchupFilter) {
                    return false;
                }
            }

            // Hide no matchup filter
            if (hideNoMatchup && !sidebet.targetMatchup) {
                return false;
            }

            return true;
        });

        // Show/hide no results message
        if (filteredSidebets.length === 0) {
            sidebetsList.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        sidebetsList.style.display = 'grid';
        noResults.style.display = 'none';

        // Build HTML for sidebets
        const html = filteredSidebets.map(sidebet => {
            const date = new Date(sidebet.submittedAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
                <div class="sidebet-card">
                    <div class="sidebet-header">
                        <div class="sidebet-meta">
                            <div class="sidebet-author">💡 ${escapeHtml(sidebet.submittedBy)}</div>
                            <div class="sidebet-date">${formattedDate}</div>
                        </div>
                        <span class="sidebet-status status-${sidebet.status}">
                            ${sidebet.status}
                        </span>
                    </div>
                    <div class="sidebet-content">
                        ${escapeHtml(sidebet.suggestion)}
                    </div>
                    ${sidebet.targetMatchup ? `
                        <div class="sidebet-week">
                            <span>Target:</span>
                            <span class="week-badge">${sidebet.targetMatchup.gm1} vs ${sidebet.targetMatchup.gm2} (Week ${sidebet.targetMatchup.week}) 🔥</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        sidebetsList.innerHTML = html;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle status filter button clicks
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter and redisplay
            currentStatusFilter = button.dataset.filter;
            displaySidebets();
        });
    });

    // Handle matchup dropdown change
    matchupDropdown.addEventListener('change', (e) => {
        currentMatchupFilter = e.target.value;
        displaySidebets();
    });

    // Handle hide no matchup checkbox
    hideNoMatchupCheckbox.addEventListener('change', (e) => {
        hideNoMatchup = e.target.checked;
        displaySidebets();
    });

    // Load sidebets on page load
    await loadSidebets();
});