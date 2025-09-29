// Hero Button Module
const HeroButton = {
    // Configuration for different pages
    pageConfig: {
        'schedule.html': {
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
        // Create modal HTML
        this.createSidebetModal();
        
        // Get elements
        const heroButton = document.getElementById('heroButton');
        const modal = document.getElementById('sidebetModal');
        const form = document.getElementById('sidebetForm');
        const cancelBtn = document.getElementById('cancelBtn');
        const messageDiv = document.getElementById('formMessage');

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

        // Populate week dropdown
        this.populateWeekDropdown();
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
                            <label for="targetWeek">Target Week (Optional)</label>
                            <select id="targetWeek" name="targetWeek">
                                <option value="">Any Week</option>
                            </select>
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

    // Populate the week dropdown based on matchups data
    async populateWeekDropdown() {
        try {
            const response = await fetch('schedule/matchups.json');
            const matchups = await response.json();
            const dropdown = document.getElementById('targetWeek');
            
            matchups.forEach(week => {
                const option = document.createElement('option');
                option.value = week.Week;
                option.textContent = `Week ${week.Week}`;
                
                // Mark special weeks
                const hasSpecial = week.Matchups.some(m => m.isSpecial);
                if (hasSpecial) {
                    option.textContent += ' 🔥 (Sidebet Week)';
                }
                
                dropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading matchups:', error);
        }
    },

    // Handle sidebet form submission
    async handleSidebetSubmission(form) {
        const submitBtn = document.getElementById('submitBtn');
        const messageDiv = document.getElementById('formMessage');
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            suggestion: formData.get('suggestion'),
            submittedBy: formData.get('submittedBy'),
            targetWeek: formData.get('targetWeek') || null
        };

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        submitBtn.textContent = '';
        messageDiv.innerHTML = '';

        try {
            // Submit to your Google Cloud Function
            const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Show success message
                messageDiv.innerHTML = `
                    <div class="message success">
                        ✅ Sidebet suggestion submitted successfully!
                    </div>
                `;
                
                // Clear form
                form.reset();
                
                // Close modal after delay
                setTimeout(() => {
                    this.closeModal();
                }, 2000);
            } else {
                throw new Error('Failed to submit sidebet');
            }
        } catch (error) {
            console.error('Error submitting sidebet:', error);
            
            // Show error message
            messageDiv.innerHTML = `
                <div class="message error">
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