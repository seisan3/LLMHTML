(() => {
  'use strict';
  const root=document.getElementById('cta-position');if(!root)return;
  const script=document.currentScript;
  const $=id=>root.querySelector('#'+id);
  const NS='http://www.w3.org/2000/svg';
  const node=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
  const f=(x,n=1)=>x===null||x===undefined?'—':x.toLocaleString('ja-JP',{minimumFractionDigits:n,maximumFractionDigits:n});
  const sign=x=>x===null||x===undefined?'—':(x>0?'+':'')+f(x);
  const labels={flat:'横ばい',down1:'緩やかに−1σ',down2:'緩やかに−2σ',sudden:'初日に−1σ、以降横ばい',up1:'緩やかに＋1σ'};
  fetch(new URL('cta-exhaustion.json',script.src)).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}).then(data=>{
    const rows=data.rows.filter(r=>r.remaining!==null);
    const date=$('cx-date'),period=$('cx-period');date.min=rows[0].date;date.max=rows.at(-1).date;date.value=date.max;
    function renderChart(id,view,metric){
      const el=$(id),narrow=el.clientWidth<500,W=narrow?390:1000,H=narrow?330:340,L=narrow?46:65,R=W-(narrow?48:65),T=38,B=H-38;
      const times=view.map(r=>Date.parse(r.date));const x=i=>L+(times[i]-times[0])/Math.max(86400000,times.at(-1)-times[0])*(R-L);
      const priceLo=Math.floor(Math.min(...view.map(r=>r.spy))*.98/10)*10,priceHi=Math.ceil(Math.max(...view.map(r=>r.spy))*1.02/10)*10;
      let lo=0,hi=100;
      if(metric==='core_net'){lo=Math.floor(Math.min(0,...view.map(r=>r.core_net*100))/25)*25;hi=Math.ceil(Math.max(25,...view.map(r=>r.core_net*100))/25)*25;}
      const y=v=>B-(v-lo)/(hi-lo)*(B-T),yp=v=>B-(v-priceLo)/(priceHi-priceLo)*(B-T);
      const svg=node('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':metric==='progress'?'ショート枯れ進行率とSPYの2軸グラフ':'ネット保有量とSPYの2軸グラフ'});
      svg.append(node('text',{x:L,y:16,class:'cx-left'},metric==='progress'?'枯れ進行率（%）':'ネット保有量（資金比 %）'),node('text',{x:R,y:16,'text-anchor':'end',class:'cx-right'},'SPY（USD）'));
      for(let i=0;i<=4;i++){let yy=T+(B-T)*i/4;svg.append(node('line',{x1:L,x2:R,y1:yy,y2:yy,stroke:'#e3ddd3'}),node('text',{x:L-8,y:yy+4,'text-anchor':'end',class:'cx-left'},f(hi-(hi-lo)*i/4,(hi-lo)%4?1:0)),node('text',{x:R+8,y:yy+4,class:'cx-right'},f(priceHi-(priceHi-priceLo)*i/4,0)));}
      if(metric==='progress'){
        svg.append(node('line',{x1:L,x2:R,y1:y(80),y2:y(80),stroke:'#98664a','stroke-dasharray':'4 4','stroke-opacity':'.6'}));
        let run=[];const flush=()=>{if(run.length>1){const pts=run.map(i=>`${x(i)},${y(view[i].model_min)}`).join(' ')+' '+run.toReversed().map(i=>`${x(i)},${y(view[i].model_max)}`).join(' ');svg.append(node('polygon',{points:pts,fill:'#98664a','fill-opacity':'.13','data-band':'sensitivity'}));}run=[];};
        view.forEach((r,i)=>{if(r.model_min!==null&&r.model_max!==null&&r.progress!==null)run.push(i);else flush();});flush();
      } else svg.append(node('line',{x1:L,x2:R,y1:y(0),y2:y(0),stroke:'#aaa096','stroke-dasharray':'3 4'}));
      let path='',open=false;view.forEach((r,i)=>{const v=metric==='progress'?r.progress:r.core_net*100;if(v===null){open=false;return;}path+=(open?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2);open=true;});
      svg.append(node('path',{d:path,fill:'none',stroke:'#98664a','stroke-width':2.2,'vector-effect':'non-scaling-stroke','data-series':metric}));
      svg.append(node('polyline',{points:view.map((r,i)=>`${x(i)},${yp(r.spy)}`).join(' '),fill:'none',stroke:'#155d91','stroke-width':2,'vector-effect':'non-scaling-stroke','data-series':'spy'}));
      if(metric==='progress')view.forEach((r,i)=>{if(r.candidate)svg.append(node('circle',{cx:x(i),cy:y(r.progress),r:4,fill:'#98664a','data-candidate':r.date}));});
      [...new Set([0,Math.floor((view.length-1)/2),view.length-1])].forEach((i,j)=>svg.append(node('text',{x:x(i),y:H-12,'text-anchor':j===0?'start':j===2?'end':'middle'},view[i].date.slice(0,7))));
      const cross=node('line',{x1:R,x2:R,y1:T,y2:B,stroke:'#8b8173','stroke-dasharray':'3 4',visibility:'hidden'});svg.append(cross);
      const hit=node('rect',{x:L,y:T,width:R-L,height:B-T,fill:'transparent'});
      hit.addEventListener('pointermove',e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const xx=pt.matrixTransform(svg.getScreenCTM().inverse()).x;const t=times[0]+(xx-L)/(R-L)*(times.at(-1)-times[0]);let best=0;for(let i=1;i<times.length;i++)if(Math.abs(times[i]-t)<Math.abs(times[best]-t))best=i;const r=view[best];cross.setAttribute('x1',x(best));cross.setAttribute('x2',x(best));cross.setAttribute('visibility','visible');$('cx-hover').textContent=`${r.date}｜売り進行率 ${r.progress===null?'判定対象外':f(r.progress)+'%'}｜残る売り余地 ${f(r.remaining)}%資金比｜ネット ${sign(r.core_net*100)}%｜SPY $${f(r.spy,2)}`;});
      hit.addEventListener('pointerleave',()=>{cross.setAttribute('visibility','hidden');$('cx-hover').textContent='線に触れると、その日の推定値を表示します。';});svg.append(hit);el.replaceChildren(svg);
    }
    function draw(){
      const r=rows.filter(r=>r.date<=date.value).at(-1)||rows[0];date.value=r.date;
      const d=new Date(r.date+'T00:00:00Z');d.setUTCFullYear(d.getUTCFullYear()-Number(period.value||10));
      const start=period.value==='all'?rows[0].date:d.toISOString().slice(0,10);const view=rows.filter(v=>v.date>=start&&v.date<=r.date);
      const status=r.progress===null?(r.core_net>=0?'現在はネット買い持ち':'ショートが小さく判定対象外'):r.progress>=80?'ショート枯れ候補':'追加ショート余地あり';
      $('cx-reading').replaceChildren();const strong=document.createElement('strong');strong.className='cx-status';strong.textContent=`${r.date}：${status}`;$('cx-reading').append(strong,document.createTextNode(`。${r.progress===null?'ショート枯れは資金比10%以上の売り持ちで判定します。':`ショート枯れ進行率 ${f(r.progress)}%。`} 推定ショート ${f(r.core_short)}%、ネット保有量 ${sign(r.core_net*100)}%。想定経路内の最大追加売り余地 ${f(r.remaining)}%（現在価格換算・資金比、買い持ちの解消を含む）。`));
      $('cx-model-range').textContent=`売り持ち条件を満たすモデルは${r.nActiveModels}／5。枯れ進行率 ${f(r.model_min)}〜${f(r.model_max)}%。速さと値幅仮定による感応度で、統計的な信頼区間ではありません。`;
      renderChart('cx-progress-chart',view,'progress');renderChart('cx-net-chart',view,'core_net');
      $('cx-window').textContent=`${view[0].date} → ${r.date}（${view.length.toLocaleString()}観測）。進行率の空白は判定対象外。SPY右軸はゼロ起点ではありません。`;
      const tbody=$('cx-scenarios');tbody.replaceChildren();
      for(const key of ['flat','down1','down2','sudden','up1']){
        const s=r.scenarios[key];const tr=document.createElement('tr');
        for(const v of [labels[key],`${sign(s.return20)}%`,`${sign(s.flow5)}%`,`${sign(s.flow20)}%`,`${f(s.remaining)}%`]){const td=document.createElement(tr.childElementCount===0?'th':'td');if(tr.childElementCount===0)td.scope='row';td.textContent=v;tr.append(td);}tbody.append(tr);
      }
      $('cx-scenario-caption').textContent=`${r.date}の主モデルから20営業日先まで試算。1σは当日時点の推定ボラから計算した20日変動幅。値は資金比%、マイナスは売り・プラスは買いです。保有量ではなく取引による増減です。日中値幅は直近20日の中央値と仮定。`;
    }
    date.addEventListener('change',draw);period.addEventListener('change',draw);$('cx-latest').addEventListener('click',()=>{date.value=date.max;draw();});
    const examples=rows.filter(r=>r.progress!==null).sort((a,b)=>b.progress-a.progress);$('cx-example').disabled=!examples.length;$('cx-example').addEventListener('click',()=>{date.value=examples[0].date;draw();});
    const observer=new ResizeObserver(draw);observer.observe($('cx-progress-chart'));observer.observe($('cx-net-chart'));draw();
  }).catch(e=>{$('cx-reading').textContent=`計算値を読み込めませんでした（${e.message}）。図表データへのリンクをご確認ください。`;});
})();
