/* Display the latest saved observation and completed weeks. */
(() => {
 'use strict';
 const root=document.getElementById('sector-rotation'); if(!root)return;
 const el=id=>document.getElementById(id), fmt=(x,n=1)=>(x>0?'+':'')+x.toFixed(n);
 const svg=(body,w,h,label)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`;
 const txt=(x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${s}</text>`;
 const color=v=>{const t=Math.min(Math.abs(v)/3,1),a=v>=0?[55,119,104]:[166,99,66];return `rgb(${a.map(x=>Math.round(248+(x-248)*t)).join(',')})`};
 fetch('sector-rotation.json?v=cd2cca1b22ac').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(d=>{
  const dates=d.dates;
  function render(){
   const i=dates.length-1;
   const date=dates[i],start=Math.max(0,i-126),spy=d.prices.SPY;
   el('sr-asof').textContent=`採用日 ${date} ／ 保存最終日 ${dates.at(-1)}`;
   const ranked=[...d.sectors].sort((a,b)=>d.stats[b.symbol][i][0]-d.stats[a.symbol][i][0]);
   const top=ranked[0],bottom=ranked.at(-1),pos=ranked.filter(s=>d.stats[s.symbol][i][0]>0).length;
   el('sr-reading').textContent=`20営業日の対SPYでは${top.name}（${top.symbol}、${fmt(d.stats[top.symbol][i][0])}pp）が先頭、${bottom.name}（${bottom.symbol}、${fmt(d.stats[bottom.symbol][i][0])}pp）が最後尾。11業種中${pos}業種がSPYを上回っています。`;
   // Friday-labelled week buckets. A current partial week is never included.
   const weekKey=s=>{let t=new Date(s+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+(5-t.getUTCDay()+7)%7);return t.toISOString().slice(0,10)};
   const buckets=new Map();for(let j=0;j<=i;j++){const key=weekKey(dates[j]);if(key<=date)buckets.set(key,j)}
   const ends=[...buckets.values()].slice(-27),weeks=ends.slice(1).map((end,k)=>({start:ends[k],end}));
   const W=885,H=43+11*28, left=141,cw=28;
   let heat=weeks.map((w,k)=>k%5===0?txt(left+k*cw+12,22,dates[w.end].slice(5),'text-anchor="middle"'): '').join('');
   heat+=d.sectors.map((s,r)=>{
    const p=d.prices[s.symbol];let row=txt(left-9,48+r*28,`${s.name} ${s.symbol}`,'text-anchor="end"');
    weeks.forEach((w,k)=>{const v=((p[w.end]/p[w.start]-1)-(spy[w.end]/spy[w.start]-1))*100;
     const label=`${s.name} ${dates[w.start]} → ${dates[w.end]}：${fmt(v,2)}pp`;
     row+=`<rect x="${left+k*cw}" y="${31+r*28}" width="26" height="25" rx="2" fill="${color(v)}" tabindex="0" aria-label="${label}"><title>${label}</title></rect>`});return row;
   }).join('');
   el('sr-heat').innerHTML=svg(heat,W,H,'11セクターの26週超過騰落率。緑はSPY超、茶はSPY未満');
   let detail=el('sr-cell-detail');
   if(!detail){detail=document.createElement('p');detail.id='sr-cell-detail';detail.className='sr-note';detail.setAttribute('aria-live','polite');el('sr-heat').after(detail)}
   detail.textContent='セルを選択すると、期間と超過騰落率をここに表示します。';
   el('sr-heat').querySelectorAll('rect').forEach(cell=>{
    const show=()=>{detail.textContent=cell.getAttribute('aria-label')};
    cell.addEventListener('click',show);cell.addEventListener('focus',show);
    cell.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}});
   });
   el('sr-heat-caption').textContent=`${dates[weeks[0].start]} → ${dates[weeks.at(-1).end]}、${weeks.length}週。金曜以前の週末休場は、その週の最終保存営業日を使用。`;

  }
  render();
 }).catch(e=>{el('sr-reading').textContent='セクター図表を読み込めませんでした。ページを再読み込みしてください。';console.error('Sector rotation:',e)});
})();
