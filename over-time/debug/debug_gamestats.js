document.addEventListener('DOMContentLoaded', async () => {
    const SEASON = '20242025';
    const ENDPOINT_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';

    // --- SCORING LOGIC ---
    const FANTASY_SCORING = {
        goals: 3, assists: 2, plusMinus: 1, pim: 0.25, powerPlayPoints: 1, shortHandedPoints: 1, gameWinningGoals: 1.5,
        wins: 3, goalsAgainst: -1.5, saves: 0.2, shutouts: 6
    };

    function calculateFantasyPointsForSkaterGame(game) {
        if (!game || game.timeOnIce === "00:00") return 0;
        const ppp = (game.powerPlayGoals || 0) + (game.powerPlayPoints || 0);
        const shp = (game.shorthandedGoals || 0) + (game.shorthandedAssists || 0);
        const { goals = 0, assists = 0, plusMinus = 0, pim = 0, gameWinningGoal = 0 } = game;
        return (goals * FANTASY_SCORING.goals) + (assists * FANTASY_SCORING.assists) + (plusMinus * FANTASY_SCORING.plusMinus) + (pim * FANTASY_SCORING.pim) + (ppp * FANTASY_SCORING.powerPlayPoints) + (shp * FANTASY_SCORING.shortHandedPoints) + (gameWinningGoal * FANTASY_SCORING.gameWinningGoals);
    }

    function calculateFantasyPointsForGoalieGame(game) {
        if (!game || game.timeOnIce === "00:00") return 0;
        const { decision, saves = 0, goalsAgainst = 0 } = game;
        let points = 0;
        if (decision === 'W') points += FANTASY_SCORING.wins;
        points += (saves * FANTASY_SCORING.saves);
        points += (goalsAgainst * FANTASY_SCORING.goalsAgainst);
        if (goalsAgainst === 0 && game.decision) points += FANTASY_SCORING.shutouts;
        return points;
    }

    async function fetchPlayerGameLog(playerId) {
        const response = await fetch(`${ENDPOINT_URL}?requestType=gameLog&playerIds=${playerId}&season=${SEASON}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.gameLog || [];
    }

    // --- MAIN LOGIC ---
    const playerSelect = document.getElementById('player-select');
    const loader = document.getElementById('loader');
    const tableBody = document.getElementById('log-tbody');

    try {
        const contractsResponse = await fetch('/contracts.json');
        if (!contractsResponse.ok) throw new Error(`Could not load contracts.json. Status: ${contractsResponse.status}`);
        const contracts = await contractsResponse.json();

        contracts.filter(c => c.nhlId).sort((a,b) => a.Player.localeCompare(b.Player)).forEach(player => {
            const option = document.createElement('option');
            option.value = player.nhlId;
            option.textContent = `${player.Player} (${player.Position})`;
            option.dataset.position = player.Position;
            playerSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Initialization failed:", error);
        loader.textContent = `Error: ${error.message}. Please check file path and ensure contracts.json is valid.`;
        loader.style.display = 'block';
    }

    playerSelect.addEventListener('change', async (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const playerId = selectedOption.value;
        const position = selectedOption.dataset.position;

        if (!playerId) {
            tableBody.innerHTML = '';
            // Clear totals when no player is selected
            return;
        }

        loader.style.display = 'block';
        tableBody.innerHTML = '';
        
        const gameLog = await fetchPlayerGameLog(playerId);
        const gameLogMap = new Map(gameLog.map(game => [game.gameDate, game]));
        const allGameDates = [...new Set(gameLog.map(g => g.gameDate))].sort((a,b) => new Date(a) - new Date(b));
        
        const totals = { g: 0, a: 0, pim: 0, pm: 0, ppg: 0, ppa: 0, shp: 0, saves: 0, ga: 0, fp: 0 };

        for (const date of allGameDates) {
            const game = gameLogMap.get(date);
            const row = document.createElement('tr');
            let fantasyPoints = 0;

            if (game && game.timeOnIce !== "00:00") {
                if (position.includes('G')) {
                    fantasyPoints = calculateFantasyPointsForGoalieGame(game);
                    totals.saves += game.saves || 0;
                    totals.ga += game.goalsAgainst || 0;
                    row.innerHTML = `
                        <td>${game.gameDate}</td><td>${game.opponentAbbrev}</td><td>${game.decision || '--'}</td>
                        <td>--</td><td>--</td><td>--</td><td>--</td><td>--</td><td>--</td><td>--</td>
                        <td>${game.saves || 0}</td><td>${game.goalsAgainst || 0}</td><td>${game.timeOnIce}</td>
                        <td>${fantasyPoints.toFixed(2)}</td>
                    `;
                } else {
                    fantasyPoints = calculateFantasyPointsForSkaterGame(game);
                    const ppg = game.powerPlayGoals || 0;
                    const ppa = game.powerPlayAssists || 0;
                    const shp = (game.shorthandedGoals || 0) + (game.shorthandedAssists || 0);
                    
                    totals.g += game.goals || 0;
                    totals.a += game.assists || 0;
                    totals.pim += game.pim || 0;
                    totals.pm += game.plusMinus || 0;
                    totals.ppg += ppg;
                    totals.ppa += ppa;
                    totals.shp += shp;

                    row.innerHTML = `
                        <td>${game.gameDate}</td><td>${game.opponentAbbrev}</td><td>--</td>
                        <td>${game.goals || 0}</td><td>${game.assists || 0}</td>
                        <td>${game.pim || 0}</td><td>${game.plusMinus || 0}</td>
                        <td>${ppg}</td>
                        <td>${ppa}</td>
                        <td>${shp}</td>
                        <td>--</td><td>--</td><td>${game.timeOnIce}</td>
                        <td>${fantasyPoints.toFixed(2)}</td>
                    `;
                }
                totals.fp += fantasyPoints;
            } else {
                 row.classList.add('did-not-play');
                 row.innerHTML = `<td>${date}</td><td colspan="12">Did Not Play</td><td>0.00</td>`;
            }
            tableBody.appendChild(row);
        }

        // Update the footer with the final totals
        document.getElementById('total-g').textContent = totals.g;
        document.getElementById('total-a').textContent = totals.a;
        document.getElementById('total-pim').textContent = totals.pim;
        document.getElementById('total-pm').textContent = totals.pm;
        document.getElementById('total-ppg').textContent = totals.ppg;
        document.getElementById('total-ppa').textContent = totals.ppa;
        document.getElementById('total-shp').textContent = totals.shp;
        document.getElementById('total-saves').textContent = totals.saves;
        document.getElementById('total-ga').textContent = totals.ga;
        document.getElementById('cumulative-total').textContent = totals.fp.toFixed(2);

        loader.style.display = 'none';
    });
});