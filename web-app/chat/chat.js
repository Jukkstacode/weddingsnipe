const API_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';

let selectedTrade = null;

const reportContainer = document.getElementById('report-container');
const reportContent = document.getElementById('report-content');
const analyzeBtn = document.getElementById('analyze-btn');
const tradeList = document.getElementById('trade-list');
const userContext = document.getElementById('user-context');
const loading = document.getElementById('loading');

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function posClass(position) {
    if (!position) return 'pos-unknown';
    const p = position.split(',')[0].trim().toUpperCase();
    if (p === 'C') return 'pos-c';
    if (p === 'LW' || p === 'RW') return 'pos-w';
    if (p === 'D') return 'pos-d';
    if (p === 'G') return 'pos-g';
    return 'pos-unknown';
}

function renderSideHTML(team) {
    const g = team.gives || team.receives || {};
    const players = [
        ...(g.forwards || []),
        ...(g.defensemen || []),
        ...(g.goalies || [])
    ];
    const picks = g.draftPicks || [];

    const playersHTML = players.map(p => {
        const pc = posClass(p.position);
        const rfaTag = p.contract === '1yr'
            ? '<span class="inline-rfa">RFA</span>'
            : p.contract === '2yr' ? '<span class="inline-rfa multi">2yr</span>' : '';
        return `<div class="ci-player"><span class="pos-dot ${pc}"></span><span class="ci-name">${p.name}</span>${rfaTag}</div>`;
    }).join('');

    const picksHTML = picks.map(pk => {
        const short = pk.replace('2026 ', '').replace('Round ', 'Rd ');
        return `<div class="ci-pick">${short}</div>`;
    }).join('');

    return `<div class="card-side">
        <div class="card-gm">${team.gm}</div>
        <div class="card-items">${playersHTML}${picksHTML}</div>
    </div>`;
}

function buildCard(trade, index) {
    const btn = document.createElement('button');
    btn.className = 'trade-card' + (trade.rfa_flagged ? ' rfa-flagged' : '');
    btn.dataset.index = index;

    const badges = [];
    if (trade.type === '3-way') badges.push('<span class="tc-badge badge-3way">3-way</span>');
    if (trade.rfa_flagged) badges.push('<span class="tc-badge badge-rfa">⚠️</span>');
    const badgeHTML = badges.join('');

    let bodyHTML;
    if (trade.type === '3-way') {
        bodyHTML = `<div class="card-body three-way">
            ${renderSideHTML(trade.teamA)}
            <div class="card-rule"></div>
            ${renderSideHTML(trade.teamB)}
            <div class="card-rule"></div>
            ${renderSideHTML(trade.teamC)}
        </div>`;
    } else {
        bodyHTML = `<div class="card-body">
            ${renderSideHTML(trade.teamA)}
            <div class="card-rule"></div>
            ${renderSideHTML(trade.teamB)}
        </div>`;
    }

    btn.innerHTML = `
        <div class="card-header">
            <span class="card-date-chip">${formatDate(trade.date)}</span>
            <span class="card-header-badges">${badgeHTML}</span>
        </div>
        ${bodyHTML}`;

    btn.addEventListener('click', () => selectTrade(btn, trade));
    return btn;
}

async function loadTrades() {
    try {
        const response = await fetch('../trades.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const trades = await response.json();

        if (!trades.length) {
            tradeList.innerHTML = '<p style="color:#999;font-size:0.9rem">No trades found.</p>';
            return;
        }

        const track = document.createElement('div');
        track.className = 'trade-scroll-track';
        trades.forEach((trade, index) => track.appendChild(buildCard(trade, index)));
        tradeList.appendChild(track);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'scroll-nav scroll-prev';
        prevBtn.innerHTML = '&#8249;';
        prevBtn.addEventListener('click', () => track.scrollBy({ left: -280, behavior: 'smooth' }));

        const nextBtn = document.createElement('button');
        nextBtn.className = 'scroll-nav scroll-next';
        nextBtn.innerHTML = '&#8250;';
        nextBtn.addEventListener('click', () => track.scrollBy({ left: 280, behavior: 'smooth' }));

        const wrapper = document.createElement('div');
        wrapper.className = 'scroll-wrapper';
        track.parentNode.insertBefore(wrapper, track);
        wrapper.appendChild(prevBtn);
        wrapper.appendChild(track);
        wrapper.appendChild(nextBtn);
    } catch (err) {
        tradeList.innerHTML = `<p style="color:#f66;font-size:0.9rem">Failed to load trades: ${err.message}</p>`;
    }
}

loadTrades();

function selectTrade(btn, trade) {
    document.querySelectorAll('.trade-card').forEach(b => b.classList.remove('selected'));

    if (selectedTrade === trade) {
        selectedTrade = null;
        userContext.disabled = true;
        analyzeBtn.disabled = true;
        reportContainer.style.display = 'none';
        return;
    }

    btn.classList.add('selected');
    selectedTrade = trade;
    userContext.disabled = false;
    analyzeBtn.disabled = false;
    reportContainer.style.display = 'none';
}

function formatReport(text) {
    return text
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

async function analyzeTrade() {
    if (!selectedTrade) return;

    analyzeBtn.disabled = true;
    loading.style.display = 'block';
    reportContainer.style.display = 'none';

    const context = userContext.value.trim();
    const message = context
        ? `Analyze this trade. Additional context: ${context}`
        : 'Analyze this trade.';

    try {
        const response = await fetch(`${API_URL}?requestType=chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, tradeContext: selectedTrade }),
        });

        const data = await response.json();
        reportContent.innerHTML = formatReport(data.reply);
        reportContainer.style.display = 'block';
    } catch (error) {
        reportContent.innerHTML = '<p>Error: Could not generate analysis. Please try again.</p>';
        reportContainer.style.display = 'block';
    }

    loading.style.display = 'none';
    analyzeBtn.disabled = false;
}

analyzeBtn.addEventListener('click', analyzeTrade);
