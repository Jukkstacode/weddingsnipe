// schedule.js - Updated to fetch from Firestore and handle sidebet assignments
document.addEventListener('DOMContentLoaded', async function() {
    let allMatchupsData = []; // Store all matchups for filtering
    let gmMap = new Map();
    let currentGMFilter = 'all';
    let currentSpicyFilter = false;
    
    // Initialize Firebase (using the existing configuration)
    const firebaseConfig = {
        apiKey: "AIzaSyDtbnBa_wok-tRS-A2xraRBMJE8oM5Hc6c",
        authDomain: "wedding-snipe.firebaseapp.com",
        projectId: "wedding-snipe",
        storageBucket: "wedding-snipe.firebasestorage.app",
        messagingSenderId: "347732622266",
        appId: "1:347732622266:web:db85733e367e9c2ae37b83"
    };
        
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const db = firebase.firestore();
    
    try {
        // Fetch both matchup data from Firestore and GM data from JSON
        const [matchupsData, gms] = await Promise.all([
            fetchMatchupsFromFirestore(),
            fetch('gm.json').then(response => response.json())
        ]);
        
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
        
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('schedule-container').innerHTML = 
            '<p style="color: red; text-align: center;">Failed to load schedule data.</p>';
    }
    
    // Fetch matchups from Firestore
    async function fetchMatchupsFromFirestore() {
        console.log('📡 Fetching matchups from Firestore...');
        
        try {
            // Get all matchup documents from Firestore
            const snapshot = await db.collection('matchups').get();
            
            if (snapshot.empty) {
                console.warn('No matchups found in Firestore');
                return [];
            }
            
            // Convert Firestore documents to the format schedule.js expects
            const matchupsByWeek = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const weekNumber = data.week;
                
                // Initialize week array if it doesn't exist
                if (!matchupsByWeek[weekNumber]) {
                    matchupsByWeek[weekNumber] = [];
                }
                
                // Add matchup in the old format (GM1, GM2) with new assignedSidebet field
                matchupsByWeek[weekNumber].push({
                    GM1: data.gm1,
                    GM2: data.gm2,
                    matchupIndex: data.matchupIndex,
                    assignedSidebet: data.assignedSidebet || null // NEW: Include assigned sidebet
                });
            });
            
            // Convert to array format and sort matchups within each week
            const weeksArray = Object.keys(matchupsByWeek)
                .sort((a, b) => Number(a) - Number(b)) // Sort weeks numerically
                .map(weekNum => {
                    // Sort matchups by their original index
                    const sortedMatchups = matchupsByWeek[weekNum]
                        .sort((a, b) => a.matchupIndex - b.matchupIndex);
                    
                    return {
                        Week: Number(weekNum),
                        Matchups: sortedMatchups
                    };
                });
            
            console.log(`✅ Loaded ${weeksArray.length} weeks from Firestore`);
            return weeksArray;
            
        } catch (error) {
            console.error('Error fetching from Firestore:', error);
            throw error;
        }
    }
    
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
            
            // Apply Sidebet filter (NEW: checks for assignedSidebet instead of isSpecial)
            if (currentSpicyFilter) {
                matchups = matchups.filter(matchup => matchup.assignedSidebet !== null && matchup.assignedSidebet !== undefined);
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
                // Show "No matchups found" message
                const noMatchupsDiv = document.createElement('div');
                noMatchupsDiv.className = 'no-matchups-message';
                noMatchupsDiv.textContent = currentSpicyFilter 
                    ? '🎲 No sidebet matchups this week' 
                    : 'No matchups found';
                matchupsList.appendChild(noMatchupsDiv);
            } else {
                // Display matchups
                week.Matchups.forEach(matchup => {
                    const gm1Name = matchup.GM1;
                    const gm2Name = matchup.GM2;
                    const assignedSidebet = matchup.assignedSidebet; // NEW: Check if sidebet is assigned
                    
                    // Get image paths, use placeholder if not found
                    const gm1Image = gmMap.get(gm1Name) || 'assets/placeholder.jpg';
                    const gm2Image = gmMap.get(gm2Name) || 'assets/placeholder.jpg';

                    const matchupDiv = document.createElement('div');
                    matchupDiv.className = 'matchup-item';
                    
                    // NEW: Add has-sidebet class if a sidebet is assigned
                    if (assignedSidebet) {
                        matchupDiv.classList.add('has-sidebet');
                    }
                    
                    // Add special styling if needed (legacy isSpecial support)
                    if (matchup.isSpecial) {
                        matchupDiv.classList.add('on-fire'); 
                    }
                    
                    // NEW: Add click handler to open modal
                    matchupDiv.style.cursor = 'pointer';
                    matchupDiv.addEventListener('click', () => {
                        openSidebetModal(week.Week, gm1Name, gm2Name, matchup.matchupIndex, assignedSidebet);
                    });
                    
                    matchupDiv.innerHTML = `
                        ${assignedSidebet ? '<span></span><span></span><span></span><span></span>' : ''}
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

// ============================================
// SIDEBET ASSIGNMENT FUNCTIONALITY
// ============================================

let currentMatchupData = null;
let allSidebetsForModal = [];

// Function to open the sidebet modal when a matchup is clicked
async function openSidebetModal(week, gm1, gm2, matchupIndex, currentSidebetId) {
    console.log('📋 Opening sidebet modal for:', { week, gm1, gm2 });
    
    // Store current matchup data
    currentMatchupData = { week, gm1, gm2, matchupIndex, currentSidebetId };
    
    // Show the modal
    const modal = document.getElementById('sidebetModal');
    modal.style.display = 'flex';
    
    // Update matchup info in modal
    const matchupInfo = document.getElementById('modalMatchupInfo');
    matchupInfo.innerHTML = `
        <h3>${gm1} vs ${gm2}</h3>
        <p>Week ${week}</p>
    `;
    
    // Show/hide remove button based on whether there's a current sidebet
    const removeBtn = document.getElementById('removeSidebetBtn');
    removeBtn.style.display = currentSidebetId ? 'block' : 'none';
    
    // Show/hide create button based on whether there's a current sidebet
    const createBtn = document.getElementById('toggleCreateBtn');
    createBtn.style.display = currentSidebetId ? 'none' : 'block';

    // Load sidebets
    await loadSidebetsForModal();
}

// Function to close the modal
function closeSidebetModal() {
    const modal = document.getElementById('sidebetModal');
    modal.style.display = 'none';
    currentMatchupData = null;
}

// Load all sidebets and display them in the modal
async function loadSidebetsForModal() {
    const listContainer = document.getElementById('modalSidebetsList');
    listContainer.innerHTML = '<div class="loading">Loading sidebets...</div>';
    
    try {
        // Fetch sidebets from your endpoint
        const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app?requestType=sidebets');
        
        if (!response.ok) {
            throw new Error('Failed to fetch sidebets');
        }
        
        allSidebetsForModal = await response.json();
        
        // NEW: If this matchup already has an assigned sidebet, only show that one
        let sidebetsToDisplay;
        if (currentMatchupData.currentSidebetId) {
            // Filter to show only the assigned sidebet
            sidebetsToDisplay = allSidebetsForModal.filter(sidebet => 
                sidebet.id === currentMatchupData.currentSidebetId
            );
        } else {
            // No sidebet assigned yet, show all sidebets with priority sorting
            const prioritySidebets = [];
            const otherSidebets = [];
            
            allSidebetsForModal.forEach(sidebet => {
                // Check if this sidebet targets the current matchup
                const matchesTarget = sidebet.targetMatchup &&
                                      sidebet.targetMatchup.week === currentMatchupData.week &&
                                      sidebet.targetMatchup.gm1 === currentMatchupData.gm1 &&
                                      sidebet.targetMatchup.gm2 === currentMatchupData.gm2;
                
                if (matchesTarget) {
                    prioritySidebets.push(sidebet);
                } else {
                    otherSidebets.push(sidebet);
                }
            });
            
            // Combine with priority first
            sidebetsToDisplay = [...prioritySidebets, ...otherSidebets];
        }
        
        // Display sidebets
        if (sidebetsToDisplay.length === 0) {
            listContainer.innerHTML = '<div class="loading">No sidebets available</div>';
            return;
        }
        
        listContainer.innerHTML = sidebetsToDisplay.map(sidebet => {
            // For assigned matchups, we know it's assigned. For others, check priority
            const isPriority = !currentMatchupData.currentSidebetId && 
                             sidebet.targetMatchup &&
                             sidebet.targetMatchup.week === currentMatchupData.week &&
                             sidebet.targetMatchup.gm1 === currentMatchupData.gm1 &&
                             sidebet.targetMatchup.gm2 === currentMatchupData.gm2;
            const isAssigned = sidebet.id === currentMatchupData.currentSidebetId;
            const priorityClass = isPriority ? 'priority' : '';
            const assignedClass = isAssigned ? 'assigned' : '';
            
            // Build badges
            let badges = '';
            if (isPriority) {
                badges += '<span class="sidebet-badge priority">🎯 Target Match</span>';
            }
            if (isAssigned) {
                badges += '<span class="sidebet-badge assigned">✓ Assigned</span>';
            }
            if (sidebet.isFulfilled) {
                badges += '<span class="sidebet-badge fulfilled">🏆 Fulfilled</span>';
            }
            
            // Build target matchup display
            let targetMatchupHTML = '';
            if (sidebet.targetMatchup) {
                targetMatchupHTML = `
                    <div class="modal-sidebet-target">
                        <span class="modal-sidebet-target-icon">🎯</span>
                        <span>Target: ${escapeHtml(sidebet.targetMatchup.gm1)} vs ${escapeHtml(sidebet.targetMatchup.gm2)} (Week ${sidebet.targetMatchup.week})</span>
                    </div>
                `;
            } else {
                targetMatchupHTML = `
                    <div class="modal-sidebet-no-target">
                        No specific target matchup
                    </div>
                `;
            }
            
            return `
                <div class="modal-sidebet-item ${priorityClass} ${assignedClass}" 
                     onclick="assignSidebetToMatchup('${sidebet.id}')">
                    <div class="modal-sidebet-header">
                        <div class="modal-sidebet-badges">
                            ${badges}
                        </div>
                    </div>
                    <div class="modal-sidebet-text">${escapeHtml(sidebet.suggestion)}</div>
                    ${targetMatchupHTML}
                    <div class="modal-sidebet-meta">
                        <span class="modal-sidebet-author">${escapeHtml(sidebet.submittedBy)}</span>
                        <span class="modal-sidebet-date">${new Date(sidebet.submittedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}</span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading sidebets:', error);
        listContainer.innerHTML = '<div class="loading" style="color: red;">Error loading sidebets</div>';
    }
}

// Assign a sidebet to the current matchup
async function assignSidebetToMatchup(sidebetId) {
    if (!currentMatchupData) return;
    
    try {
        const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app?requestType=assignMatchupSidebet', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                week: currentMatchupData.week,
                gm1: currentMatchupData.gm1,
                gm2: currentMatchupData.gm2,
                matchupIndex: currentMatchupData.matchupIndex,
                sidebetId: sidebetId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to assign sidebet');
        }
        
        console.log('✅ Sidebet assigned successfully');
        
        // Close modal and refresh the display
        closeSidebetModal();
        
        // Reload the schedule to show the new sidebet styling
        location.reload();
        
    } catch (error) {
        console.error('Error assigning sidebet:', error);
        alert('Failed to assign sidebet. Please try again.');
    }
}

// Remove sidebet from current matchup
async function removeSidebetFromMatchup() {
    if (!currentMatchupData) return;
    
    try {
        const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app?requestType=assignMatchupSidebet', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                week: currentMatchupData.week,
                gm1: currentMatchupData.gm1,
                gm2: currentMatchupData.gm2,
                matchupIndex: currentMatchupData.matchupIndex,
                sidebetId: null // null means remove the assignment
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove sidebet');
        }
        
        console.log('✅ Sidebet removed successfully');
        
        // Close modal and refresh
        closeSidebetModal();
        location.reload();
        
    } catch (error) {
        console.error('Error removing sidebet:', error);
        alert('Failed to remove sidebet. Please try again.');
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally
window.openSidebetModal = openSidebetModal;
window.closeSidebetModal = closeSidebetModal;
window.assignSidebetToMatchup = assignSidebetToMatchup;
window.removeSidebetFromMatchup = removeSidebetFromMatchup;

// ============================================
// CREATE NEW SIDEBET FUNCTIONALITY
// ============================================

let isCreatingNewSidebet = false;

// Toggle between list view and create form view
function toggleCreateSidebet() {
    isCreatingNewSidebet = !isCreatingNewSidebet;
    
    const listSection = document.getElementById('sidebetsListSection');
    const createSection = document.getElementById('createSidebetSection');
    const listButtons = document.getElementById('listViewButtons');
    const createButtons = document.getElementById('createViewButtons');
    const toggleBtn = document.getElementById('toggleCreateBtn');
    const modalTitle = document.getElementById('modalTitle');
    const messageDiv = document.getElementById('newSidebetFormMessage');
    
    if (isCreatingNewSidebet) {
        // Show create form
        listSection.style.display = 'none';
        createSection.style.display = 'block';
        listButtons.style.display = 'none';
        createButtons.style.display = 'flex';
        toggleBtn.style.display = 'none';
        modalTitle.textContent = '🎲 Create New Sidebet';
        
        // Update the current matchup display
        const matchupDisplay = document.getElementById('currentMatchupDisplay');
        if (currentMatchupData) {
            matchupDisplay.textContent = `${currentMatchupData.gm1} vs ${currentMatchupData.gm2}, Week ${currentMatchupData.week}`;
        }
        
        // Clear any previous messages
        messageDiv.innerHTML = '';
    } else {
        // Show sidebets list
        listSection.style.display = 'block';
        createSection.style.display = 'none';
        listButtons.style.display = 'flex';
        createButtons.style.display = 'none';
        toggleBtn.style.display = 'block';
        modalTitle.textContent = '🎲 Assign Side Bet';
        
        // Reset form
        document.getElementById('newSidebetForm').reset();
        document.getElementById('useCurrentMatchup').checked = true;
        messageDiv.innerHTML = '';
    }
}

// Submit new sidebet
async function submitNewSidebet() {
    const submitBtn = document.getElementById('submitNewSidebetBtn');
    const messageDiv = document.getElementById('newSidebetFormMessage');
    const form = document.getElementById('newSidebetForm');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    messageDiv.innerHTML = '';
    
    try {
        // Get form data
        const formData = new FormData(form);
        const useCurrentMatchup = document.getElementById('useCurrentMatchup').checked;
        
        const data = {
            suggestion: formData.get('suggestion'),
            submittedBy: formData.get('submittedBy'),
            targetMatchup: useCurrentMatchup && currentMatchupData ? {
                week: currentMatchupData.week,
                gm1: currentMatchupData.gm1,
                gm2: currentMatchupData.gm2
            } : null
        };

        // Submit to your endpoint
        const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app?requestType=submitSidebet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to submit sidebet');
        }

        const result = await response.json();
        
        // Success!
        messageDiv.innerHTML = `
            <div class="message message-success">
                ✅ Sidebet created successfully!
            </div>
        `;
        
        // If the sidebet was assigned to the current matchup, automatically assign it
        if (useCurrentMatchup && currentMatchupData && result.sidebetId) {
            console.log('🎯 Auto-assigning new sidebet to matchup');
            await assignSidebetToMatchup(result.sidebetId);
        } else {
            // Just close and refresh after a delay
            setTimeout(() => {
                closeSidebetModal();
                location.reload();
            }, 1500);
        }

    } catch (error) {
        console.error('Error submitting sidebet:', error);
        messageDiv.innerHTML = `
            <div class="message message-error">
                ❌ Failed to create sidebet. Please try again.
            </div>
        `;
        
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Update the closeSidebetModal function to reset the create form state
const originalCloseSidebetModal = closeSidebetModal;
closeSidebetModal = function() {
    // Reset create form state
    if (isCreatingNewSidebet) {
        toggleCreateSidebet();
    }
    
    // Call original close function
    originalCloseSidebetModal();
};

// Make functions globally available
window.toggleCreateSidebet = toggleCreateSidebet;
window.submitNewSidebet = submitNewSidebet;