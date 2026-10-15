'use strict';
(async()=>{
  const urls=['comparisons.json?v=20261015r3','risk-comparisons.json?v=20261015r3'];
  const [data,risk]=await Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw new Error('比較データを読めません');return r.json();}));
  for(const b of document.querySelectorAll('[data-period]')) b.addEventListener('click',()=>{
    const p=data[b.dataset.period];for(const [id,value]of Object.entries(p.groups))document.getElementById(id).innerHTML=value;
    for(const t of document.querySelectorAll('.compare-period'))t.textContent=p.period;
    document.getElementById('period-status').textContent=p.period;
    for(const btn of document.querySelectorAll('[data-period]'))btn.setAttribute('aria-pressed',String(btn===b));
  });
  for(const b of document.querySelectorAll('[data-risk-period]')) b.addEventListener('click',()=>{
    document.getElementById('risk-decomposition').innerHTML=risk[b.dataset.riskPeriod];
    for(const btn of document.querySelectorAll('[data-risk-period]'))btn.setAttribute('aria-pressed',String(btn===b));
  });
  document.documentElement.dataset.chartsReady='true';
})().catch(e=>{document.getElementById('period-status').textContent='期間切替を読めません。初期版を表示しています。';console.error(e);});
