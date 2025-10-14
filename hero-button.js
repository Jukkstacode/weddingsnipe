// Hero Button Module
const HeroButton = {
    // Firebase instance (will be initialized if needed)
    db: null,

    // Configuration for different pages
    pageConfig: {
        'schedule.html': {
            action: 'sidebet',
            icon: '+',
            tooltip: 'Suggest a Sidebet'
        },
        'sidebets.html': {
            action: 'sidebet',
            icon: '+',
            tooltip: 'Suggest a Sidebet'
        },
        // Add more pages here as needed
        'default': {
            action: 'default',
            icon: '⚡',
            tooltip: 'Action'
        }
    },

    // Initialize Firebase
    initFirebase() {
        if (!this.db) {
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
            
            this.db = firebase.firestore();
        }
    },

    // Initialize the hero button
    init() {
        // Get current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const config = this.pageConfig[currentPage] || this.pageConfig['default'];
        
        // Only show on configured pages
        if (config.action === 'default') {
            return; // Don't show button on unconfigured pages
        }

        // Create hero button
        this.createButton(config);

        // Handle page-specific actions
        if (config.action === 'sidebet') {
            this.initSidebetFeature();
        }
    },

    // Create the hero button element
    createButton(config) {
        const button = document.createElement('button');
        button.className = 'hero-button';
        button.id = 'heroButton';
        button.innerHTML = config.icon;
        button.title = config.tooltip;
        document.body.appendChild(button);
    },

    // Initialize sidebet-specific features
    initSidebetFeature() {
        // Initialize Firebase
        this.initFirebase();
        
        // Create modal HTML
        this.createSidebetModal();
        
        // Get elements
        const heroButton = document.getElementById('heroButton');
        const modal = document.getElementById('sidebetModal');
        const form = document.getElementById('sidebetForm');
        const cancelBtn = document.getElementById('cancelBtn');

        // Toggle modal on button click
        heroButton.addEventListener('click', () => {
            const isActive = modal.classList.contains('active');
            if (isActive) {
                this.closeModal();
            } else {
                this.openModal();
            }
        });

        // Close modal on cancel
        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSidebetSubmission(e.target);
        });

        // Populate matchup dropdown from Firestore
        this.populateMatchupDropdown();
    },

    // Create the sidebet modal HTML
    createSidebetModal() {
        const modalHTML = `
            <div id="sidebetModal" class="sidebet-modal">
                <div class="sidebet-form-container">
                    <h2>🎲 Suggest a Sidebet</h2>
                    <div id="formMessage"></div>
                    <form id="sidebetForm">
                        <div class="form-group">
                            <label for="suggestion">Sidebet Suggestion *</label>
                            <textarea 
                                id="suggestion" 
                                name="suggestion" 
                                placeholder="Enter your sidebet idea... (e.g., 'Loser has to wear the winner's jersey to the next game')"
                                required
                            ></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="submittedBy">Your Name *</label>
                            <input 
                                type="text" 
                                id="submittedBy" 
                                name="submittedBy" 
                                placeholder="Enter your name"
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="targetMatchup">Target Matchup (Optional)</label>
                            <select id="targetMatchup" name="targetMatchup">
                                <option value="">Any Matchup</option>
                            </select>
                            <small style="color: #999; font-size: 0.85rem; display: block; margin-top: 5px;">
                                Choose a specific matchup for your sidebet
                            </small>
                        </div>
                        
                        <div class="form-buttons">
                            <button type="submit" class="btn btn-submit" id="submitBtn">
                                Submit Sidebet
                            </button>
                            <button type="button" class="btn btn-cancel" id="cancelBtn">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // NEW: Populate the matchup dropdown from Firestore (ALL matchups)
    async populateMatchupDropdown() {
        try {
            console.log('📡 Loading matchups for dropdown...');
            
            // Get all matchup documents from Firestore
            const snapshot = await this.db.collection('matchups').get();
            
            if (snapshot.empty) {
                console.warn('No matchups found in Firestore');
                return;
            }
            
            const dropdown = document.getElementById('targetMatchup');
            
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
                    // Create a unique value combining week and matchup
                    option.value = JSON.stringify({
                        week: Number(weekNum),
                        gm1: matchup.gm1,
                        gm2: matchup.gm2
                    });
                    option.textContent = `${matchup.gm1} vs ${matchup.gm2} (Week ${weekNum})`;
                    dropdown.appendChild(option);
                });
            });
            
            console.log('✅ Matchup dropdown populated');
            
        } catch (error) {
            console.error('Error loading matchups for dropdown:', error);
        }
    },

    // Handle sidebet form submission
    async handleSidebetSubmission(form) {
        const submitBtn = document.getElementById('submitBtn');
        const messageDiv = document.getElementById('formMessage');
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        messageDiv.innerHTML = '';
        
        try {
            // Get form data
            const formData = new FormData(form);
            const targetMatchupValue = formData.get('targetMatchup');

            const data = {
                suggestion: formData.get('suggestion'),
                submittedBy: formData.get('submittedBy'),
                targetMatchup: targetMatchupValue ? JSON.parse(targetMatchupValue) : null
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

            // Success!
            messageDiv.innerHTML = `
                <div class="message message-success">
                    ✅ Sidebet submitted successfully! Thanks for your suggestion.
                </div>
            `;

            // Reset form after 2 seconds and close modal
            setTimeout(() => {
                this.closeModal();
            }, 2000);

        } catch (error) {
            console.error('Error submitting sidebet:', error);
            messageDiv.innerHTML = `
                <div class="message message-error">
                    ❌ Failed to submit sidebet. Please try again.
                </div>
            `;
        } finally {
            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Sidebet';
        }
    },

    // Open modal
    openModal() {
        const modal = document.getElementById('sidebetModal');
        const heroButton = document.getElementById('heroButton');
        const messageDiv = document.getElementById('formMessage');
        
        modal.classList.add('active');
        heroButton.classList.add('active');
        messageDiv.innerHTML = ''; // Clear any previous messages
    },

    // Close modal
    closeModal() {
        const modal = document.getElementById('sidebetModal');
        const heroButton = document.getElementById('heroButton');
        const form = document.getElementById('sidebetForm');
        const messageDiv = document.getElementById('formMessage');
        
        modal.classList.remove('active');
        heroButton.classList.remove('active');
        form.reset();
        messageDiv.innerHTML = '';
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    HeroButton.init();
});