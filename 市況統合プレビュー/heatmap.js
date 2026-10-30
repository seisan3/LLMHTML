/* Weekly SPY and heatmap share the same 23 weekly boundaries. */
(() => {
 'use strict';
 const root=document.getElementById('sector-rotation');if(!root)return;
 const el=id=>document.getElementById(id),fmt=(x,n=2)=>(x>0?'+':'')+x.toFixed(n);
 const color=v=>{const t=Math.min(Math.abs(v)/3,1),a=v>=0?[55,119,104]:[166,99,66];return `rgb(${a.map(x=>Math.round(248+(x-248)*t)).join(',')})`;};
 fetch('sector-rotation.json?v=cd2cca1b22ac').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(d=>{
  function render(){
   const dates=d.dates,spy=d.prices.SPY,date=dates.at(-1),buckets=new Map();
   const weekKey=s=>{const t=new Date(s+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+(5-t.getUTCDay()+7)%7);return t.toISOString().slice(0,10);};
   for(let i=0;i<dates.length;i++){const key=weekKey(dates[i]);if(key<=date)buckets.set(key,i);}
   const ends=[...buckets.values()].slice(-23),weeks=ends.slice(1).map((end,k)=>({start:ends[k],end}));if(weeks.length!==22)throw Error('週次履歴が不足しています');
   const W=Math.max(260,Math.floor(el('sr-heat').clientWidth)),left=W<600?85:141,right=W-16,cw=(right-left)/22,top=36,bottom=160,heatTop=205,rowH=28,H=heatTop+11*rowH+12;
   const values=ends.map(i=>spy[i]),lo0=Math.min(...values),hi0=Math.max(...values),pad=(hi0-lo0||1)*.08,lo=lo0-pad,hi=hi0+pad;
   const X=i=>left+i*cw,Y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);let body=`<text x="${left}" y="17" class="context-title">SPY週末終値（USD）</text>`;
   for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4,y=Y(v);body+=`<line class="spy-grid" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text x="${left-9}" y="${y+4}" text-anchor="end">${v.toFixed(1)}</text>`;}
   body+=`<polyline class="spy-week-line" points="${values.map((v,i)=>`${X(i).toFixed(3)},${Y(v).toFixed(3)}`).join(' ')}"/>`;
   ends.forEach((idx,i)=>{const label=`${dates[idx]} SPY ${spy[idx].toFixed(2)} USD`;body+=`<circle class="spy-week-point" data-index="${i}" data-date="${dates[idx]}" data-value="${spy[idx]}" cx="${X(i).toFixed(3)}" cy="${Y(spy[idx]).toFixed(3)}" r="3" tabindex="0" aria-label="${label}"><title>${label}</title></circle>`;});
   body+=weeks.map((w,k)=>k%4===0?`<text x="${X(k+1)}" y="190" text-anchor="middle">${dates[w.end].slice(5)}</text>`:'').join('');
   body+=d.sectors.map((s,r)=>{let line=`<text x="${left-9}" y="${heatTop+17+r*rowH}" text-anchor="end">${s.name}</text>`;const p=d.prices[s.symbol];weeks.forEach((week,k)=>{const v=((p[week.end]/p[week.start]-1)-(spy[week.end]/spy[week.start]-1))*100,label=`${s.name} ${dates[week.start]} → ${dates[week.end]}：${fmt(v)}pp`;line+=`<rect class="sr-cell" data-col="${k}" data-start="${dates[week.start]}" data-end="${dates[week.end]}" x="${X(k).toFixed(3)}" y="${heatTop+r*rowH}" width="${(cw-2).toFixed(3)}" height="25" rx="2" fill="${color(v)}" tabindex="0" aria-label="${label}"><title>${label}</title></rect>`;});return line;}).join('');
   for(let k=4;k<weeks.length;k+=4)body+=`<line class="sr-period-divider" data-boundary="${k}" x1="${X(k).toFixed(3)}" x2="${X(k).toFixed(3)}" y1="${top}" y2="${heatTop+11*rowH}" aria-hidden="true"/>`;
   el('sr-heat').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="SPY週末終値と11セクター22週の超過騰落率">${body}</svg>`;
   let detail=el('sr-cell-detail');if(!detail){detail=document.createElement('p');detail.id='sr-cell-detail';detail.className='sr-note';detail.setAttribute('aria-live','polite');el('sr-heat').after(detail);}detail.textContent='点・セルを選択すると、日付と値をここに表示します。';
   el('sr-heat').querySelectorAll('.sr-cell,.spy-week-point').forEach(node=>{const show=()=>{detail.textContent=node.getAttribute('aria-label');};node.addEventListener('click',show);node.addEventListener('focus',show);node.addEventListener('mouseenter',show);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});});
   el('sr-asof').textContent=`採用日 ${date} ／ 保存最終日 ${date}`;el('sr-heat-caption').textContent=`${dates[ends[0]]} → ${dates[ends.at(-1)]}、${weeks.length}週。SPYは各週の最終保存営業日、色は同じ週の超過騰落率です。`;
  }
  render();let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(render,100);});
 }).catch(e=>{el('sr-asof').textContent='セクター図表を読み込めませんでした。ページを再読み込みしてください。';console.error('Sector rotation:',e);});
})();
