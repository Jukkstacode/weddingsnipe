document.addEventListener('DOMContentLoaded', async () => {
    let allSidebets = [];
    let isSpinning = false;
    let currentlyAnimatingIndex = null; // Track which card is actually animating

    const sidebetsGrid = document.getElementById('sidebetsGrid');
    const spinBtn = document.getElementById('spinBtn');
    const resetBtn = document.getElementById('resetBtn');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const winnerContent = document.getElementById('winnerContent');
    const sectionTitle = document.getElementById('sectionTitle');

    // Load all sidebets from API
    async function loadSidebets() {
        try {
            const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app?requestType=sidebets');
            
            if (!response.ok) {
                throw new Error('Failed to fetch sidebets');
            }

            allSidebets = await response.json();
            
            // Filter out sidebets that are already winners (optional)
            // allSidebets = allSidebets.filter(s => !s.isWinner);
            
            displaySidebetsGrid();

        } catch (error) {
            console.error('Error loading sidebets:', error);
            sidebetsGrid.innerHTML = '<p style="color: red; text-align: center; grid-column: 1/-1;">Failed to load sidebets.</p>';
        }
    }

    // Display all sidebets in a grid
    function displaySidebetsGrid() {
        if (allSidebets.length === 0) {
            sidebetsGrid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No sidebets found.</p>';
            spinBtn.disabled = true;
            return;
        }

        sidebetsGrid.innerHTML = allSidebets.map((sidebet, index) => {
            const matchupHtml = sidebet.targetMatchup ? `
                <div class="sidebet-matchup">
                    🔥 ${sidebet.targetMatchup.gm1} vs ${sidebet.targetMatchup.gm2} (Week ${sidebet.targetMatchup.week})
                </div>
            ` : '';

            const winnerBadge = sidebet.isWinner ? '<span class="winner-badge">🏆 WINNER</span>' : '';

            return `
                <div class="sidebet-card" data-index="${index}" data-id="${sidebet.id}">
                    <div class="sidebet-header">
                        <span class="sidebet-author">💡 ${escapeHtml(sidebet.submittedBy)}</span>
                        <div class="sidebet-badges">
                            <span class="sidebet-status status-${sidebet.status}">${sidebet.status}</span>
                            ${winnerBadge}
                        </div>
                    </div>
                    <div class="sidebet-text">${escapeHtml(sidebet.suggestion)}</div>
                    ${matchupHtml}
                </div>
            `;
        }).join('');
    }

    // Spin through sidebets with highlighting
    async function spinThroughSidebets() {
        if (isSpinning || allSidebets.length === 0) return;

        isSpinning = true;
        spinBtn.disabled = true;
        winnerDisplay.style.display = 'none';
        sectionTitle.textContent = '🎲 Spinning... 🎲';

        // Remove any previous winner classes
        document.querySelectorAll('.sidebet-card').forEach(card => {
            card.classList.remove('final-winner', 'highlighting');
        });

        const cards = document.querySelectorAll('.sidebet-card');
        
        // Pick a random winner upfront
        const winnerIndex = Math.floor(Math.random() * allSidebets.length);
        
        // Random starting position
        let currentIndex = Math.floor(Math.random() * allSidebets.length);
        
        // Calculate minimum spins needed (at least 2 full loops through all cards for drama)
        const minSpins = allSidebets.length * 2;
        
        // Calculate exactly how many spins to land on winner
        // We need to land ON the winner, not one past it
        let totalSpins = minSpins;
        while ((currentIndex + totalSpins) % allSidebets.length !== winnerIndex) {
            totalSpins++;
        }
        
        // Spin parameters
        const startDelay = 150; // Start delay (ms between highlights)
        const endDelay = 600; // End delay (ms between highlights)
        
        let spinCount = 0;

        // Highlighting function with Promise for better control
        const highlightNext = () => {
            return new Promise((resolve) => {
                // Calculate current card index
                const indexToHighlight = currentIndex % cards.length;
                currentlyAnimatingIndex = indexToHighlight; // Track it globally
                
                // Remove previous highlights
                cards.forEach(card => {
                    card.classList.remove('highlighting');
                });

                // Add highlight to current card
                cards[indexToHighlight].classList.add('highlighting');

                // Scroll the highlighted card into view
                cards[indexToHighlight].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });

                // Calculate progress (0 to 1)
                const progress = spinCount / totalSpins;
                
                // Ease out - start fast, end slow
                const currentDelay = startDelay + (endDelay - startDelay) * easeOutCubic(progress);

                spinCount++;
                currentIndex++;

                // Wait for the delay before resolving
                setTimeout(() => {
                    resolve();
                }, currentDelay);
            });
        };

        // Run the spin sequence
        const runSpin = async () => {
            for (let i = 0; i < totalSpins; i++) {
                await highlightNext();
            }
            
            // The last card that was highlighted is stored in currentlyAnimatingIndex
            // That should be our winner
            slowDownToWinner(currentlyAnimatingIndex);
        };

        runSpin();
    }

    // Slow down and land on the winner
    function slowDownToWinner(winnerIndex) {
        const cards = document.querySelectorAll('.sidebet-card');
        
        // Remove all highlighting first
        cards.forEach(card => card.classList.remove('highlighting'));

        // Small delay before showing winner
        setTimeout(() => {
            // Highlight winner with special animation
            cards[winnerIndex].classList.add('final-winner');
            cards[winnerIndex].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });

            // Update database and show winner
            setTimeout(async () => {
                const winner = allSidebets[winnerIndex];
                await markAsWinner(winner.id);
                displayWinner(winner);
                
                isSpinning = false;
                resetBtn.style.display = 'inline-block';
                sectionTitle.textContent = '🏆 Winner Selected! 🏆';
            }, 1000);
        }, 300); // Wait for last animation to finish
    }

    // Easing function for smooth deceleration
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Mark sidebet as winner in database
    async function markAsWinner(sidebetId) {
        try {
            const response = await fetch('https://nhl-stats-cacher-347732622266.us-west1.run.app', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestType: 'updateSidebet',
                    sidebetId: sidebetId,
                    isWinner: true
                })
            });

            if (!response.ok) {
                console.error('Failed to update winner status');
            }
        } catch (error) {
            console.error('Error updating winner:', error);
        }
    }

    // Display the winner
    function displayWinner(winner) {
        const matchupHtml = winner.targetMatchup ? `
            <div class="winner-matchup">
                🔥 ${winner.targetMatchup.gm1} vs ${winner.targetMatchup.gm2} (Week ${winner.targetMatchup.week})
            </div>
        ` : '';

        winnerContent.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 20px;">
                ${escapeHtml(winner.suggestion)}
            </div>
            <div class="winner-meta">
                Suggested by: <strong>${escapeHtml(winner.submittedBy)}</strong>
            </div>
            ${matchupHtml}
        `;

        winnerDisplay.style.display = 'block';

        // Reload sidebets to show winner badge
        loadSidebets();
    }

    // Reset the picker
    function reset() {
        // Remove all special classes
        document.querySelectorAll('.sidebet-card').forEach(card => {
            card.classList.remove('highlighting', 'final-winner');
        });
        
        currentlyAnimatingIndex = null;
        winnerDisplay.style.display = 'none';
        spinBtn.disabled = false;
        resetBtn.style.display = 'none';
        sectionTitle.textContent = 'All Sidebets';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event listeners
    spinBtn.addEventListener('click', spinThroughSidebets);
    resetBtn.addEventListener('click', reset);

    // Initial load
    await loadSidebets();
});