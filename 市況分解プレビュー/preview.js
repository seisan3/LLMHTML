'use strict';
(async()=>{
  const r=await fetch('chart-comparisons.json?v=20261015r4');if(!r.ok)throw new Error('比較データを読めません');const data=await r.json();
  for(const b of document.querySelectorAll('button[data-chart-target]')) b.addEventListener('click',()=>{
    const target=b.dataset.chartTarget;
    document.getElementById(target).innerHTML=data[target][b.dataset.period];
    for(const btn of document.querySelectorAll('button[data-chart-target="'+target+'"]'))btn.setAttribute('aria-pressed',String(btn===b));
  });
  document.documentElement.dataset.chartsReady='true';
})().catch(e=>{console.error(e);document.documentElement.dataset.chartsReady='error';});
