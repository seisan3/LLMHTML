(()=>{
const root=document.getElementById('bb-atr-charts');if(!root)return;
fetch('bb-atr-charts.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(d=>{
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const states=[...root.querySelectorAll('.bb-atr-panel')].map(panel=>({panel,series:d.series.find(s=>s.symbol===panel.dataset.symbol),rows:[]}));
function wire(st){const {panel,rows}=st,svg=panel.querySelector('svg'),hit=svg.querySelector('.bb-hit'),cursor=svg.querySelector('.bb-cursor'),read=panel.querySelector('.bb-readout');
function display(r){read.textContent=`${r.date}｜終値 ${fmt(r.close)}｜MA20 ${fmt(r.ma20)}｜BB ${fmt(r.bb_lower)}〜${fmt(r.bb_upper)}｜乖離 ${r.atr_gap>=0?'+':''}${fmt(r.atr_gap)} ATR`;}
display(rows[rows.length-1]);
function show(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse()),i=Math.max(0,Math.min(rows.length-1,Math.round((q.x-60)/510*(rows.length-1)))),x=60+i*510/(rows.length-1);cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);cursor.setAttribute('visibility','visible');display(rows[i]);}
hit.addEventListener('pointermove',show);hit.addEventListener('pointerdown',show);hit.addEventListener('pointerleave',()=>cursor.setAttribute('visibility','hidden'));}
function change(days){for(const st of states){const count=days==='all'?st.series.rows.length:Number(days);st.rows=st.series.rows.slice(-count);const template=[...root.querySelectorAll('template')].find(t=>t.dataset.bbSymbol===st.series.symbol&&Number(t.dataset.bbDays)===count);st.panel.querySelector('svg').replaceWith(template.content.firstElementChild.cloneNode(true));st.panel.querySelector('.bb-period-label').textContent=`${st.rows[0].date} → ${st.rows[st.rows.length-1].date}（${count}営業日）`;wire(st);}for(const button of root.querySelectorAll('[data-days]'))button.setAttribute('aria-pressed',String(button.dataset.days===days));}
for(const button of root.querySelectorAll('[data-days]')){button.disabled=false;button.addEventListener('click',()=>change(button.dataset.days));}change('63');
}).catch(()=>{});})();