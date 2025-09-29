// Sidebets Display Page
document.addEventListener('DOMContentLoaded', async () => {
    let allSidebets = [];
    let currentFilter = 'all';

    // Get elements
    const sidebetsList = document.getElementById('sidebets-list');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Load sidebets from the API
    async function loadSidebets() {
        try {
            const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app?requestType=sidebets');
            
            if (!response.ok) {
                throw new Error('Failed to fetch sidebets');
            }

            allSidebets = await response.json();
            displaySidebets(allSidebets);
        } catch (error) {
            console.error('Error loading sidebets:', error);
            sidebetsList.innerHTML = `
                <div class="empty-state">
                    <h3>⚠️ Error Loading Sidebets</h3>
                    <p>Unable to fetch sidebets. Please try again later.</p>
                </div>
            `;
        }
    }

    // Display sidebets based on filter
    function displaySidebets(sidebets) {
        // Filter sidebets
        let filteredSidebets = sidebets;
        if (currentFilter !== 'all') {
            filteredSidebets = sidebets.filter(s => s.status === currentFilter);
        }

        // Check if empty
        if (filteredSidebets.length === 0) {
            sidebetsList.innerHTML = `
                <div class="empty-state">
                    <h3>📭 No Sidebets Found</h3>
                    <p>No ${currentFilter === 'all' ? '' : currentFilter} sidebets to display.</p>
                </div>
            `;
            return;
        }

        // Build HTML for sidebets
        const html = filteredSidebets.map(sidebet => {
            const date = new Date(sidebet.submittedAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
                    ${sidebet.targetWeek ? `
                        <div class="sidebet-week">
                            <span>Target:</span>
                            <span class="week-badge">Week ${sidebet.targetWeek}</span>
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

    // Handle filter button clicks
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter and display
            currentFilter = button.dataset.filter;
            displaySidebets(allSidebets);
        });
    });

    // Load sidebets on page load
    await loadSidebets();
});