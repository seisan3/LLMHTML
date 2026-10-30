(() => {
  'use strict';
  const fmt=x=>`${x>=0?'+':''}${x.toFixed(2)}%`;
  function chart(lines,label,markers,dates=null,scale=null){
    const w=window.innerWidth<600?440:560,h=270,p={l:65,r:20,t:18,b:43},points=lines.flatMap(l=>l.points),maxx=scale?.maxx??Math.max(1,...points.map(a=>a[0])),values=points.map(a=>a[1]);
    let low=scale?.low??Math.min(...values),high=scale?.high??Math.max(...values);if(low===high){low-=1;high+=1;} const pad=(high-low)*.06;low-=pad;high+=pad;
    const X=x=>p.l+x/maxx*(w-p.l-p.r),Y=y=>h-p.b-(y-low)/(high-low)*(h-p.t-p.b);
    let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">`;
    for(let k=0;k<=4;k++){const y=low+(high-low)*k/4;svg+=`<line class="sc-grid" x1="${p.l}" x2="${w-p.r}" y1="${Y(y)}" y2="${Y(y)}"/><text x="${p.l-8}" y="${Y(y)+4}" text-anchor="end">${y.toFixed(1)}</text>`;}
    for(let k=0;k<=4;k++){const x=Math.round(maxx*k/4),tick=dates?dates[x].slice(0,7).replace('-','/'):x;svg+=`<text x="${X(x)}" y="${h-15}" text-anchor="middle">${tick}</text>`;}
    for(const l of lines)svg+=`<polyline class="${l.cls}" points="${l.points.map(a=>`${X(a[0]).toFixed(2)},${Y(a[1]).toFixed(2)}`).join(' ')}"><title>${l.title}</title></polyline>`;
    for(const m of markers)svg+=`<circle class="sc-mark ${m.state}" cx="${X(m.x)}" cy="${Y(m.y)}" r="4"><title>${m.title}</title></circle>`;
    return svg+`<text x="${w/2}" y="${h-1}" text-anchor="middle">${label}</text></svg>`;
  }
  function overview(data){
    const items=Object.entries(data.series).map(([code,s])=>({code,...s,age:s.current.duration,value:s.current.values.at(-1)}));
    const w=window.innerWidth<600?480:820,h=310,p={l:65,r:25,t:25,b:48};
    const xmax=Math.max(5,Math.ceil(Math.max(...items.map(a=>a.age))/5)*5),rawlo=Math.min(0,...items.map(a=>a.value)),rawhi=Math.max(0,...items.map(a=>a.value));
    const ymin=Math.floor((rawlo-2)/5)*5,ymax=Math.ceil((rawhi+2)/5)*5,X=x=>p.l+x/xmax*(w-p.l-p.r),Y=y=>h-p.b-(y-ymin)/(ymax-ymin)*(h-p.t-p.b);
    let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="11業種の局面週数と相対価格リターンの散布図">`;
    for(let k=0;k<=4;k++){const y=ymin+(ymax-ymin)*k/4;svg+=`<line class="${Math.abs(y)<1e-9?'sc-zero':'sc-grid'}" x1="${p.l}" x2="${w-p.r}" y1="${Y(y)}" y2="${Y(y)}"/><text x="${p.l-7}" y="${Y(y)+4}" text-anchor="end">${y.toFixed(1)}</text>`;}
    if(ymin<0&&ymax>0)svg+=`<line class="sc-zero" x1="${p.l}" x2="${w-p.r}" y1="${Y(0)}" y2="${Y(0)}"/>`;
    for(let k=0;k<=4;k++){const x=xmax*k/4;svg+=`<text x="${X(x)}" y="${h-16}" text-anchor="middle">${x.toFixed(x%1?1:0)}</text>`;}
    const used=[];
    for(const [itemIndex,a] of items.entries()){
      const x=X(a.age),y=Y(a.value);let chosen=null;
      for(const [dx,dy] of [[9,-10],[9,15],[-40,-10],[-40,15],[9,-26],[-40,-26],[9,30],[-40,30],[9,-42],[-40,-42]]){const lx=Math.max(p.l,Math.min(w-p.r-32,x+dx)),ly=Math.max(p.t+8,Math.min(h-p.b-2,y+dy));if(used.every(z=>Math.abs(z.x-lx)>36||Math.abs(z.y-ly)>15)){chosen={x:lx,y:ly};break;}}
      if(!chosen)chosen={x:Math.max(p.l,Math.min(w-p.r-32,x+9)),y:Math.max(p.t+8,Math.min(h-p.b-2,y-10))};used.push(chosen);
      const overlap=items.some((b,i)=>i>itemIndex&&b.age===a.age&&Math.abs(b.value-a.value)<1e-10),radius=overlap?8:5;
      svg+=`<line class="sc-leader" x1="${x}" y1="${y}" x2="${chosen.x}" y2="${chosen.y-3}"/><circle class="sc-dot ${a.state}" data-symbol="${a.code}" data-age="${a.age}" data-return="${a.value}" cx="${x}" cy="${y}" r="${radius}"><title>${a.code} ${a.age}週 ${fmt(a.value)}</title></circle><text class="sc-label" x="${chosen.x}" y="${chosen.y}">${a.code}</text>`;
    }
    svg+=`<text x="${w/2}" y="${h-1}" text-anchor="middle">確定開始からの週数</text><text transform="translate(14 ${h/2}) rotate(-90)" text-anchor="middle">相対価格リターン（%）</text></svg>`;
    const longest=items.reduce((a,b)=>a.age>=b.age?a:b),strongest=items.reduce((a,b)=>a.value>=b.value?a:b),above=items.filter(a=>a.state==='above').length;
    let html=`<p class="sc-overview-reading">${data.asof_week}時点で26週平均を上回る局面は${above}業種、下回る局面は${11-above}業種。最長は${longest.name}（${longest.age}週）、開始以来の相対上昇が最大なのは${strongest.name}（${fmt(strongest.value)}）です。</p><p class="sc-legend"><span class="sc-key above"></span>26週平均を上回る局面 <span class="sc-key below"></span>下回る局面　｜　点は現在、横線は相対リターン0%</p><figure class="sc-overview-chart">${svg}<figcaption>開始時点は2週連続の確認日。局面の方向と開始以来のリターンの符号は一致しないことがあります。</figcaption></figure>`;
    html+='<div class="sc-summary-scroll"><table class="sc-summary-table"><thead><tr><th>業種</th><th>局面</th><th>現在：週／相対</th><th>前回：週／終了時</th><th>過去の13週後中央値（例数）</th></tr></thead><tbody>';
    for(const a of items){const prev=a.previous[0],x=a.forward['13'];html+=`<tr data-symbol="${a.code}"><th><a href="#sc-detail-${a.code}">${a.name}（${a.code}）</a></th><td>${a.state==='above'?'上回り':'下回り'}</td><td>${a.age}週 / ${fmt(a.value)}</td><td>${prev?`${prev.duration}週 / ${fmt(prev.values.at(-1))}`:'該当なし'}</td><td>${x.median===null?'該当なし':`${fmt(x.median)}（${x.observations.length}例）`}</td></tr>`;}
    return html+'</tbody></table></div><p class="sc-table-note">前回は終了時の値で、現在とは経過週数が異なります。13週後の中央値は、同じ経過週数からの過去例です。</p>';
  }
  function draw(data){
    document.getElementById('sc-overview').innerHTML=overview(data);
    const all=Object.values(data.series), paths=all.flatMap(s=>[s.current,...s.previous]);const flat=paths.flatMap(p=>p.values);const scale={maxx:Math.max(1,...paths.map(p=>p.duration)),low:Math.min(0,...flat),high:Math.max(0,...flat)};
    let html='';
    for(const [code,s] of Object.entries(data.series)){
      const c=s.current,prev=s.previous[0],phase=s.state==='above'?'26週平均を上回る局面':'26週平均を下回る局面',base=s.ratio[0],hist=s.ratio.map((v,i)=>[i,v/base*100]);
      const marks=s.episodes.map(e=>{const i=s.dates.indexOf(e.start);return {x:i,y:hist[i][1],state:e.state,title:`${e.start} ${e.state==='above'?'上回り':'下回り'}確定${e.left_censored?'（履歴左端）':''}`};});
      const history=chart([{points:hist,cls:'sc-historical',title:`${s.dates[0]}〜${data.asof_week}`}],'週末日',marks,s.dates);
      const lines=s.previous.slice().reverse().map((x,i)=>({points:x.values.map((v,j)=>[j,v]),cls:i===s.previous.length-1?'sc-previous':'sc-older',title:`${x.start}〜${x.end}`}));
      lines.push({points:c.values.map((v,i)=>[i,v]),cls:'sc-current',title:`現在 ${c.start}〜${data.asof_week}`});
      const overlay=chart(lines,'開始後の週数',[{x:c.duration,y:c.values.at(-1),state:'current',title:`現在 ${data.asof_week}、${c.duration}週、${fmt(c.values.at(-1))}`}],null,scale);
      const summary=`${phase}。${c.start}に確定し、${data.asof_week}時点で${c.duration}週、相対価格リターン${fmt(c.values.at(-1))}。${prev?`直前の同方向局面は${prev.start}〜${prev.end}の${prev.duration}週、終了時${fmt(prev.values.at(-1))}。`:'比較できる過去の完結局面はありません。'}`;
      html+=`<section class="sc-sector" id="sc-detail-${code}" data-symbol="${code}"><h3>${s.name}（${code}）</h3><p>${summary}</p><div class="sc-pair"><figure><h4>業種/SPYの長期推移</h4>${history}<figcaption>各業種の目盛りはデータ範囲に合わせています。</figcaption></figure><figure><h4>開始後の相対価格リターン（%）</h4>${overlay}<figcaption>全業種で共通尺度。現在点を丸で表示。</figcaption></figure></div>`;
      html+='<div class="sc-scroll"><table><thead><tr><th>期間</th><th>例数</th><th>中央値</th><th>各例の相対リターン（開始日）</th><th>期間内の局面終了</th></tr></thead><tbody>';
      for(const h of ['4','13','26']){const x=s.forward[h];html+=`<tr><th>${h}週</th><td>${x.observations.length}</td><td>${x.median===null?'該当なし':fmt(x.median)}</td><td>${x.observations.length?x.observations.map(o=>`${o.start}: ${fmt(o.return)}`).join('、'):'該当なし'}</td><td>${x.ended_count} / ${x.observations.length}</td></tr>`;}
      html+='</tbody></table></div></section>';
    }
    document.getElementById('sc-all').innerHTML=html;
  }
  fetch('sector-cycles.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}).then(draw).catch(e=>{document.getElementById('sc-all').textContent=`データを読み込めませんでした：${e.message}`;});
})();
