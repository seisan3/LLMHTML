"use strict";

const byId = id => document.getElementById(id);
const hasValue = value => value !== null && value !== undefined && value !== "";
const shown = (value, fallback = "未取得") => hasValue(value) ? String(value) : fallback;
const el = (tag, className, value) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (hasValue(value)) node.textContent = String(value);
  return node;
};
const replace = (id, children) => byId(id).replaceChildren(...children);
const array = value => Array.isArray(value) ? value : [];

function renderList(id, values, fallback) {
  replace(id, (array(values).length ? values : [fallback]).map(value => el("li", "", value)));
}

function renderIndex(data, key, fallbackLabel) {
  const item = data && typeof data === "object" ? data : {};
  const card = el("article", "index-item");
  card.append(el("h3", "", shown(item.label, fallbackLabel)));
  card.append(el("p", "regime", shown(item.regime, "局面は未判定")));
  const price = hasValue(item.close) ? `${item.close}${hasValue(item.changePct) ? `（前日比 ${item.changePct}%）` : ""}` : "終値未取得";
  card.append(el("p", "quote", price));
  card.append(el("p", "as-of", `対象時点：${shown(item.asOf)}`));
  return card;
}

function renderScenarios(items) {
  if (!array(items).length) return;
  replace("scenarios-list", items.map(item => {
    const row = el("article", "scenario");
    row.append(el("h3", "", shown(item.name ?? item.title, "分岐")));
    const watch = el("div");
    watch.append(el("h4", "", "次の確認点"), el("p", "", shown(item.watch ?? item.confirmation, "確認待ち")));
    const reject = el("div");
    reject.append(el("h4", "", "棄却・切替条件"), el("p", "", shown(item.reject ?? item.invalidation, "未設定")));
    row.append(watch, reject);
    return row;
  }));
}

function renderObservations(items) {
  if (!array(items).length) return;
  const rows = [];
  let currentGroup = null;
  for (const item of items) {
    const group = shown(item.group, "その他");
    if (group !== currentGroup) {
      const heading = el("tr", "group-row");
      const cell = el("th", "", group);
      cell.colSpan = 4;
      cell.scope = "rowgroup";
      heading.append(cell);
      rows.push(heading);
      currentGroup = group;
    }
    const row = el("tr");
    row.append(el("td", "", shown(item.label, "名称未設定")));
    const missing = item.status === "missing" || item.status === "unavailable" || !hasValue(item.value);
    row.append(el("td", missing ? "missing" : "", missing ? "未取得" : `${item.value}${hasValue(item.unit) ? ` ${item.unit}` : ""}`));
    row.append(el("td", "", shown(item.asOf)));
    const source = el("td");
    const urls = array(item.source).length ? item.source : hasValue(item.source) ? [item.source] : [];
    if (urls.length) {
      urls.forEach((url, index) => {
        if (index) source.append(document.createTextNode("・"));
        const link = el("a", "", `原データ${urls.length > 1 ? index + 1 : ""}`);
        link.href = url;
        link.title = url;
        link.rel = "noopener noreferrer";
        source.append(link);
      });
    } else source.append(el("span", "", "未取得"));
    if (hasValue(item.definition)) source.append(el("span", "source", `算出：${item.definition}`));
    row.append(source);
    rows.push(row);
  }
  replace("observation-rows", rows);
}

function renderWeekly(items) {
  if (!array(items).length) return;
  replace("weekly-list", items.map(item => {
    const card = el("article", "weekly-item");
    card.append(el("h3", "", shown(item.label, "週次確認")));
    card.append(el("p", "", hasValue(item.value) ? `${item.value}${hasValue(item.unit) ? ` ${item.unit}` : ""}` : shown(item.description, "未取得")));
    card.append(el("p", "as-of", `対象時点：${shown(item.asOf)}${hasValue(item.source) ? ` ／ 出典：${item.source}` : ""}`));
    return card;
  }));
}

function renderHistory(items) {
  if (!array(items).length) return;
  replace("history-list", items.map(item => {
    const li = el("li");
    li.append(el("strong", "", shown(item.date, "日付未取得")));
    li.append(document.createTextNode(shown(item.summary ?? item.regime, "判定未記録")));
    if (hasValue(item.reason)) li.append(document.createTextNode(` ／ 変更理由：${item.reason}`));
    if (hasValue(item.outcome)) li.append(document.createTextNode(` ／ 答え合わせ：${item.outcome}`));
    return li;
  }));
}

const svgNode = (tag, attrs = {}, label = "") => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (label) node.textContent = label;
  return node;
};

function renderLineChart(chart, figure) {
  const series = array(chart.series).filter(item => array(item.points).length >= 2);
  if (!series.length) { figure.append(el("p", "no-data", "推移データは未取得です。")); return; }
  const all = series.flatMap(item => item.points);
  const dates = [...new Set(all.map(point => point[0]))].sort();
  const values = all.map(point => Number(point[1])).filter(Number.isFinite);
  if (dates.length < 2 || !values.length) { figure.append(el("p", "no-data", "グラフを描けるデータがありません。")); return; }
  const width = 720, height = 286, left = 64, right = 20, top = 22, bottom = 46;
  let low = Math.min(...values), high = Math.max(...values);
  const pad = Math.max((high - low) * 0.12, Math.abs(high) * 0.005, 0.5);
  low -= pad; high += pad;
  const x = date => left + dates.indexOf(date) * (width - left - right) / (dates.length - 1);
  const y = value => top + (high - value) * (height - top - bottom) / (high - low);
  const svg = svgNode("svg", {viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": `${chart.title}。${series.map(item => `${item.label}最新${item.points.at(-1)[1]}`).join("、")}`});
  [0, 0.5, 1].forEach(tick => {
    const value = high - (high - low) * tick;
    const yy = y(value);
    svg.append(svgNode("line", {x1: left, x2: width - right, y1: yy, y2: yy, class: "chart-gridline"}));
    svg.append(svgNode("text", {x: left - 9, y: yy + 4, "text-anchor": "end", class: "chart-axis"}, value.toFixed(Math.abs(value) < 100 ? 1 : 0)));
  });
  svg.append(svgNode("text", {x: left, y: height - 13, class: "chart-axis"}, dates[0]));
  svg.append(svgNode("text", {x: width - right, y: height - 13, "text-anchor": "end", class: "chart-axis"}, dates.at(-1)));
  series.forEach((item, index) => {
    const points = item.points.filter(point => dates.includes(point[0]) && Number.isFinite(Number(point[1])));
    const d = points.map((point, i) => `${i ? "L" : "M"}${x(point[0]).toFixed(1)},${y(Number(point[1])).toFixed(1)}`).join(" ");
    svg.append(svgNode("path", {d, class: `chart-line chart-line-${index}`}));
    const latest = points.at(-1);
    svg.append(svgNode("circle", {cx: x(latest[0]), cy: y(Number(latest[1])), r: 4.2, class: `chart-dot chart-dot-${index}`}));
  });
  figure.append(svg);
  const legend = el("ul", "chart-legend");
  series.forEach((item, index) => {
    const latest = item.points.at(-1);
    const row = el("li");
    row.append(el("span", `chart-key chart-key-${index}`), el("span", "", `${item.label} ${Number(latest[1]).toFixed(chart.unit === "pt" ? 1 : 2)} ${chart.unit}`));
    legend.append(row);
  });
  figure.append(legend);
}

function renderBarChart(chart, figure) {
  const bars = array(chart.bars);
  if (!bars.length) { figure.append(el("p", "no-data", "ブレッドは未取得です。")); return; }
  const box = el("div", "breadth-bars");
  bars.forEach(item => {
    const row = el("div", "breadth-row");
    row.append(el("span", "", item.label));
    const track = el("div", "breadth-track");
    const fill = el("span", "breadth-fill");
    fill.style.width = `${Math.max(0, Math.min(100, Number(item.value)))}%`;
    track.append(fill);
    row.append(track, el("strong", "", `${Number(item.value).toFixed(1)}%`));
    box.append(row);
  });
  figure.append(box);
}

function renderCharts(items) {
  if (!array(items).length) return;
  replace("chart-grid", items.map(chart => {
    const figure = el("figure", "chart-card");
    figure.append(el("h3", "", chart.title));
    if (chart.bars) renderBarChart(chart, figure);
    else renderLineChart(chart, figure);
    figure.append(el("figcaption", "", chart.explanation || ""));
    return figure;
  }));
}

function render(report) {
  if (!report || typeof report !== "object" || Array.isArray(report)) throw new Error("日次データの形式が不正です。");
  byId("report-date").textContent = `対象日：${shown(report.reportDate)}`;
  byId("generated-at").textContent = `生成日時：${shown(report.generatedAt)}`;
  const status = ["ready", "partial", "unavailable"].includes(report.status) ? report.status : "unavailable";
  const state = byId("data-state");
  state.classList.toggle("ready", status === "ready");
  state.textContent = status === "ready" ? "観測値と判定を掲載しています。各数値の対象時点を確認してください。" : status === "partial" ? "一部の系列が未取得です。取得済みの観測だけで判定し、欠測を表に明示しています。" : "日次データは未取得です。現在の市況判断は掲載していません。";
  if (status === "unavailable") return;
  replace("indices", [renderIndex(report.indices?.spx, "spx", "SPX"), renderIndex(report.indices?.ndx, "ndx", "NDX")]);
  byId("change-reason").textContent = `前回からの判断変更：${shown(report.changeReason, "比較する前回判定がありません")}`;
  const primary = report.primary ?? {};
  byId("primary-title").textContent = shown(primary.title, "判定保留");
  byId("primary-body").textContent = shown(primary.body, "判定根拠は未記録です。");
  renderList("support", primary.support, "支持する観測は未記録です。");
  renderList("conflicts", primary.conflicts, "反する観測は未記録です。");
  byId("alternative").textContent = typeof report.alternative === "string" ? report.alternative : shown(report.alternative?.body ?? report.alternative?.title, "代替仮説は未記録です。");
  renderScenarios(report.scenarios);
  renderCharts(report.charts);
  renderObservations(report.observations);
  renderWeekly(report.weekly);
  renderHistory(report.history);
}

fetch("daily-data.json", {cache: "no-store"})
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch(error => {
    byId("data-state").textContent = "日次データを読み込めませんでした。現在の市況判断は掲載していません。";
    console.error("daily-data.json の読み込みに失敗しました", error);
  });
