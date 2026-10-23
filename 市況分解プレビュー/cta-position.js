/* Representative model exposure; no external libraries or live market requests. */
(() => {
  'use strict';
  const root = document.getElementById('cta-position');
  if (!root) return;
  const chart = root.querySelector('#cta-chart');
  const reading = root.querySelector('#cta-reading');
  const period = root.querySelector('#cta-period');
  const date = root.querySelector('#cta-date');
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}, text) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k,v]) => n.setAttribute(k,v)); if (text !== undefined) n.textContent = text; return n; };
  const fmt = (v, n=1) => v === null ? '—' : v.toLocaleString('ja-JP', {minimumFractionDigits:n, maximumFractionDigits:n});
  const signed = v => (v > 0 ? '+' : '') + fmt(v);
  const url = new URL('cta-position.json', document.currentScript.src);
  fetch(url).then(r => { if (!r.ok) throw Error(`HTTP ${r.status}`); return r.json(); }).then(data => {
    const rows = data.rows.filter(r => r.short !== null);
    if (!rows.length) throw Error('有効な推定値がありません');
    date.min = rows[0].date; date.max = rows.at(-1).date; date.value = date.max;
    function draw() {
      const end = rows.filter(r => r.date <= date.value).at(-1) || rows[0];
      date.value = end.date;
      const start = period.value === 'all' ? rows[0].date : (() => { const d = new Date(end.date+'T00:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() - Number(period.value)); return d.toISOString().slice(0,10); })();
      const view = rows.filter(r => r.date >= start && r.date <= end.date);
      const narrow = chart.clientWidth < 500;
      const W = narrow ? 390 : 1000, H = narrow ? 360 : 390;
      const L = narrow ? 45 : 65, R = W-(narrow ? 48 : 65), T=42, B=H-46;
      const maxShort = Math.max(25, Math.ceil(Math.max(...view.map(r => r.short))/25)*25);
      const lo = Math.floor(Math.min(...view.map(r => r.spy))*.98/10)*10;
      const hi = Math.ceil(Math.max(...view.map(r => r.spy))*1.02/10)*10;
      const times = view.map(r => Date.parse(r.date));
      const x = i => L+(times[i]-times[0])/Math.max(86400000,times.at(-1)-times[0])*(R-L);
      const y = v => B-v/maxShort*(B-T), yp = v => B-(v-lo)/(hi-lo)*(B-T);
      const svg = make('svg', {viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':`${view[0].date}から${end.date}の推定ショートとSPY。左軸は仮想資金比%、右軸はドル。`});
      svg.append(make('text',{x:L,y:18,class:'cta-short-label'},'ショート（資金比 %）'),make('text',{x:R,y:18,'text-anchor':'end',class:'cta-spy-label'},'SPY（USD）'));
      for (let i=0;i<=4;i++) { const yy = T+(B-T)*i/4; svg.append(make('line',{x1:L,x2:R,y1:yy,y2:yy,stroke:'#e6e0d6','stroke-width':1}),make('text',{x:L-8,y:yy+4,'text-anchor':'end',class:'cta-short-label'},fmt(maxShort*(1-i/4),Number.isInteger(maxShort/4)?0:1)),make('text',{x:R+8,y:yy+4,class:'cta-spy-label'},fmt(hi-(hi-lo)*i/4,0))); }
      const points = view.map((r,i)=>`${x(i).toFixed(2)},${y(r.short).toFixed(2)}`).join(' ');
      svg.append(make('polygon',{points:`${L},${B} ${points} ${x(view.length-1)},${B}`,fill:'#98664a','fill-opacity':'.15'}));
      svg.append(make('polyline',{points,fill:'none',stroke:'#98664a','stroke-width':2.2,'vector-effect':'non-scaling-stroke','data-series':'short'}));
      svg.append(make('polyline',{points:view.map((r,i)=>`${x(i).toFixed(2)},${yp(r.spy).toFixed(2)}`).join(' '),fill:'none',stroke:'#155d91','stroke-width':2,'vector-effect':'non-scaling-stroke','data-series':'spy'}));
      view.forEach((r,i) => { if (r.event) { const c=make('circle',{cx:x(i),cy:y(r.short),r:4,fill:'#98664a','data-event-date':r.date}); c.append(make('title',{},`${r.date} 売り増し鈍化候補 ${fmt(r.short)}%`)); svg.append(c); } });
      const ticks = [...new Set([0,Math.floor((view.length-1)/2),view.length-1])];
      ticks.forEach((i,j)=>svg.append(make('text',{x:x(i),y:H-18,'text-anchor':j===0?'start':j===ticks.length-1?'end':'middle'},view[i].date.slice(0,7))));
      const cursor=make('line',{x1:R,x2:R,y1:T,y2:B,stroke:'#8b8173','stroke-dasharray':'3 4',visibility:'hidden'});
      svg.append(cursor);
      const describe = r => { reading.textContent=`${r.date}｜推定ショート ${fmt(r.short)}%｜5営業日前比 ${signed(r.delta5)}pp｜SPY $${fmt(r.spy,2)}${r.event ? '｜売り増し鈍化の候補日' : ''}`; };
      const overlay=make('rect',{x:L,y:T,width:R-L,height:B-T,fill:'transparent'});
      overlay.addEventListener('pointermove',e=>{ const pt=svg.createSVGPoint(); pt.x=e.clientX;pt.y=e.clientY; const xx=pt.matrixTransform(svg.getScreenCTM().inverse()).x; const target=times[0]+(xx-L)/(R-L)*(times.at(-1)-times[0]); let i=0; while(i<times.length-1 && Math.abs(times[i+1]-target)<Math.abs(times[i]-target)) i++; cursor.setAttribute('x1',x(i));cursor.setAttribute('x2',x(i));cursor.setAttribute('visibility','visible');describe(view[i]); });
      overlay.addEventListener('pointerleave',()=>{cursor.setAttribute('visibility','hidden');describe(end);});
      svg.append(overlay); chart.replaceChildren(svg); describe(end);
      root.querySelector('#cta-window').textContent=`表示：${view[0].date} → ${end.date}（${view.length.toLocaleString()}観測）。推定ショートはゼロ起点。SPY右軸は価格変化を見やすくするためゼロ起点ではありません。`;
    }
    period.addEventListener('change',draw);date.addEventListener('change',draw);
    root.querySelector('#cta-latest').addEventListener('click',()=>{date.value=date.max;draw();});
    new ResizeObserver(draw).observe(chart); draw();
  }).catch(e => { reading.textContent = `推定ポジションを読み込めませんでした（${e.message}）。下のデータリンクから確認できます。`; });
})();
