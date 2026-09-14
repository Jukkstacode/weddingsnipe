const API_URL = 'https://nhl-stats-cacher-347732622266.us-west1.run.app';

let selectedTrade = null;
let gmImageMap = {};

let snarkLevel = 'low';

document.querySelectorAll('.snark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.snark-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        snarkLevel = btn.dataset.level;
    });
});


const track       = document.getElementById('tradeTrack');
const analyzePanel = document.getElementById('analyzePanel');
const analyzeBtn  = document.getElementById('analyzeBtn');
const userContext = document.getElementById('userContext');
const reportContainer = document.getElementById('reportContainer');
const reportContent   = document.getElementById('reportContent');
const loading     = document.getElementById('loading');
const scrollPrev  = document.getElementById('scrollPrev');
const scrollNext  = document.getElementById('scrollNext');

scrollPrev.addEventListener('click', () => track.scrollBy({ left: -400, behavior: 'smooth' }));
scrollNext.addEventListener('click', () => track.scrollBy({ left:  400, behavior: 'smooth' }));

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function posClass(position) {
    const p = (position || '').split(',')[0].trim().toUpperCase();
    if (p === 'C')              return 'pos-c';
    if (p === 'LW' || p === 'RW') return 'pos-w';
    if (p === 'D')              return 'pos-d';
    if (p === 'G')              return 'pos-g';
    return 'pos-unknown';
}

function gmAvatar(gmName) {
    const img = gmImageMap[gmName.toLowerCase()];
    if (!img) return `<div class="gm-avatar gm-avatar-fallback">${gmName[0]}</div>`;
    return `<img class="gm-avatar" src="${img}" alt="${gmName}">`;
}

function renderSide(team, itemsOverride) {
    const g = itemsOverride || team.receives || team.gives || {};
    const players = [
        ...(g.forwards   || []),
        ...(g.defensemen || []),
        ...(g.goalies    || [])
    ];
    const picks = g.draftPicks || [];

    const playersHTML = players.map(p => {
        const pc = posClass(p.position);
        const tag = p.contract === '1yr'
            ? '<span class="ci-tag rfa">RFA</span>'
            : p.contract === '2yr' ? '<span class="ci-tag multi">2yr</span>' : '';
        return `<div class="ci-player">
            <span class="pos-dot ${pc}"></span>
            <span class="ci-name">${p.name}</span>${tag}
        </div>`;
    }).join('');

    const picksHTML = picks.map(pk =>
        `<div class="ci-pick">${pk.replace('2026 ', '').replace('Round ', 'Rd ')}</div>`
    ).join('');

    return `<div class="card-side">
        <div class="card-gm-row">
            ${gmAvatar(team.gm)}
            <span class="card-gm-name">${team.gm}</span>
        </div>
        <div class="card-items">${playersHTML}${picksHTML || '<div class="ci-pick muted">—</div>'}</div>
    </div>`;
}

function buildCard(trade, index) {
    const btn = document.createElement('button');
    btn.className = 'trade-card' + (trade.rfa_flagged ? ' rfa-flagged' : '');
    btn.dataset.index = index;

    const badges = [];
    if (trade.type === '3-way') badges.push('<span class="tc-badge badge-3way">3-way</span>');
    if (trade.rfa_flagged)      badges.push('<span class="tc-badge badge-rfa">⚠️ RFA</span>');

    let sidesHTML;
    if (trade.type === '3-way') {
        sidesHTML = `<div class="card-body three-way">
            ${renderSide(trade.teamA)}
            <div class="card-rule"></div>
            ${renderSide(trade.teamB)}
            <div class="card-rule"></div>
            ${renderSide(trade.teamC)}
        </div>`;
    } else {
        sidesHTML = `<div class="card-body">
            ${renderSide(trade.teamA, trade.teamB.gives)}
            <div class="card-rule"></div>
            ${renderSide(trade.teamB, trade.teamA.gives)}
        </div>`;
    }

    btn.innerHTML = `
        <div class="card-header">
            <span class="card-date">${formatDate(trade.date)}</span>
            <span class="card-badges">${badges.join('')}</span>
        </div>
        ${sidesHTML}`;

    btn.addEventListener('click', () => selectTrade(btn, trade));
    return btn;
}

async function loadAll() {
    const [tradesRes, gmRes] = await Promise.all([
        fetch('trades.json'),
        fetch('gm.json')
    ]);

    const trades = await tradesRes.json();
    const gms    = await gmRes.json();

    gms.forEach(gm => { gmImageMap[gm.name.toLowerCase()] = gm.image; });

    if (!trades.length) {
        track.innerHTML = '<p style="color:#999">No trades found.</p>';
        return;
    }

    trades.forEach((trade, index) => track.appendChild(buildCard(trade, index)));
}

loadAll().catch(err => {
    track.innerHTML = `<p style="color:#f66">Failed to load: ${err.message}</p>`;
});

function selectTrade(btn, trade) {
    document.querySelectorAll('.trade-card').forEach(b => b.classList.remove('selected'));

    if (selectedTrade === trade) {
        selectedTrade = null;
        analyzePanel.classList.remove('visible');
        reportContainer.style.display = 'none';
        return;
    }

    btn.classList.add('selected');
    selectedTrade = trade;
    analyzePanel.classList.add('visible');
    reportContainer.style.display = 'none';
}

function formatReport(text) {
    return text
        .replace(/## (.+)/g,      '<h2>$1</h2>')
        .replace(/### (.+)/g,     '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,    '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g,   '<br>')
        .replace(/^/,     '<p>')
        .replace(/$/,     '</p>');
}

analyzeBtn.addEventListener('click', async () => {
    if (!selectedTrade) return;

    analyzeBtn.disabled = true;
    loading.style.display = 'block';
    reportContainer.style.display = 'none';

    const context = userContext.value.trim();
    const message = context ? `Analyze this trade. Additional context: ${context}` : 'Analyze this trade.';

    try {
        const res  = await fetch(`${API_URL}?requestType=chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, tradeContext: selectedTrade, snarkLevel }),
        });
        const data = await res.json();
        reportContent.innerHTML = formatReport(data.reply);
        reportContainer.style.display = 'block';
    } catch {
        reportContent.innerHTML = '<p>Error: Could not generate analysis. Please try again.</p>';
        reportContainer.style.display = 'block';
    }

    loading.style.display = 'none';
    analyzeBtn.disabled = false;
});
