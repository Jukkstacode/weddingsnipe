// schedule.js - Updated to fetch from Firestore
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
    
    // NEW FUNCTION: Fetch matchups from Firestore
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
                
                // Add matchup in the old format (GM1, GM2)
                matchupsByWeek[weekNumber].push({
                    GM1: data.gm1,
                    GM2: data.gm2,
                    matchupIndex: data.matchupIndex
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
            
            // Apply Spicy filter
            // NOTE: Since we didn't migrate isSpecial, this filter won't work anymore
            // We've removed the spicy matchup functionality
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
            // Show "No matchups found" message
            const noMatchupsDiv = document.createElement('div');
            noMatchupsDiv.className = 'no-matchups-message';
            noMatchupsDiv.textContent = currentSpicyFilter 
                ? '🌶️ No spicy matchups this week' 
                : 'No matchups found';
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
    // Create a single matchup card
    function createMatchupCard(matchup) {
        const card = document.createElement('div');
        card.className = 'matchup-card';
        
        // Add spicy class if this is a special matchup
        if (matchup.isSpecial) {
            card.classList.add('spicy-matchup');
        }
        
        // GM1 section
        const gm1Section = document.createElement('div');
        gm1Section.className = 'gm-section';
        
        const gm1Img = document.createElement('img');
        gm1Img.src = gmMap.get(matchup.GM1) || 'assets/default-gm.jpg';
        gm1Img.alt = matchup.GM1;
        gm1Img.className = 'gm-image';
        
        const gm1Name = document.createElement('div');
        gm1Name.className = 'gm-name';
        gm1Name.textContent = matchup.GM1;
        
        gm1Section.appendChild(gm1Img);
        gm1Section.appendChild(gm1Name);
        
        // VS text
        const vsText = document.createElement('div');
        vsText.className = 'vs-text';
        vsText.textContent = 'VS';
        
        // GM2 section
        const gm2Section = document.createElement('div');
        gm2Section.className = 'gm-section';
        
        const gm2Img = document.createElement('img');
        gm2Img.src = gmMap.get(matchup.GM2) || 'assets/default-gm.jpg';
        gm2Img.alt = matchup.GM2;
        gm2Img.className = 'gm-image';
        
        const gm2Name = document.createElement('div');
        gm2Name.className = 'gm-name';
        gm2Name.textContent = matchup.GM2;
        
        gm2Section.appendChild(gm2Img);
        gm2Section.appendChild(gm2Name);
        
        // Add spicy indicator if needed
        if (matchup.isSpecial) {
            const spicyIndicator = document.createElement('div');
            spicyIndicator.className = 'spicy-indicator';
            spicyIndicator.textContent = '🔥';
            card.appendChild(spicyIndicator);
        }
        
        // Assemble the card
        card.appendChild(gm1Section);
        card.appendChild(vsText);
        card.appendChild(gm2Section);
        
        return card;
    }
});