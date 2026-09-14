document.addEventListener('DOMContentLoaded', function() {
    const API_ENDPOINT = "https://nhl-stats-cacher-347732622266.us-west1.run.app";

    const FANTASY_SCORING = {
        goals: 3,
        assists: 2,
        plusMinus: 1,
        pim: 0.25,
        powerPlayPoints: 1,
        shortHandedPoints: 1,
        gameWinningGoals: 1.5,
        wins: 3,
        goalsAgainst: -1.5,
        saves: 0.2,
        shutouts: 6
    };

    function calculateSkaterFantasyPoints(stats) {
        if (!stats) return 0;
        const { goals = 0, assists = 0, plusMinus = 0, pim = 0, powerPlayPoints = 0, shorthandedPoints = 0, gameWinningGoals = 0 } = stats;
        return (goals * FANTASY_SCORING.goals) +
               (assists * FANTASY_SCORING.assists) +
               (plusMinus * FANTASY_SCORING.plusMinus) +
               (pim * FANTASY_SCORING.pim) +
               (powerPlayPoints * FANTASY_SCORING.powerPlayPoints) +
               (shorthandedPoints * FANTASY_SCORING.shortHandedPoints) +
               (gameWinningGoals * FANTASY_SCORING.gameWinningGoals);
    }

    function calculateGoalieFantasyPoints(stats) {
        if (!stats) return 0;
        const { wins = 0, goalsAgainst = 0, shotsAgainst = 0, shutouts = 0 } = stats;
        const calculatedSaves = shotsAgainst - goalsAgainst;
        return (wins * FANTASY_SCORING.wins) +
               (goalsAgainst * FANTASY_SCORING.goalsAgainst) +
               (calculatedSaves * FANTASY_SCORING.saves) +
               (shutouts * FANTASY_SCORING.shutouts);
    }

    function getFantasyPoints(stats, position) {
        if (!stats) return 0;
        return position === 'G'
            ? calculateGoalieFantasyPoints(stats)
            : calculateSkaterFantasyPoints(stats);
    }

    async function fetchCurrentSeasonStats(playerIds) {
        try {
            const idsParam = playerIds.join(',');
            const url = `${API_ENDPOINT}?requestType=currentSeasonStats&playerIds=${idsParam}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API returned status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error loading current season stats from endpoint:', error);
            return {};
        }
    }

    function getPositionClass(position) {
        const primary = position.split(',')[0].trim();
        if (position.includes(',')) return 'pos-multi';
        switch (primary) {
            case 'C':  return 'pos-c';
            case 'LW': return 'pos-lw';
            case 'RW': return 'pos-rw';
            case 'D':  return 'pos-d';
            case 'G':  return 'pos-g';
            default:   return 'pos-c';
        }
    }

    function buildContractDots(length) {
        let dots = '';
        for (let i = 0; i < length; i++) {
            dots += `<span class="contract-dot year-${length}"></span>`;
        }
        const yearLabel = length === 1 ? '1 yr' : `${length} yrs`;
        return `<div class="contract-length">${dots}<span class="contract-label">${yearLabel}</span></div>`;
    }

    function buildStatsHtml(stats, position) {
        if (!stats) return '<div class="no-stats">No stats available</div>';

        const season = stats.season || '20252026';
        const seasonDisplay = `${String(season).substring(0, 4)}-${String(season).substring(4)}`;

        if (position === 'G') {
            const fantasyPts = calculateGoalieFantasyPoints(stats).toFixed(1);
            return `
                <div class="stats-season-label">${seasonDisplay}</div>
                <div class="player-stats-row">
                    <div class="stat-cell"><span class="stat-label">GP</span><span class="stat-value">${stats.gamesPlayed || 0}</span></div>
                    <div class="stat-cell"><span class="stat-label">W</span><span class="stat-value">${stats.wins || 0}</span></div>
                    <div class="stat-cell"><span class="stat-label">L</span><span class="stat-value">${stats.losses || 0}</span></div>
                    <div class="stat-cell"><span class="stat-label">GAA</span><span class="stat-value">${stats.goalsAgainstAverage?.toFixed(2) || '—'}</span></div>
                    <div class="stat-cell"><span class="stat-label">SV%</span><span class="stat-value">${stats.savePctg?.toFixed(3) || '—'}</span></div>
                    <div class="stat-cell fantasy-cell"><span class="stat-label">FPTS</span><span class="stat-value">${fantasyPts}</span></div>
                </div>`;
        } else {
            const fantasyPts = calculateSkaterFantasyPoints(stats).toFixed(1);
            return `
                <div class="stats-season-label">${seasonDisplay}</div>
                <div class="player-stats-row">
                    <div class="stat-cell"><span class="stat-label">GP</span><span class="stat-value">${stats.gamesPlayed || 0}</span></div>
                    <div class="stat-cell"><span class="stat-label">G</span><span class="stat-value">${stats.goals || 0}</span></div>
                    <div class="stat-cell"><span class="stat-label">A</span><span class="stat-value">${stats.assists || 0}</span></div>
                    <div class="stat-cell"><span class="stat-label">P</span><span class="stat-value">${stats.points || 0}</span></div>
                    <div class="stat-cell"><span class="stat-label">+/-</span><span class="stat-value">${stats.plusMinus > 0 ? '+' : ''}${stats.plusMinus || 0}</span></div>
                    <div class="stat-cell fantasy-cell"><span class="stat-label">FPTS</span><span class="stat-value">${fantasyPts}</span></div>
                </div>`;
        }
    }

    function buildPlayerCard(contract, stats) {
        const posClass = getPositionClass(contract.Position);
        const stolenHtml = contract['Stolen?'] ? '<div class="stolen-indicator"></div>' : '';
        const statsHtml = buildStatsHtml(stats, contract.Position);
        const contractDots = buildContractDots(contract['Contract Length']);

        const chartUrl = `over-time/index.html?playerId=${contract.nhlId}&season=20252026`;

        return `
            <a href="${chartUrl}" class="player-card-link" data-position="${contract.Position}" data-contract-length="${contract['Contract Length']}">
            <div class="player-card">
                ${stolenHtml}
                <div class="player-card-top">
                    <div class="player-card-identity">
                        <div class="player-card-name">${contract.Player}</div>
                        <div class="player-card-detail">
                            <span class="position-badge ${posClass}">${contract.Position}</span>
                            <span>${contract.Team}</span>
                        </div>
                    </div>
                    <div class="player-card-right">
                        ${contractDots}
                    </div>
                </div>
                ${statsHtml}
            </div>
            </a>`;
    }

    // Show loading state
    const container = document.querySelector('.gm-list-container');
    container.innerHTML = '<div class="contracts-loading"><div class="spinner"></div>Loading contracts &amp; stats...</div>';

    Promise.all([
        fetch('contracts.json').then(r => r.json()),
        fetch('gm.json').then(r => r.json())
    ]).then(async ([contracts, gms]) => {
        const allPlayerIds = contracts.map(c => c.nhlId).filter(Boolean);
        const allPlayerStats = await fetchCurrentSeasonStats(allPlayerIds);

        const gmsMap = new Map(gms.map(gm => [gm.name, gm]));
        const contractsByGm = {};
        for (const contract of contracts) {
            if (!contractsByGm[contract.GM]) contractsByGm[contract.GM] = [];
            contractsByGm[contract.GM].push(contract);
        }

        // Calculate total fantasy points per GM and sort GMs by total
        const gmEntries = Object.entries(contractsByGm).map(([gmName, gmContracts]) => {
            let totalPts = 0;
            for (const c of gmContracts) {
                const stats = allPlayerStats[c.nhlId];
                totalPts += getFantasyPoints(stats, c.Position);
            }
            return { gmName, contracts: gmContracts, totalPts };
        });
        gmEntries.sort((a, b) => b.totalPts - a.totalPts);

        container.innerHTML = '';

        for (const { gmName, contracts: gmContracts, totalPts } of gmEntries) {
            const gm = gmsMap.get(gmName);
            if (!gm) continue;

            // Sort players within GM by contract length (longest first), then fantasy points
            gmContracts.sort((a, b) => {
                const lengthDiff = b['Contract Length'] - a['Contract Length'];
                if (lengthDiff !== 0) return lengthDiff;
                const ptsA = getFantasyPoints(allPlayerStats[a.nhlId], a.Position);
                const ptsB = getFantasyPoints(allPlayerStats[b.nhlId], b.Position);
                return ptsB - ptsA;
            });

            const playerCards = gmContracts.map(c => buildPlayerCard(c, allPlayerStats[c.nhlId])).join('');

            const section = document.createElement('div');
            section.className = 'gm-section';
            section.innerHTML = `
                <div class="gm-section-header">
                    <img src="${gm.image}" alt="${gm.name}">
                    <div class="gm-info">
                        <div class="gm-name">${gm.name}</div>
                        <div class="gm-meta">${gmContracts.length} contracts</div>
                    </div>
                    <div class="gm-total-pts">
                        <div class="label">Total FPTS</div>
                        <div class="value">${totalPts.toFixed(1)}</div>
                    </div>
                </div>
                <div class="players-grid">${playerCards}</div>`;

            container.appendChild(section);
        }

        // Shared filter logic
        let activePos = 'ALL';
        let rfaOnly = false;

        function applyCardFilters() {
            document.querySelectorAll('.player-card-link').forEach(card => {
                const posMatch = activePos === 'ALL' || card.dataset.position.split(',').some(p => p.trim() === activePos);
                const rfaMatch = !rfaOnly || card.dataset.contractLength === '1';
                card.style.display = (posMatch && rfaMatch) ? '' : 'none';
            });
        }

        document.querySelectorAll('.pos-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pos-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activePos = btn.dataset.pos;
                applyCardFilters();
            });
        });

        document.getElementById('rfaFilter').addEventListener('click', function() {
            rfaOnly = !rfaOnly;
            this.classList.toggle('active', rfaOnly);
            applyCardFilters();
        });
    }).catch(error => {
        console.error('Error fetching initial data:', error);
        container.innerHTML = '<div class="contracts-loading">Failed to load contracts. Please refresh.</div>';
    });
});
