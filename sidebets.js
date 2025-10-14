// Sidebets Display Page with Filtering
document.addEventListener('DOMContentLoaded', async () => {
    let allSidebets = [];
    let currentStatusFilter = 'all';
    let currentMatchupFilter = 'all';
    let hideNoMatchup = false;

    // Firebase initialization (needed to fetch matchups)
    let db = null;
    const isAdmin = window.location.search.includes('admin=true'); // Simple admin mode
    
    const firebaseConfig = {
        apiKey: "AIzaSyDtbnBa_wok-tRS-A2xraRBMJE8oM5Hc6c",
        authDomain: "wedding-snipe.firebaseapp.com",
        projectId: "wedding-snipe",
        storageBucket: "wedding-snipe.firebasestorage.app",
        messagingSenderId: "347732622266",
        appId: "1:347732622266:web:db85733e367e9c2ae37b83"
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    
    if (isAdmin) {
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
            
            // Populate matchup filter dropdown from Firestore (ALL matchups)
            await populateMatchupFilter();
            
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

    // NEW: Populate matchup dropdown from Firestore (ALL matchups, not just those with sidebets)
    async function populateMatchupFilter() {
        try {
            console.log('📡 Loading all matchups for dropdown...');
            
            // Get all matchup documents from Firestore
            const snapshot = await db.collection('matchups').get();
            
            if (snapshot.empty) {
                console.warn('No matchups found in Firestore');
                return;
            }
            
            // Group matchups by week
            const matchupsByWeek = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const weekNumber = data.week;
                
                if (!matchupsByWeek[weekNumber]) {
                    matchupsByWeek[weekNumber] = [];
                }
                
                matchupsByWeek[weekNumber].push({
                    gm1: data.gm1,
                    gm2: data.gm2,
                    week: weekNumber,
                    matchupIndex: data.matchupIndex
                });
            });
            
            // Sort weeks numerically and add to dropdown
            const sortedWeeks = Object.keys(matchupsByWeek).sort((a, b) => Number(a) - Number(b));
            
            sortedWeeks.forEach(weekNum => {
                // Sort matchups within each week by index
                const weekMatchups = matchupsByWeek[weekNum].sort((a, b) => a.matchupIndex - b.matchupIndex);
                
                weekMatchups.forEach(matchup => {
                    const option = document.createElement('option');
                    // Create matchup key for filtering
                    const matchupKey = `${matchup.gm1} vs ${matchup.gm2} (Week ${weekNum})`;
                    option.value = matchupKey;
                    option.textContent = matchupKey;
                    matchupDropdown.appendChild(option);
                });
            });
            
            console.log('✅ Matchup dropdown populated with all matchups');
            
        } catch (error) {
            console.error('Error loading matchups for dropdown:', error);
        }
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

            // Determine if this sidebet has a target matchup
const matchupText = sidebet.targetMatchup 
    ? `<div class="sidebet-matchup">🎯 ${sidebet.targetMatchup.gm1} vs ${sidebet.targetMatchup.gm2} (Week ${sidebet.targetMatchup.week})</div>`
    : '';

            // Admin toggle button (only show in admin mode)
            const adminToggle = isAdmin ? `
                <button 
                    class="admin-toggle-btn ${sidebet.isFulfilled ? 'fulfilled' : 'active'}"
                    data-id="${sidebet.id}"
                    data-fulfilled="${sidebet.isFulfilled}"
                    onclick="toggleFulfilled('${sidebet.id}', ${!sidebet.isFulfilled})"
                >
                    ${sidebet.isFulfilled ? '✅ Mark Active' : '🏆 Mark Fulfilled'}
                </button>
            ` : '';

            return `
                <div class="sidebet-card" data-fulfilled="${sidebet.isFulfilled}">
                    <div class="sidebet-header">
                        <div class="sidebet-meta">
                            <div class="sidebet-author">${escapeHtml(sidebet.submittedBy)}</div>
                            <div class="sidebet-date">${formattedDate}</div>
                        </div>
                        <span class="sidebet-status ${sidebet.isFulfilled ? 'fulfilled' : 'active'}">
                            ${sidebet.isFulfilled ? '✅ Fulfilled' : '🎲 Active'}
                        </span>
                    </div>
                    ${matchupText}
                    <div class="sidebet-suggestion">${escapeHtml(sidebet.suggestion)}</div>
                    ${adminToggle}
                </div>
            `;
        }).join('');

        sidebetsList.innerHTML = html;
    }

    // Admin function to toggle fulfilled status
    window.toggleFulfilled = async (sidebetId, newFulfilledStatus) => {
        if (!isAdmin) {
            alert('Admin access required');
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
                    isFulfilled: newFulfilledStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update sidebet');
            }

            // Reload sidebets
            await loadSidebets();

            console.log(`✅ Sidebet ${sidebetId} marked as ${newFulfilledStatus ? 'fulfilled' : 'active'}`);
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