// Sidebets Display Page with Filtering
document.addEventListener('DOMContentLoaded', async () => {
    let allSidebets = [];
    let currentStatusFilter = 'all';
    let currentMatchupFilter = 'all';
    let hideNoMatchup = false;

    // Firebase initialization (for admin features)
    let db = null;
    const isAdmin = window.location.search.includes('admin=true'); // Simple admin mode
    
    if (isAdmin) {
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY_HERE", // Replace with your actual API key
            authDomain: "wedding-snipe.firebaseapp.com",
            projectId: "wedding-snipe",
        };
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log('🔧 Admin mode enabled');
    }

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
            option.textContent = matchup;
            matchupDropdown.appendChild(option);
        });
    }

    // Filter and display sidebets
    function displaySidebets() {
        // Apply all filters
        let filteredSidebets = allSidebets.filter(sidebet => {
            // Status filter
            if (currentStatusFilter === 'active' && sidebet.isFulfilled) {
                return false;
            }
            if (currentStatusFilter === 'fulfilled' && !sidebet.isFulfilled) {
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

            // Admin toggle button (only show in admin mode)
            const adminToggle = isAdmin ? `
                <button 
                    class="admin-toggle-btn ${sidebet.isFulfilled ? 'fulfilled' : 'active'}"
                    data-id="${sidebet.id}"
                    data-fulfilled="${sidebet.isFulfilled}"
                    onclick="toggleFulfilled('${sidebet.id}', ${!sidebet.isFulfilled})"
                >
                    ${sidebet.isFulfilled ? '✅ Mark Active' : '✓ Mark Fulfilled'}
                </button>
            ` : '';

            return `
                <div class="sidebet-card ${sidebet.isFulfilled ? 'fulfilled' : ''}">
                    <div class="sidebet-header">
                        <div class="sidebet-meta">
                            <div class="sidebet-author">💡 ${escapeHtml(sidebet.submittedBy)}</div>
                            <div class="sidebet-date">${formattedDate}</div>
                        </div>
                        <span class="sidebet-status ${sidebet.isFulfilled ? 'status-fulfilled' : 'status-active'}">
                            ${sidebet.isFulfilled ? '✅ Fulfilled' : '🎲 Active'}
                        </span>
                    </div>
                    <div class="sidebet-content">
                        ${escapeHtml(sidebet.suggestion)}
                    </div>
                    ${sidebet.targetMatchup ? `
                        <div class="sidebet-week">
                            <span>Target Matchup:</span>
                            <span class="week-badge">
                                ${sidebet.targetMatchup.gm1} vs ${sidebet.targetMatchup.gm2} (Week ${sidebet.targetMatchup.week})
                            </span>
                        </div>
                    ` : ''}
                    ${adminToggle}
                </div>
            `;
        }).join('');

        sidebetsList.innerHTML = html;
    }

    // Toggle fulfilled status (admin only)
    window.toggleFulfilled = async (sidebetId, newStatus) => {
        if (!isAdmin) {
            console.warn('Admin mode not enabled');
            return;
        }

        try {
            const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sidebetId: sidebetId,
                    isFulfilled: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update sidebet');
            }

            // Update local data
            const sidebet = allSidebets.find(s => s.id === sidebetId);
            if (sidebet) {
                sidebet.isFulfilled = newStatus;
            }

            // Refresh display
            displaySidebets();

            console.log('✅ Sidebet updated successfully');

        } catch (error) {
            console.error('Error updating sidebet:', error);
            alert('Failed to update sidebet. Please try again.');
        }
    };

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event listeners for filters
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Update filter
            currentStatusFilter = button.dataset.filter;
            displaySidebets();
        });
    });

    matchupDropdown.addEventListener('change', (e) => {
        currentMatchupFilter = e.target.value;
        displaySidebets();
    });

    hideNoMatchupCheckbox.addEventListener('change', (e) => {
        hideNoMatchup = e.target.checked;
        displaySidebets();
    });

    // Initial load
    await loadSidebets();
});