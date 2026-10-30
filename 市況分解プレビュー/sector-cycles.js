(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}%`;
  function chart(target, lines, ylabel, markers=[], dates=null) {
    const w=window.innerWidth<600?440:800,h=290,p={l:64,r:20,t:18,b:43}, all=lines.flatMap(l=>l.points), maxx=Math.max(1,...all.map(p=>p[0])), ys=all.map(p=>p[1]);
    let low=Math.min(...ys),high=Math.max(...ys); if(high===low){low-=1;high+=1;} const pad=(high-low)*.08;low-=pad;high+=pad;
    const X=x=>p.l+x/maxx*(w-p.l-p.r), Y=y=>h-p.b-(y-low)/(high-low)*(h-p.t-p.b);
    let out=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${ylabel}">`;
    for(let k=0;k<=4;k++){const y=low+(high-low)*k/4;out+=`<line class="sc-grid" x1="${p.l}" x2="${w-p.r}" y1="${Y(y)}" y2="${Y(y)}"/><text x="${p.l-8}" y="${Y(y)+4}" text-anchor="end">${y.toFixed(1)}</text>`;}
    for(let k=0;k<=4;k++){const x=Math.round(maxx*k/4),label=dates?dates[x].slice(0,7).replace('-','/'):x;out+=`<text x="${X(x)}" y="${h-15}" text-anchor="middle">${label}</text>`;}
    lines.forEach(l=>{out+=`<polyline class="${l.cls}" points="${l.points.map(p=>`${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`).join(' ')}"><title>${l.title}</title></polyline>`;});
    markers.forEach(m=>{out+=`<circle class="sc-mark ${m.state}" cx="${X(m.x)}" cy="${Y(m.y)}" r="4"><title>${m.title}</title></circle>`;});
    out+=`<text x="${w/2}" y="${h-1}" text-anchor="middle">${ylabel}</text></svg>`;$(target).innerHTML=out;
  }
  function draw(data,code){
    const s=data.series[code],c=s.current, phase=s.state==='above'?'26週平均を上回る局面':'26週平均を下回る局面', old=s.previous[0];
    $('sc-summary').textContent=`${s.name}（${code}）：${phase}。${c.start}に確定し、${data.asof_week}時点で${c.duration}週、相対価格リターンは${fmt(c.values.at(-1))}。${old?`直前の同方向局面は${old.start}〜${old.end}の${old.duration}週、終了時${fmt(old.values.at(-1))}。`:'比較できる過去の完結局面はありません。'}`;
    const base=s.ratio[0], hist=s.ratio.map((v,i)=>[i,v/base*100]);
    const markers=s.episodes.map(e=>{const i=s.dates.indexOf(e.start);return {x:i,y:hist[i][1],state:e.state,title:`${e.start} ${e.state==='above'?'上回り':'下回り'}確定${e.left_censored?'（履歴左端）':''}`}});
    chart('sc-history',[{points:hist,cls:'sc-historical',title:`${s.dates[0]}〜${data.asof_week}`}],'週末日',markers,s.dates);
    let lines=s.previous.slice().reverse().map((x,i)=>({points:x.values.map((v,j)=>[j,v]),cls:i===s.previous.length-1?'sc-previous':'sc-older',title:`${x.start}〜${x.end}`}));
    lines.push({points:c.values.map((v,i)=>[i,v]),cls:'sc-current',title:`現在 ${c.start}〜${data.asof_week}`});chart('sc-overlay',lines,'開始後の週数',[{x:c.duration,y:c.values.at(-1),state:'current',title:`現在 ${data.asof_week}、${c.duration}週、${fmt(c.values.at(-1))}`}]);
    let html='<div class="sc-scroll"><table><thead><tr><th>期間</th><th>例数</th><th>中央値</th><th>各例の相対リターン</th><th>期間内の局面終了</th></tr></thead><tbody>';
    for(const h of ['4','13','26']){const x=s.forward[h];html+=`<tr><th>${h}週</th><td>${x.observations.length}</td><td>${x.median===null?'該当なし':fmt(x.median)}</td><td>${x.observations.length?x.observations.map(o=>`${o.start}: ${fmt(o.return)}`).join('、'):'該当なし'}</td><td>${x.ended_count} / ${x.observations.length}</td></tr>`;} $('sc-outcomes').innerHTML=html+'</tbody></table></div>';
  }
  fetch('sector-cycles.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}).then(data=>{const select=$('sc-select');for(const [code,s] of Object.entries(data.series)){const o=document.createElement('option');o.value=code;o.textContent=`${s.name}（${code}）`;select.appendChild(o);}select.value='XLK';draw(data,select.value);select.addEventListener('change',()=>draw(data,select.value));}).catch(e=>{$('sc-summary').textContent=`データを読み込めませんでした：${e.message}`;});
})();
