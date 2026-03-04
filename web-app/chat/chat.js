const API_URL = 'http://localhost:8080';

let selectedTrade = null;

const reportContainer = document.getElementById('report-container');
const reportContent = document.getElementById('report-content');
const analyzeBtn = document.getElementById('analyze-btn');
const tradeSelect = document.getElementById('trade-select');
const userContext = document.getElementById('user-context');
const loading = document.getElementById('loading');

// Load trades into the dropdown
async function loadTrades() {
    const response = await fetch('../trades.json');
    const trades = await response.json();

    trades.forEach((trade, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = trade.name;
        tradeSelect.appendChild(option);
    });

    return trades;
}

const tradesPromise = loadTrades();

// When a trade is selected, enable the controls
tradeSelect.addEventListener('change', async () => {
    const trades = await tradesPromise;
    const index = tradeSelect.value;

    if (index === '') {
        selectedTrade = null;
        userContext.disabled = true;
        analyzeBtn.disabled = true;
        reportContainer.style.display = 'none';
        return;
    }

    selectedTrade = trades[index];
    userContext.disabled = false;
    analyzeBtn.disabled = false;
    reportContainer.style.display = 'none';
});

// Convert markdown-style text to HTML
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

// Analyze the trade
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
            body: JSON.stringify({
                message,
                tradeContext: selectedTrade,
            }),
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
