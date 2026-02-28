document.addEventListener('DOMContentLoaded', async () => {
    const SEASON = '20242025';
    const ENDPOINT_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';
    let currentChart = null;

    // --- CORRECT SCORING LOGIC ---
    const FANTASY_SCORING = {
        goals: 3, assists: 2, plusMinus: 1, pim: 0.25, powerPlayPoints: 1, shortHandedPoints: 1, gameWinningGoals: 1.5,
        wins: 3, goalsAgainst: -1.5, saves: 0.2, shutouts: 6
    };

    // --- CORRECTED FANTASY POINT CALCULATION FUNCTIONS ---
    function calculateFantasyPointsForSkaterGame(game) {
        if (!game || game.toi === "00:00") return 0;
        
        const ppp = game.powerPlayPoints || 0; 
        const shp = game.shorthandedPoints || 0;
        const { goals = 0, assists = 0, plusMinus = 0, pim = 0, gameWinningGoals = 0 } = game;
        
        return (goals * FANTASY_SCORING.goals) + 
               (assists * FANTASY_SCORING.assists) + 
               (plusMinus * FANTASY_SCORING.plusMinus) + 
               (pim * FANTASY_SCORING.pim) + 
               (ppp * FANTASY_SCORING.powerPlayPoints) + 
               (shp * FANTASY_SCORING.shortHandedPoints) + 
               (gameWinningGoals * FANTASY_SCORING.gameWinningGoals);
    }

    function calculateFantasyPointsForGoalieGame(game) {
        if (!game || game.toi === "00:00") return 0;
        
        const { decision, shotsAgainst = 0, goalsAgainst = 0, shutouts = 0 } = game;
        const calculatedSaves = shotsAgainst - goalsAgainst;

        let points = 0;
        if (decision === 'W') {
            points += FANTASY_SCORING.wins;
        }
        points += (calculatedSaves * FANTASY_SCORING.saves);
        points += (goalsAgainst * FANTASY_SCORING.goalsAgainst);
        points += (shutouts * FANTASY_SCORING.shutouts);
        
        return points;
    }

    const chartColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#E7E9ED', '#8D5B4C', '#D64541', '#8E44AD', '#27AE60', '#F39C12'
    ];

    async function fetchPlayerGameLog(playerId, season) {
        const apiUrl = `${ENDPOINT_URL}?requestType=gameLog&playerIds=${playerId}&season=${season}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error(`Endpoint responded with status: ${response.status} for player ${playerId}`);
                return [];
            }
            const data = await response.json();
            return data.gameLog || [];
        } catch (error) {
            console.error(`Failed to fetch player game log for ${playerId}:`, error);
            return [];
        }
    }

    async function fetchTeamSchedule(teamAbbrev, season) {
        const apiUrl = `${ENDPOINT_URL}?requestType=teamSchedule&teamAbbrev=${teamAbbrev}&season=${season}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) return [];
            const data = await response.json();
            return data.gameDates || [];
        } catch (error) {
            console.error(`Failed to fetch team schedule for ${teamAbbrev}:`, error);
            return [];
        }
    }

    function processGameLogForChart(gameLog, position) {
        const labels = [];
        const cumulativeFantasyPointsData = [];
        const playedDates = new Set();
        let cumulativeFantasyPoints = 0;

        if (!gameLog || gameLog.length === 0) return { labels, data: [], playedDates };

        const sortedGameLog = gameLog.slice().sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

        sortedGameLog.forEach(game => {
            labels.push(game.gameDate);
            playedDates.add(game.gameDate);
            let gamePoints = 0;
            if (position.includes('G')) {
                gamePoints = calculateFantasyPointsForGoalieGame(game);
            } else {
                gamePoints = calculateFantasyPointsForSkaterGame(game);
            }
            cumulativeFantasyPoints += gamePoints;
            cumulativeFantasyPointsData.push(parseFloat(cumulativeFantasyPoints.toFixed(2)));
        });

        return { labels, data: cumulativeFantasyPointsData, playedDates };
    }
    
    function createOrUpdateChart(datasets) {
        const ctx = document.getElementById('goalsChart').getContext('2d');
        if (currentChart) {
            currentChart.destroy();
        }

        // Each dataset gets its own chronological date sequence so seasons
        // both start at game 1 and overlay directly on the x-axis.
        const datasetDates = [];

        const processedDatasets = datasets.map((playerData, index) => {
            const color = chartColors[index % chartColors.length];

            const allDates = [...new Set([...playerData.labels, ...playerData.missedDates])]
                .sort((a, b) => new Date(a) - new Date(b));
            datasetDates.push(allDates);

            const dataMap = new Map(playerData.labels.map((label, i) => [label, playerData.data[i]]));
            let lastValue = 0;
            const fullData = [];
            const pointRadii = [];
            const pointStyles = [];
            const pointColors = [];

            allDates.forEach(date => {
                if (dataMap.has(date)) {
                    lastValue = dataMap.get(date);
                }
                fullData.push(lastValue);

                if (playerData.playedDates.has(date)) {
                    pointRadii.push(4);
                    pointStyles.push('circle');
                    pointColors.push(color);
                } else if (playerData.missedDates.has(date)) {
                    pointRadii.push(5);
                    pointStyles.push('rectRot');
                    pointColors.push('#FFD700');
                } else {
                    pointRadii.push(0);
                    pointStyles.push('circle');
                    pointColors.push(color);
                }
            });

            return {
                label: playerData.playerName,
                data: fullData,
                borderColor: color,
                backgroundColor: color + '33',
                fill: false,
                tension: 0.1,
                borderDash: playerData.season === '20242025' ? [6, 3] : [],
                pointRadius: pointRadii,
                pointStyle: pointStyles,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
            };
        });

        const maxGames = Math.max(...processedDatasets.map(d => d.data.length));
        const gameNumberLabels = Array.from({ length: maxGames }, (_, i) => i + 1);

        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: gameNumberLabels,
                datasets: processedDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Cumulative Fantasy Points', color: '#e8e8e8' },
                        ticks: { color: '#e8e8e8' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        title: { display: true, text: 'Game Number', color: '#e8e8e8' },
                        ticks: { color: '#e8e8e8' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const { datasetIndex, dataIndex } = items[0];
                                const date = datasetDates[datasetIndex]?.[dataIndex];
                                return date ? `Game ${dataIndex + 1} — ${date}` : `Game ${dataIndex + 1}`;
                            }
                        }
                    }
                }
            }
        });
    }

    async function initialize() {
        // Fetch both contracts and GM data at the same time
        const [contracts, gms] = await Promise.all([
            fetch('../contracts.json').then(res => res.json()),
            fetch('../gm.json').then(res => res.json())
        ]);

        // Create a map for easy lookup of GM images
        const gmMap = new Map(gms.map(gm => [gm.name, gm.image]));

        // Populate GM dropdown
        const gmFilterSelect = document.getElementById('gmFilter');
        gms.map(gm => gm.name).sort().forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            gmFilterSelect.appendChild(opt);
        });
        gmFilterSelect.addEventListener('change', () => {
            activeGmFilter = gmFilterSelect.value;
            renderPlayerList(getPlayersToRender());
        });

        const selectionListDiv = document.getElementById('player-selection-list');

        const allPlayers = contracts.filter(c => c.nhlId).sort((a,b) => a.Player.localeCompare(b.Player));
        const extraPlayers = [];
        const checkedSet = new Set();
        const chartedSet = new Set(); // IDs currently shown on the chart

        const SEASONS = [
            { value: '20242025', label: 'S25' },
            { value: '20252026', label: 'S26' }
        ];

        // Populate season toggle-all buttons in the filter bar
        const seasonTogglesDiv = document.getElementById('seasonToggles');
        seasonTogglesDiv.innerHTML = SEASONS.map(s =>
            `<button class="season-toggle-btn" id="toggle-${s.label}" data-season="${s.value}">${s.label}</button>`
        ).join('');

        document.querySelectorAll('.season-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const season = btn.dataset.season;
                const visibleCheckboxes = selectionListDiv.querySelectorAll(
                    `input[type="checkbox"][data-season="${season}"]`
                );
                const anyUnchecked = Array.from(visibleCheckboxes).some(cb => !cb.checked);
                visibleCheckboxes.forEach(cb => {
                    cb.checked = anyUnchecked;
                    if (anyUnchecked) {
                        checkedSet.add(cb.id);
                    } else {
                        checkedSet.delete(cb.id);
                    }
                });
                btn.classList.toggle('active', anyUnchecked);
                renderPlayerList(getPlayersToRender());
            });
        });

        function renderPlayerList(players) {
            selectionListDiv.innerHTML = '';

            players.forEach(player => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'player-item';

                // GM info (or grey placeholder for ad-hoc players)
                const gmInfoDiv = document.createElement('div');
                gmInfoDiv.className = 'gm-info';
                if (player.isExtra) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'gm-photo-placeholder';
                    gmInfoDiv.appendChild(placeholder);
                } else {
                    const gmPhoto = document.createElement('img');
                    gmPhoto.className = 'gm-photo';
                    gmPhoto.src = `../${gmMap.get(player.GM) || 'assets/placeholder.jpg'}`;
                    const contractSpan = document.createElement('span');
                    contractSpan.className = 'contract-years';
                    const yearText = player['Contract Length'] === 1 ? 'year' : 'years';
                    contractSpan.textContent = `${player['Contract Length']} ${yearText}`;
                    gmInfoDiv.appendChild(gmPhoto);
                    gmInfoDiv.appendChild(contractSpan);
                }

                // Two season checkboxes
                const checkboxesDiv = document.createElement('div');
                checkboxesDiv.className = 'season-checkboxes';
                SEASONS.forEach(season => {
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.value = player.nhlId;
                    cb.dataset.name = player.Player;
                    cb.dataset.position = player.Position;
                    cb.dataset.season = season.value;
                    cb.dataset.seasonLabel = season.label;
                    cb.id = `player-${player.nhlId}-${season.value}`;

                    // Restore checked state from persistent set
                    if (checkedSet.has(cb.id)) cb.checked = true;

                    // Sync checkedSet on toggle and update pending pills
                    cb.addEventListener('change', () => {
                        if (cb.checked) {
                            checkedSet.add(cb.id);
                        } else {
                            checkedSet.delete(cb.id);
                            chartedSet.delete(cb.id);
                        }
                        updatePendingList();
                    });

                    checkboxesDiv.appendChild(cb);
                });

                // Player name
                const playerNameSpan = document.createElement('span');
                playerNameSpan.className = 'player-name';
                playerNameSpan.textContent = `${player.Player} (${player.Position})`;

                itemDiv.appendChild(gmInfoDiv);
                itemDiv.appendChild(checkboxesDiv);
                itemDiv.appendChild(playerNameSpan);
                selectionListDiv.appendChild(itemDiv);
            });
            updatePendingList();
        }

        function updatePendingList() {
            const pendingEl = document.getElementById('pendingSelection');
            const allKnown = [...allPlayers, ...extraPlayers];
            const pending = [];
            for (const cbId of checkedSet) {
                if (chartedSet.has(cbId)) continue;
                const match = cbId.match(/^player-(\d+)-(\d+)$/);
                if (!match) continue;
                const [, nhlId, season] = match;
                const player = allKnown.find(p => String(p.nhlId) === nhlId);
                if (!player) continue;
                const seasonLabel = season === '20242025' ? 'S25' : 'S26';
                pending.push({ name: player.Player, seasonLabel, cbId });
            }
            if (pending.length === 0) {
                pendingEl.style.display = 'none';
                return;
            }
            const chips = pending.map(p =>
                `<span class="pending-chip" data-id="${p.cbId}">${p.name} <span class="pending-season">${p.seasonLabel}</span><button class="pending-remove" data-id="${p.cbId}">&times;</button></span>`
            ).join('');
            pendingEl.innerHTML = `<span class="pending-label">Selected:</span>${chips}`;
            pendingEl.style.display = 'flex';

            pendingEl.querySelectorAll('.pending-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    checkedSet.delete(btn.dataset.id);
                    renderPlayerList(getPlayersToRender());
                    updatePendingList();
                });
            });
        }

        let activePositionFilter = 'ALL';
        let rfaOnly = false;
        let activeGmFilter = '';

        function getPlayersToRender() {
            let base = rfaOnly ? allPlayers.filter(p => p['Contract Length'] === 1) : allPlayers;
            if (activePositionFilter !== 'ALL') {
                base = base.filter(p => p.Position.split(',').some(pos => pos.trim() === activePositionFilter));
            }
            if (activeGmFilter) {
                const gmPlayers = base.filter(p => p.GM === activeGmFilter);
                const otherPlayers = base.filter(p => p.GM !== activeGmFilter);
                base = [...gmPlayers, ...otherPlayers];
            }
            return [...extraPlayers, ...base];
        }

        renderPlayerList(getPlayersToRender());

        document.getElementById('rfaFilter').addEventListener('click', function() {
            rfaOnly = !rfaOnly;
            this.classList.toggle('active', rfaOnly);
            renderPlayerList(getPlayersToRender());
        });

        document.querySelectorAll('.pos-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pos-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activePositionFilter = btn.dataset.pos;
                renderPlayerList(getPlayersToRender());
            });
        });

        const searchInput = document.getElementById('playerSearch');
        const searchResultsDiv = document.getElementById('searchResults');
        let searchTimeout = null;

        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            if (query.length < 2) {
                searchResultsDiv.innerHTML = '';
                searchResultsDiv.style.display = 'none';
                return;
            }
            searchTimeout = setTimeout(async () => {
                try {
                    const url = `https://search.d3.nhle.com/api/v1/search/player?culture=en-us&limit=10&q=${encodeURIComponent(query)}&active=true`;
                    const response = await fetch(url);
                    const results = await response.json();
                    searchResultsDiv.innerHTML = '';
                    if (!results || results.length === 0) {
                        searchResultsDiv.style.display = 'none';
                        return;
                    }
                    results.forEach(p => {
                        const item = document.createElement('div');
                        item.className = 'search-result-item';
                        item.textContent = `${p.name} (${p.positionCode})`;
                        item.addEventListener('click', () => {
                            const alreadyAdded = allPlayers.some(ap => String(ap.nhlId) === String(p.playerId)) ||
                                extraPlayers.some(ep => String(ep.nhlId) === String(p.playerId));
                            if (!alreadyAdded) {
                                extraPlayers.push({
                                    nhlId: String(p.playerId),
                                    Player: p.name,
                                    Position: p.positionCode,
                                    isExtra: true
                                });
                                // Cache name/position so shared URLs can restore this player
                                try { localStorage.setItem(`nhl_player_${p.playerId}`, JSON.stringify({ name: p.name, position: p.positionCode })); } catch (_) {}
                                const rfaOnly = document.getElementById('rfaFilter').checked;
                                renderPlayerList(getPlayersToRender(rfaOnly));
                            }
                            searchInput.value = '';
                            searchResultsDiv.innerHTML = '';
                            searchResultsDiv.style.display = 'none';
                        });
                        searchResultsDiv.appendChild(item);
                    });
                    searchResultsDiv.style.display = 'block';
                } catch (e) {
                    console.error('Player search failed:', e);
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResultsDiv.contains(e.target)) {
                searchResultsDiv.innerHTML = '';
                searchResultsDiv.style.display = 'none';
            }
        });

        document.getElementById('chartMobileOverlay').addEventListener('click', () => {
            document.getElementById('chartMobileOverlay').classList.toggle('collapsed');
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            checkedSet.clear();
            chartedSet.clear();
            document.querySelectorAll('#player-selection-list input:checked').forEach(cb => cb.checked = false);
            renderPlayerList(getPlayersToRender());
            if (currentChart) {
                currentChart.destroy();
                currentChart = null;
            }
            const emptyState = document.getElementById('chartEmptyState');
            if (emptyState) emptyState.classList.remove('hidden');
            document.getElementById('chartInset').style.display = 'none';
            document.getElementById('chartLegend').style.display = 'none';
            document.getElementById('chartMobileOverlay').classList.add('hidden');
            document.getElementById('chartFlipBack').innerHTML = '';
            const chartArea = document.querySelector('.chart-area');
            chartArea.classList.remove('flipped');
            const flipBtn = document.getElementById('chartFlipBtn');
            flipBtn.textContent = 'FP/G';
            flipBtn.classList.add('hidden');
            history.replaceState(null, '', window.location.pathname);
        });

        // Card-flip toggle (mobile only visually, but handler works everywhere)
        const flipBtn = document.getElementById('chartFlipBtn');
        flipBtn.classList.add('hidden');
        flipBtn.addEventListener('click', () => {
            const chartArea = document.querySelector('.chart-area');
            chartArea.classList.toggle('flipped');
            flipBtn.textContent = chartArea.classList.contains('flipped') ? 'Chart' : 'FP/G';
        });

        document.getElementById('updateChartBtn').addEventListener('click', async () => {
            const selectedPlayers = [];
            const allKnown = [...allPlayers, ...extraPlayers];
            for (const cbId of checkedSet) {
                // Parse ID format: player-{nhlId}-{season}
                const match = cbId.match(/^player-(\d+)-(\d+)$/);
                if (!match) continue;
                const [, nhlId, season] = match;
                const player = allKnown.find(p => String(p.nhlId) === nhlId);
                if (!player) continue;
                const seasonObj = SEASONS.find(s => s.value === season);
                selectedPlayers.push({
                    id: nhlId,
                    name: player.Player,
                    position: player.Position,
                    season: season,
                    seasonLabel: seasonObj ? seasonObj.label : season
                });
            }

            if (selectedPlayers.length === 0) {
                alert('Please select at least one player.');
                return;
            }

            const updateBtn = document.getElementById('updateChartBtn');
            updateBtn.classList.add('loading');
            updateBtn.disabled = true;

            const datasets = [];
            for (const player of selectedPlayers) {
                const gameLog = await fetchPlayerGameLog(player.id, player.season);
                const processedData = processGameLogForChart(gameLog, player.position);

                // Build per-team date ranges from game log (only count missed games
                // while the player was on that team, to handle trades correctly)
                const teamDateRanges = {};
                gameLog.forEach(g => {
                    if (!g.teamAbbrev) return;
                    if (!teamDateRanges[g.teamAbbrev]) {
                        teamDateRanges[g.teamAbbrev] = { first: g.gameDate, last: g.gameDate };
                    } else {
                        if (g.gameDate < teamDateRanges[g.teamAbbrev].first) teamDateRanges[g.teamAbbrev].first = g.gameDate;
                        if (g.gameDate > teamDateRanges[g.teamAbbrev].last) teamDateRanges[g.teamAbbrev].last = g.gameDate;
                    }
                });

                const teamAbbrevs = Object.keys(teamDateRanges);
                const schedules = await Promise.all(teamAbbrevs.map(abbrev => fetchTeamSchedule(abbrev, player.season)));

                const missedDatesArr = [];
                teamAbbrevs.forEach((abbrev, i) => {
                    const { first, last } = teamDateRanges[abbrev];
                    schedules[i].forEach(d => {
                        if (!processedData.playedDates.has(d) && d >= first && d <= last) {
                            missedDatesArr.push(d);
                        }
                    });
                });
                const missedDates = new Set(missedDatesArr);

                const fullSeasonLabel = player.season === '20242025' ? '24-25' : '25-26';
                const sortedLog = gameLog.slice().sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
                const teamAbbrev = sortedLog.length > 0 ? sortedLog[sortedLog.length - 1].teamAbbrev : '';
                datasets.push({
                    playerName: `${player.name} (${fullSeasonLabel})`,
                    position: player.position,
                    season: player.season,
                    teamAbbrev,
                    labels: processedData.labels,
                    data: processedData.data,
                    playedDates: processedData.playedDates,
                    missedDates
                });
            }
            createOrUpdateChart(datasets);

            // Sync chartedSet so pending list clears for these players
            chartedSet.clear();
            for (const cbId of checkedSet) chartedSet.add(cbId);
            updatePendingList();

            // Reset flip state when chart updates
            const chartArea = document.querySelector('.chart-area');
            chartArea.classList.remove('flipped');
            document.getElementById('chartFlipBtn').textContent = 'FP/G';

            // Populate the FP/G inset
            const insetEl = document.getElementById('chartInset');
            if (datasets.length > 0) {
                // "Most aggrieved" easter eggs for stolen players (25-26 only)
                const aggrievedMap = {
                    '8484144': { name: 'Connor Bedard', photo: '../gm-assets/adam.jpeg' },
                    '8476453': { name: 'Nikita Kucherov', photo: '../gm-assets/seedo.jpeg' },
                };
                const aggrievedHits = selectedPlayers
                    .filter(p => p.season === '20252026' && aggrievedMap[p.id])
                    .map(p => aggrievedMap[p.id]);

                const rowData = datasets.map((d, i) => {
                    const gamesPlayed = d.playedDates.size;
                    const totalPts = d.data.length > 0 ? d.data[d.data.length - 1] : 0;
                    const fpgNum = gamesPlayed > 0 ? totalPts / gamesPlayed : -1;
                    const fpg = fpgNum >= 0 ? fpgNum.toFixed(2) : '—';
                    const color = chartColors[i % chartColors.length];
                    const teamLabel = d.teamAbbrev ? ` <span class="inset-team">${d.teamAbbrev}</span>` : '';
                    const sharedHtml = `<tr>
                        <td><span class="inset-color" style="background:${color}"></span>${d.playerName}${teamLabel}</td>
                        <td>${d.position || '—'}</td>
                        <td>${gamesPlayed}</td>
                        <td>${fpg}</td>
                    </tr>`;
                    return { fpgNum, gamesPlayed, html: sharedHtml, mobileHtml: sharedHtml };
                });
                rowData.sort((a, b) => b.fpgNum - a.fpgNum);
                const rows = rowData.map(r => r.html).join('');
                const mobileRows = rowData.map(r => r.mobileHtml).join('');

                const aggrievedRows = aggrievedHits.map(a =>
                    `<tr class="aggrieved-row">
                        <td colspan="4">Most aggrieved: <img src="${a.photo}" class="aggrieved-photo"></td>
                    </tr>`
                ).join('');

                insetEl.innerHTML = `<button class="inset-toggle" onclick="this.parentElement.classList.toggle('collapsed')"></button>
                <table>
                    <thead><tr><th>Stats</th><th>Pos</th><th>GP</th><th>FP/G</th></tr></thead>
                    <tbody>${rows}${aggrievedRows}</tbody>
                </table>`;
                insetEl.style.display = 'block';
                insetEl.classList.remove('collapsed');
                document.getElementById('chartLegend').style.display = 'flex';

                // Mobile chart overlay — color dot + player name only, sorted by total FP desc
                const mobileOverlayEl = document.getElementById('chartMobileOverlay');
                const overlayRowsHtml = datasets
                    .map((d, i) => ({ d, i, totalFp: d.data.length > 0 ? d.data[d.data.length - 1] : 0 }))
                    .sort((a, b) => b.totalFp - a.totalFp)
                    .map(({ d, i }) => {
                        const color = chartColors[i % chartColors.length];
                        return `<div class="chart-mobile-overlay-row"><span class="inset-color" style="background:${color}"></span>${d.playerName}</div>`;
                    }).join('');
                mobileOverlayEl.innerHTML = `<div class="chart-mobile-overlay-header">Players <span class="overlay-chevron">▾</span></div><div class="chart-mobile-overlay-body">${overlayRowsHtml}</div>`;
                mobileOverlayEl.classList.remove('hidden');
                mobileOverlayEl.classList.remove('collapsed');

                // Populate back-face for mobile card flip
                const flipBackEl = document.getElementById('chartFlipBack');
                flipBackEl.innerHTML = `<table>
                    <thead><tr><th>Stats</th><th>Pos</th><th>GP</th><th>FP/G</th></tr></thead>
                    <tbody>${mobileRows}${aggrievedRows}</tbody>
                </table>`;
                document.getElementById('chartFlipBtn').classList.remove('hidden');
            } else {
                insetEl.style.display = 'none';
                document.getElementById('chartLegend').style.display = 'none';
                document.getElementById('chartMobileOverlay').classList.add('hidden');
                document.getElementById('chartFlipBack').innerHTML = '';
                document.getElementById('chartFlipBtn').classList.add('hidden');
            }

            // Update URL with selected players
            const paramParts = selectedPlayers.map(p => `${p.id}.${p.season}`);
            const newUrl = `${window.location.pathname}?p=${paramParts.join(',')}`;
            history.replaceState(null, '', newUrl);

            // Hide empty state, show chart
            const emptyState = document.getElementById('chartEmptyState');
            if (emptyState) emptyState.classList.add('hidden');

            updateBtn.classList.remove('loading');
            updateBtn.disabled = false;
        });

        // Auto-load from URL params
        // Supports: ?p=id.season,id.season  OR  ?playerId=id&season=season (single player from contracts page)
        const urlParams = new URLSearchParams(window.location.search);
        const pParam = urlParams.get('p');
        const singleId = urlParams.get('playerId');
        const singleSeason = urlParams.get('season');

        let preselections = [];
        if (pParam) {
            preselections = pParam.split(',').map(entry => {
                const [id, season] = entry.split('.');
                return { id, season };
            });
        } else if (singleId && singleSeason) {
            preselections = [{ id: singleId, season: singleSeason }];
        }

        if (preselections.length > 0) {
            // For player IDs not in the league data, fetch from NHL API and add to extraPlayers
            const unknownIds = [...new Set(preselections.map(p => p.id))]
                .filter(id => !allPlayers.some(p => String(p.nhlId) === id));

            if (unknownIds.length > 0) {
                // Add placeholders immediately so checkboxes exist
                unknownIds.forEach(id => {
                    extraPlayers.push({ nhlId: String(id), Player: `#${id}`, Position: '?', isExtra: true });
                });

                // Fetch real names via backend (proxies NHL API server-side, no CORS issue)
                try {
                    const infoRes = await fetch(`${ENDPOINT_URL}?requestType=playerInfo&playerIds=${unknownIds.join(',')}`);
                    const infoData = await infoRes.json();
                    unknownIds.forEach(id => {
                        const info = infoData[id];
                        if (info) {
                            const entry = extraPlayers.find(p => p.nhlId === String(id));
                            if (entry) { entry.Player = info.name; entry.Position = info.position; }
                            try { localStorage.setItem(`nhl_player_${id}`, JSON.stringify(info)); } catch (_) {}
                        }
                    });
                } catch (e) {
                    // Fall back to localStorage cache if backend unavailable
                    unknownIds.forEach(id => {
                        try {
                            const cached = localStorage.getItem(`nhl_player_${id}`);
                            if (cached) {
                                const info = JSON.parse(cached);
                                const entry = extraPlayers.find(p => p.nhlId === String(id));
                                if (entry) { entry.Player = info.name; entry.Position = info.position; }
                            }
                        } catch (_) {}
                    });
                }
                renderPlayerList(getPlayersToRender());
            }

            for (const { id, season } of preselections) {
                const cbId = `player-${id}-${season}`;
                const allKnown = [...allPlayers, ...extraPlayers];
                if (allKnown.some(p => String(p.nhlId) === id)) {
                    checkedSet.add(cbId);
                }
            }
            // Re-render so checked players are pinned to top and checked
            renderPlayerList(getPlayersToRender());
            if (checkedSet.size > 0) {
                const firstCb = document.getElementById(`player-${preselections[0].id}-${preselections[0].season}`);
                if (firstCb) firstCb.scrollIntoView({ block: 'center' });
                document.getElementById('updateChartBtn').click();
            }
        }
    }

    initialize();
});