(() => {
  'use strict';
  const root = document.getElementById('ma200-history');
  if (!root) return;
  const NS = 'http://www.w3.org/2000/svg';
  const tickers = ['SPY', 'QQQ'];
  const metrics = ['ma200_pct', 'atr200_dev'];
  const colors = { line: '#D5695D', q90: '#5D8CA8', q95: '#65A479', band: '#E7DCB8', grid: '#E4DBC6', text: '#3B3630' };
  const range = root.querySelector('#ma200-range');
  const status = root.querySelector('#ma200-status');
  const panels = [];
  let data, visible = {}, byDate, selectedDate;
  const num = x => Number(x).toFixed(2);
  const signed = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);
  const dateNum = s => Date.parse(s + 'T00:00:00Z');
  const dateLabel = s => s.replaceAll('-', '/');
  function el(name, attributes = {}, parent, text) {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }
  function niceStep(v) {
    const power = 10 ** Math.floor(Math.log10(v));
    const n = v / power;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power;
  }
  function nearest(date) {
    const rows = visible.SPY;
    let low = 0, high = rows.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (rows[mid].ms < date) low = mid + 1;
      else high = mid;
    }
    return low > 0 && Math.abs(rows[low - 1].ms - date) < Math.abs(rows[low].ms - date) ? low - 1 : low;
  }
  function selectDay(date) {
    selectedDate = date;
    for (const p of panels) {
      const row = byDate[p.ticker].get(date);
      if (!row) continue;
      const value = row[p.metric];
      const x = p.x(row.ms), y = p.y(value);
      p.cursor.setAttribute('x1', x); p.cursor.setAttribute('x2', x);
      p.dot.setAttribute('cx', x); p.dot.setAttribute('cy', y);
      p.readout.textContent = `${dateLabel(date)}　${signed(value)}${p.metric === 'ma200_pct' ? '％' : ' ATR'}　｜　${row.interval > 0 ? '上昇区間内' : '上昇区間外'}`;
      p.svg.setAttribute('aria-label', `${p.ticker}、${dateLabel(date)}のSMA200乖離は${signed(value)}${p.metric === 'ma200_pct' ? 'パーセント' : 'ATR倍'}。左右の矢印キーで営業日を移動できます。`);
    }
  }
  function limits(metric) {
    const values = tickers.flatMap(t => visible[t].map(r => r[metric]));
    values.push(0, ...tickers.flatMap(t => Object.values(data.thresholds[t][metric])));
    let min = Infinity, max = -Infinity;
    for (const v of values) { if (v < min) min = v; if (v > max) max = v; }
    const step = niceStep((max - min) / 5 || 1);
    return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step, step };
  }
  function chart(ticker, metric, bound) {
    const host = root.querySelector(`[data-ma200-ticker="${ticker}"][data-ma200-metric="${metric}"]`);
    host.replaceChildren();
    const W = Math.max(300, Math.round(host.clientWidth));
    const H = 246, margin = { left: 44, right: 17, top: 25, bottom: 32 };
    const rows = visible[ticker];
    const from = rows[0].ms, to = rows[rows.length - 1].ms;
    const x = ms => margin.left + (ms - from) / (to - from || 1) * (W - margin.left - margin.right);
    const y = v => H - margin.bottom - (v - bound.min) / (bound.max - bound.min || 1) * (H - margin.top - margin.bottom);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', tabindex: 0, 'data-chart-ready': 'true' }, host);
    el('title', {}, svg, `${ticker}のSMA200乖離・${metric === 'ma200_pct' ? 'パーセント' : 'ATR倍率'}`);
    el('desc', {}, svg, '金色は定義した上昇区間、青破線は上位10%境界、緑破線は上位5%境界。非上昇区間も含めた価格履歴を表示します。');
    for (const z of data.intervals[ticker]) {
      const start = Math.max(from, dateNum(z.start));
      const end = Math.min(to, dateNum(z.end));
      if (end >= start) el('rect', { x: x(start), y: margin.top, width: Math.max(1, x(end) - x(start)), height: H - margin.top - margin.bottom, fill: colors.band, opacity: .65 }, svg);
    }
    for (let v = bound.min; v <= bound.max + bound.step / 10; v += bound.step) {
      el('line', { x1: margin.left, x2: W - margin.right, y1: y(v), y2: y(v), stroke: v === 0 ? '#9d9587' : colors.grid, 'stroke-width': v === 0 ? 1.1 : .8 }, svg);
      el('text', { x: margin.left - 7, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: colors.text }, svg, String(Math.round(v * 100) / 100));
    }
    const ticks = W < 450 ? 3 : 5;
    for (let i = 0; i < ticks; i++) {
      const ms = from + (to - from) * i / (ticks - 1);
      const d = new Date(ms), label = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      el('text', { x: x(ms), y: H - 9, 'text-anchor': i === 0 ? 'start' : i === ticks - 1 ? 'end' : 'middle', 'font-size': 10.5, fill: colors.text }, svg, label);
    }
    el('text', { x: margin.left, y: 16, 'font-size': 10.5, fill: colors.text }, svg, metric === 'ma200_pct' ? '乖離率（％）' : '乖離（ATR20倍率）');
    for (const q of ['q90', 'q95']) {
      const value = data.thresholds[ticker][metric][q];
      el('line', { x1: margin.left, x2: W - margin.right, y1: y(value), y2: y(value), stroke: colors[q], 'stroke-dasharray': q === 'q90' ? '7 4' : '2 4', 'stroke-width': 1.5 }, svg);
    }
    const path = rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.ms).toFixed(2)},${y(r[metric]).toFixed(2)}`).join(' ');
    el('path', { d: path, fill: 'none', stroke: colors.line, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, svg);
    const cursor = el('line', { x1: 0, x2: 0, y1: margin.top, y2: H - margin.bottom, stroke: '#867e71', 'stroke-dasharray': '2 3', 'stroke-width': .9 }, svg);
    const dot = el('circle', { r: 3, fill: colors.line, stroke: '#fff', 'stroke-width': 1 }, svg);
    const readout = host.nextElementSibling;
    const panel = { ticker, metric, svg, x, y, cursor, dot, readout };
    panels.push(panel);
    function point(clientX) {
      const rect = svg.getBoundingClientRect();
      const plotX = (clientX - rect.left) * W / rect.width;
      const ms = from + Math.max(0, Math.min(1, (plotX - margin.left) / (W - margin.left - margin.right))) * (to - from);
      selectDay(visible.SPY[nearest(ms)].date);
    }
    svg.addEventListener('pointermove', e => point(e.clientX));
    svg.addEventListener('pointerdown', e => point(e.clientX));
    svg.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const i = nearest(dateNum(selectedDate));
      selectDay(visible.SPY[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))].date);
    });
  }
  function render() {
    let from = data.meta.start, to = data.meta.as_of;
    if (range.value === 'recent') from = '2024-11-06';
    else if (range.value !== 'all') [from, to] = range.value.split('|');
    panels.length = 0;
    for (const t of tickers) visible[t] = data.series[t].filter(r => r.date >= from && r.date <= to);
    if (!visible.SPY.length || !visible.QQQ.length) throw new Error('Selected range has no observations.');
    for (const metric of metrics) {
      const bound = limits(metric);
      for (const ticker of tickers) chart(ticker, metric, bound);
    }
    const rows = visible.SPY;
    status.textContent = `${dateLabel(rows[0].date)}～${dateLabel(rows[rows.length - 1].date)}・各${rows.length.toLocaleString('ja-JP')}営業日。破線の境界は全期間で固定。`;
    selectDay(selectedDate && rows.some(r => r.date === selectedDate) ? selectedDate : rows[rows.length - 1].date);
    root.dataset.ready = 'true';
  }
  function populateTables() {
    root.querySelector('#ma200-thresholds').innerHTML = tickers.map(t => {
      const p = data.thresholds[t].ma200_pct, a = data.thresholds[t].atr200_dev;
      return `<tr><th scope="row">${t}</th><td>${num(p.q90)}％</td><td>${num(p.q95)}％</td><td>${num(a.q90)}倍</td><td>${num(a.q95)}倍</td></tr>`;
    }).join('');
    root.querySelector('#ma200-comparison').innerHTML = data.comparison.map(r => `<tr><th scope="row">${r.ticker}</th><td>${r.average}</td><td>${num(r.pct_q90)}％</td><td>${num(r.atr_q90)}倍</td></tr>`).join('');
  }
  fetch(`ma200-visual.json?v=${encodeURIComponent(root.dataset.version)}`)
    .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
    .then(result => {
      data = result;
      byDate = {};
      for (const t of tickers) {
        data.series[t] = data.series[t].map(row => Object.fromEntries(data.columns.map((key, i) => [key, row[i]])));
        data.series[t].forEach(r => { r.ms = dateNum(r.date); });
        byDate[t] = new Map(data.series[t].map(r => [r.date, r]));
      }
      populateTables(); render();
      range.addEventListener('change', render);
      let timer;
      window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(render, 120); });
    })
    .catch(error => {
      status.textContent = '図表を読み込めませんでした。再読み込みするか、計算済みデータのリンクをご確認ください。';
      status.classList.add('ma200-error');
      root.dataset.error = error.message;
      console.error('MA200 visualization:', error);
    });
})();
