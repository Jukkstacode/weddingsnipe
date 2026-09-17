// Shared cumulative-fantasy-points line chart (Chart.js must be loaded globally).
// Used by stats/ and beer-league.html so both draw the same way.

export const COLORS = ['#5fb3ff', '#ff4d4d', '#e0b04c', '#4bd4a8', '#c084fc', '#ff9f40', '#f472b6', '#a3e635', '#22d3ee', '#fb7185'];

// Dashed vertical line at the hovered game.
export const crosshair = {
  id: 'crosshair',
  afterDatasetsDraw(c) {
    const active = c.tooltip?.getActiveElements?.();
    if (!active?.length) return;
    const { x } = active[0].element;
    const { top, bottom } = c.chartArea;
    const ctx = c.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(234,241,248,0.25)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    ctx.restore();
  },
};

function gradientFor(c, color) {
  const { top, bottom } = c.chartArea || { top: 0, bottom: 400 };
  const g = c.ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, color + '33');
  g.addColorStop(1, color + '00');
  return g;
}

export function chartOptions() {
  const grid = 'rgba(142,162,184,0.10)', tick = '#8ea2b8';
  const font = { family: 'Barlow Condensed', weight: 700, size: 13 };
  const perPoint = 6;
  return {
    responsive: true, maintainAspectRatio: false,
    animation: {
      x: { type: 'number', easing: 'linear', duration: perPoint, from: NaN,
        delay(ctx) { if (ctx.type !== 'data' || ctx.xStarted) return 0; ctx.xStarted = true; return ctx.index * perPoint; } },
      y: { type: 'number', easing: 'linear', duration: perPoint, from: NaN,
        delay(ctx) { if (ctx.type !== 'data' || ctx.yStarted) return 0; ctx.yStarted = true; return ctx.index * perPoint; } },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { title: { display: true, text: 'GAME', color: tick, font }, ticks: { color: tick, maxTicksLimit: 12 }, grid: { color: grid }, border: { color: grid } },
      y: { beginAtZero: true, title: { display: true, text: 'CUMULATIVE FP', color: tick, font }, ticks: { color: tick }, grid: { color: grid }, border: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,29,46,0.96)', borderColor: '#1f3247', borderWidth: 1, padding: 10,
        titleColor: '#8ea2b8', titleFont: { family: 'Barlow Condensed', weight: 700, size: 13 },
        bodyColor: '#eaf1f8', bodyFont: { family: 'Atkinson Hyperlegible', size: 12 },
        usePointStyle: true, boxPadding: 4,
        itemSort: (a, b) => b.raw - a.raw,
        callbacks: {
          title: items => `GAME ${items[0].dataIndex + 1}`,
          label: it => {
            const d = it.dataset.dates[it.dataIndex];
            return ` ${it.dataset.label}  ${it.formattedValue} FP${d ? `  ·  ${d}` : ''}`;
          },
        },
      },
    },
  };
}

// points: [{ date, y, missed }]. Missed games draw as gold diamonds; prior seasons dashed.
export function lineDataset({ label, color, points, prior = false }) {
  return {
    label,
    data: points.map(pt => pt.y),
    dates: points.map(pt => pt.date),
    borderColor: color, borderWidth: prior ? 1.5 : 2.5, borderCapStyle: 'round', borderJoinStyle: 'round',
    tension: 0.3, fill: !prior,
    backgroundColor: c => gradientFor(c.chart, color),
    borderDash: prior ? [6, 4] : [],
    pointRadius: points.map(pt => pt.missed ? 4.5 : 0),
    pointHoverRadius: 5, pointHoverBorderWidth: 2, pointHoverBorderColor: '#0a1420',
    pointStyle: points.map(pt => pt.missed ? 'rectRot' : 'circle'),
    pointBackgroundColor: points.map(pt => pt.missed ? '#e0b04c' : color),
    pointBorderColor: points.map(pt => pt.missed ? '#e0b04c' : color),
  };
}

// Draws (or updates) the chart on `canvas`. Returns the Chart instance.
export function drawChart(canvas, chart, datasets) {
  const maxLen = Math.max(0, ...datasets.map(d => d.data.length));
  const labels = Array.from({ length: maxLen }, (_, i) => i + 1);
  if (chart) { chart.data.labels = labels; chart.data.datasets = datasets; chart.update(); return chart; }
  return new Chart(canvas, { type: 'line', data: { labels, datasets }, options: chartOptions(), plugins: [crosshair] });
}
