(() => {
  'use strict';
  const fmt=n=>`${n>=0?'+':''}${n.toFixed(2)}%`, esc=s=>s;
  function render(data){
    const m=data.market,spy=m.spy,sp=m.breadth_sp,nd=m.breadth_nasdaq;
    const relation=v=>v>=0?'上':'下',breadth=(sp.value>=50&&nd.value>=50)?'両市場で200日線を上回る銘柄は過半数です。':(sp.value<50&&nd.value<50)?'両市場で200日線を上回る銘柄は半数未満です。':'両市場の200日線超え比率は50%を挟んでいます。';
    document.getElementById('sr-market').innerHTML=`<p class="sr-lead">${data.asof_daily}：SPY ${spy.value.toFixed(2)}、20日線比 ${fmt(spy.ma20_gap_pct)}・50日線比 ${fmt(spy.ma50_gap_pct)}・200日線比 ${fmt(spy.ma200_gap_pct)}。200日線を上回る銘柄はS&amp;P 500 ${sp.value.toFixed(2)}%（${sp.date}）、Nasdaq 100 ${nd.value.toFixed(2)}%（${nd.date}）です。</p><p class="sr-lead">SPYは20日線の${relation(spy.ma20_gap_pct)}、200日線の${relation(spy.ma200_gap_pct)}にあります。${breadth}業種の強弱は完了週${data.asof_week}の位置と方向を確認します。</p>`;
    const colors=['#835d45','#438089','#b45c3d','#776395','#46856b','#526795','#a36f3a','#a05476','#8b853a','#497f94','#98745e'];const entries=Object.entries(data.series);const points=entries.flatMap(([code,s])=>s.trail);const maxX=Math.max(1,...points.map(p=>Math.abs(p.x))),maxY=Math.max(1,...points.map(p=>Math.abs(p.y)));const boundX=Math.ceil(maxX/2)*2,boundY=Math.ceil(maxY/2)*2;
    const groups=[['XLK','XLC','XLY'],['XLI','XLB','XLE'],['XLF','XLRE','XLU'],['XLV','XLP']];
    const w=window.innerWidth<600?440:560,h=370,p={l:52,r:20,t:38,b:55},X=x=>p.l+(x+boundX)/(2*boundX)*(w-p.l-p.r),Y=y=>p.t+(boundY-y)/(2*boundY)*(h-p.t-p.b);
    let panels='';
    for(const group of groups){
    let html=`<div class="sr-panel"><svg viewBox="0 0 ${w} ${h}" role="img" data-bound-x="${boundX}" data-bound-y="${boundY}" aria-label="${group.map(code=>data.series[code].name).join('・')}の平均比の強弱とその4週変化">`;
    for(let k=-2;k<=2;k++){let x=k*boundX/2,y=k*boundY/2;html+=`<line class="${k===0?'sr-zero':'sr-grid'}" x1="${X(x)}" x2="${X(x)}" y1="${p.t}" y2="${h-p.b}"/><text x="${X(x)}" y="${h-p.b+20}" text-anchor="middle">${x.toFixed(1)}</text><line class="${k===0?'sr-zero':'sr-grid'}" x1="${p.l}" x2="${w-p.r}" y1="${Y(y)}" y2="${Y(y)}"/><text x="${p.l-8}" y="${Y(y)+4}" text-anchor="end">${y.toFixed(1)}</text>`;}
    html+=`<text class="sr-quad" x="${p.l+5}" y="${p.t-12}">平均比劣位・改善</text><text class="sr-quad" x="${w-p.r-5}" y="${p.t-12}" text-anchor="end">平均比優位・改善</text><text class="sr-quad" x="${p.l+5}" y="${h-p.b-6}">平均比劣位・悪化</text><text class="sr-quad" x="${w-p.r-5}" y="${h-p.b-6}" text-anchor="end">平均比優位・悪化</text>`;
    const used=[];
    group.forEach(code=>{const s=data.series[code],idx=entries.findIndex(e=>e[0]===code);
      let c=colors[idx],trail=s.trail,last=trail.at(-1),prev=trail.at(-2),x=X(last.x),y=Y(last.y),px=X(prev.x),py=Y(prev.y);const path=trail.map(a=>`${X(a.x).toFixed(2)},${Y(a.y).toFixed(2)}`).join(' ');
      html+=`<polyline points="${path}" fill="none" stroke="${c}" stroke-width="1.6" opacity=".78"/><circle cx="${X(trail[0].x)}" cy="${Y(trail[0].y)}" r="2.2" fill="${c}"/><line x1="${px}" y1="${py}" x2="${x}" y2="${y}" stroke="${c}" stroke-width="2.6"/><circle class="sr-dot" data-symbol="${code}" data-x="${last.x}" data-y="${last.y}" cx="${x}" cy="${y}" r="4.5" fill="${c}"><title>${s.name} ${last.week}: ${last.x.toFixed(2)}%, ${last.y.toFixed(2)}pt</title></circle>`;
      const textWidth=s.name.length*16;let label;for(const [dx,dy] of [[8,-9],[8,17],[-textWidth-8,-9],[-textWidth-8,17],[8,-27],[-textWidth-8,-27],[8,35],[-textWidth-8,35]]){let lx=Math.max(p.l+2,Math.min(w-p.r-textWidth,x+dx)),ly=Math.max(p.t+14,Math.min(h-p.b-14,y+dy));if(used.every(z=>Math.abs(z.x-lx)>Math.max(z.width,textWidth)||Math.abs(z.y-ly)>18)){label={x:lx,y:ly,width:textWidth};break;}}if(!label)label={x:Math.max(p.l+2,Math.min(w-p.r-textWidth,x+8)),y:Math.max(p.t+14,y-9),width:textWidth};used.push(label);
      html+=`<line class="sr-leader" x1="${x}" y1="${y}" x2="${label.x}" y2="${label.y-3}"/><text class="sr-label" x="${label.x}" y="${label.y}">${s.name}</text>`;
    });
    html+=`<text x="${w/2}" y="${h-8}" text-anchor="middle">SPY比率の26週平均からの乖離（%）</text><text transform="translate(14 ${h/2}) rotate(-90)" text-anchor="middle">乖離の4週変化（ポイント）</text></svg></div>`;panels+=html;
    }
    document.getElementById('sr-chart').innerHTML=panels;
    const sorted=entries.slice().sort((a,b)=>b[1].returns['3']-a[1].returns['3']);let table=`<p class="sr-dates">${data.asof_daily}終値に対し、1か月前 ${data.monthly_endpoints['1']}、3か月前 ${data.monthly_endpoints['3']}、6か月前 ${data.monthly_endpoints['6']} を基準に比較。3か月の相対リターンは${sorted[0][1].name}が${fmt(sorted[0][1].returns['3'])}で最も高く、${sorted.at(-1)[1].name}が${fmt(sorted.at(-1)[1].returns['3'])}で最も低い順です。</p><table><thead><tr><th>業種</th><th>週次の位置</th><th>1か月</th><th>3か月</th><th>6か月</th></tr></thead><tbody>`;
    for(const [code,s] of sorted)table+=`<tr data-symbol="${code}"><th scope="row">${s.name}</th><td>${s.quadrant}</td><td>${fmt(s.returns['1'])}</td><td>${fmt(s.returns['3'])}</td><td>${fmt(s.returns['6'])}</td></tr>`;
    document.getElementById('sr-table').innerHTML=table+'</tbody></table>';
  }
  const version=document.querySelector('script[src*="sector-rotation-overview.js"]')?.dataset.version||'';
  fetch(`sector-rotation-overview.json?v=${version}`).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}).then(render).catch(e=>{document.getElementById('sr-market').textContent=`データを読み込めませんでした：${e.message}`;});
})();
