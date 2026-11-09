/* 思路画布的数据与几何逻辑。所有手动内容均为用户笔记。 */
(() => {
  'use strict';
  const MAX_IDEAS=20, MAX_LITERATURE=20, MAX_EDGES=150;
  const literatureUses={reference:'备选文献',method:'方法借鉴',innovation:'创新点借鉴',review:'综述梳理',finding:'研究发现'};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const finite=(value,fallback,min,max)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
  const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
  function citation(input={}) {
    const id=input.sourceId||input.id;let url='';
    try{const u=new URL(input.url);if(['https:','http:'].includes(u.protocol))url=u.href;}catch{}
    const doi=text(input.doi,300);
    return{sourceId:/^(E\d{2}|L[0-9a-f]+)$/.test(id)?id:'',title:text(input.title,2000),authors:text(input.authors,4000),journal:text(input.journal,300),year:text(String(input.year||''),4),doi,url:url||(doi?'https://doi.org/'+encodeURI(doi):''),volume:text(input.volume,40),issue:text(input.issue,40),pages:text(input.pages,100),articleNumber:text(input.articleNumber,100)};
  }
  function position(index,count,idea=false) {
    const columns=count<=4?1:Math.min(4,Math.ceil(count/4));
    const rows=Math.ceil(count/columns)||1;
    return idea?{x:490+columns*290+Math.floor(index/4)*280,y:80+(index%4)*120}
      :{x:490+Math.floor(index/rows)*290,y:80+(index%rows)*112};
  }
  function nextId(board,prefix) {
    let id;do{id=`${prefix}-${++board.sequence}`;}while(board.nodes.some(n=>n.id===id)||board.edges.some(e=>e.id===id));
    return id;
  }
  function reconcile(input,basis,fields) {
    const valid=input&&input.baseId===basis.id&&Array.isArray(input.nodes);
    const source=valid?input:{},old=Array.isArray(source.nodes)?source.nodes:[];
    const board={schema:1,baseId:basis.id,nodes:[],edges:[],sequence:Math.floor(finite(source.sequence,0,0,1000000)),view:null,layout:source.layout==='vertical'?'vertical':'horizontal',customLayout:source.customLayout===true};
    const rows=fields.length<=4?fields.length:Math.ceil(fields.length/Math.min(4,Math.ceil(fields.length/4)));
    const specs=[{id:'base',kind:'base',title:basis.name,role:'基础学科',info:basis.object,width:230,height:104,x:70,y:80+Math.max(0,rows-1)*56},
      ...fields.map((f,i)=>({id:`field-${f.id}`,kind:'field',title:f.name,role:f.role+'视角',info:f.contribution,width:220,height:88,...position(i,fields.length)}))];
    const storedIds=new Set(old.filter(n=>n&&typeof n==='object').map(n=>n.id));
    for(const spec of specs) {
      const stored=old.find(n=>n&&n.id===spec.id)||{};
      board.nodes.push({...spec,x:finite(stored.x,spec.x,24,5700),y:finite(stored.y,spec.y,24,4700),note:text(stored.note,1000)});
    }
    const used=new Set(board.nodes.map(n=>n.id));
    for(const n of old) {
      if(!n||typeof n.id!=='string'||! /^(idea|literature)-\d{1,7}$/.test(n.id)||used.has(n.id))continue;
      const literature=n.kind==='literature'&&n.id.startsWith('literature-'),kind=literature?'literature':'idea';
      if(board.nodes.filter(x=>x.kind===kind).length>=(literature?MAX_LITERATURE:MAX_IDEAS))continue;
      const pos=position(board.nodes.length-specs.length,fields.length,true);
      const useType=Object.hasOwn(literatureUses,n.useType)?n.useType:'reference',ref=literature?citation({...n.citation,sourceId:n.sourceId||n.citation?.sourceId}):null;
      if(literature&&(!ref.sourceId||!ref.title))continue;
      board.nodes.push({id:n.id,kind,title:text(n.title,40).trim()||(literature?literatureUses[useType]:'未命名想法'),role:literature?literatureUses[useType]:'我的想法',info:literature?'文献与使用说明，未自动验证结论':'手动记录，尚待检验',width:literature?260:230,height:literature?124:96,note:text(n.note,1000),x:finite(n.x,pos.x,24,5700),y:finite(n.y,pos.y,24,4700),...(literature?{sourceId:ref.sourceId,citation:ref,useType,locator:text(n.locator,500)}:{})});
      used.add(n.id);
    }
    const pairs=new Set(),edgeIds=new Set();
    for(const e of Array.isArray(source.edges)?source.edges.slice(0,MAX_EDGES):[]) {
      if(!e||!used.has(e.from)||!used.has(e.to)||e.from===e.to||pairs.has(`${e.from}>${e.to}`))continue;
      const id=typeof e.id==='string'&&/^edge-\d{1,7}$/.test(e.id)&&!edgeIds.has(e.id)?e.id:nextId(board,'edge');
      board.edges.push({id,from:e.from,to:e.to,label:text(e.label,60),kind:e.kind==='manual'?'manual':'discipline',...(e.usageLink===true&&board.nodes.find(n=>n.id===e.from)?.kind==='literature'?{usageLink:true}:{})});
      edgeIds.add(id);pairs.add(`${e.from}>${e.to}`);
    }
    for(const f of fields) {
      const id=`field-${f.id}`;
      if(!valid||!storedIds.has(id)) connect(board,'base',id,'','discipline');
    }
    if(source.view&&typeof source.view==='object'&&Number.isFinite(source.view.k)) {
      board.view={x:finite(source.view.x,0,-20000,20000),y:finite(source.view.y,0,-20000,20000),k:finite(source.view.k,1,.05,2.2),w:finite(source.view.w,0,0,5000),h:finite(source.view.h,0,0,5000)};
    }
    if(board.layout==='vertical'&&!board.customLayout)arrange(board,true);
    return board;
  }
  function move(board,id,x,y) {
    const node=board.nodes.find(n=>n.id===id);if(!node)return false;
    node.x=Math.round(finite(x,node.x,24,5700)*10)/10;node.y=Math.round(finite(y,node.y,24,4700)*10)/10;board.customLayout=true;return true;
  }
  function freeSpot(board,point,width=230,height=96) {
    let x=finite(point?.x,830,24,5500),y=finite(point?.y,80,24,4500);
    for(let i=0;i<80;i++) {
      if(!board.nodes.some(n=>x<n.x+n.width+18&&x+width+18>n.x&&y<n.y+n.height+18&&y+height+18>n.y))return{x,y};
      y+=116;if(y>4500){y=80;x=Math.min(x+280,5500);}
    }
    return{x,y};
  }
  function addIdea(board,point) {
    if(board.nodes.filter(n=>n.kind==='idea').length>=MAX_IDEAS)return null;
    const node={id:nextId(board,'idea'),kind:'idea',title:'未命名想法',role:'我的想法',info:'手动记录，尚待检验',width:230,height:96,note:'',...freeSpot(board,point)};
    board.nodes.push(node);board.customLayout=true;return node;
  }
  function addLiterature(board,paper,options={}) {
    const ref=citation(paper);if(!ref.sourceId||!ref.title||board.nodes.filter(n=>n.kind==='literature').length>=MAX_LITERATURE)return null;
    const useType=Object.hasOwn(literatureUses,options.useType)?options.useType:'reference';
    const node={id:nextId(board,'literature'),kind:'literature',title:text(options.title,40).trim()||literatureUses[useType],role:literatureUses[useType],info:'文献与使用说明，未自动验证结论',sourceId:ref.sourceId,citation:ref,useType,locator:text(options.locator,500),note:text(options.note,1000),width:260,height:124,...freeSpot(board,options.point||{x:70,y:300},260,124)};
    board.nodes.push(node);board.customLayout=true;return node;
  }
  function connect(board,from,to,label='',kind='manual') {
    if(from===to||!board.nodes.some(n=>n.id===from)||!board.nodes.some(n=>n.id===to))return{error:'invalid'};
    const existing=board.edges.find(e=>e.from===from&&e.to===to);if(existing)return{edge:existing,existing:true};
    if(board.edges.length>=MAX_EDGES)return{error:'limit'};
    const edge={id:nextId(board,'edge'),from,to,label:text(label,60),kind};board.edges.push(edge);return{edge};
  }
  function removeIdea(board,id) {
    if(!board.nodes.some(n=>n.id===id&&['idea','literature'].includes(n.kind)))return false;
    board.nodes=board.nodes.filter(n=>n.id!==id);board.edges=board.edges.filter(e=>e.from!==id&&e.to!==id);return true;
  }
  function arrange(board,vertical=false) {
    board.customLayout=false;board.layout=vertical?'vertical':'horizontal';
    if(vertical) {
      board.nodes.forEach((n,i)=>{n.x=i?70+Math.floor((i-1)/18)*280:70;n.y=i?220+((i-1)%18)*130:60;});return;
    }
    const fields=board.nodes.filter(n=>n.kind==='field'),ideas=board.nodes.filter(n=>['idea','literature'].includes(n.kind));
    fields.forEach((n,i)=>Object.assign(n,position(i,fields.length)));
    ideas.forEach((n,i)=>Object.assign(n,{...position(i,fields.length,true),y:80+(i%4)*150}));
    const b=board.nodes.find(n=>n.kind==='base');
    if(b){b.x=70;b.y=80+Math.max(0,Math.ceil(fields.length/(fields.length<=4?1:Math.min(4,Math.ceil(fields.length/4))))-1)*56;}
  }
  function bounds(board) {
    return{left:Math.min(...board.nodes.map(n=>n.x)),top:Math.min(...board.nodes.map(n=>n.y)),right:Math.max(...board.nodes.map(n=>n.x+n.width)),bottom:Math.max(...board.nodes.map(n=>n.y+n.height))};
  }
  function fit(board,width,height) {
    const b=bounds(board),w=b.right-b.left,h=b.bottom-b.top;
    const k=finite(Math.min((width-90)/(w||1),(height-90)/(h||1)),1,.05,1.15);
    return{x:(width-w*k)/2-b.left*k,y:(height-h*k)/2-b.top*k,k,w:width,h:height};
  }
  function curve(from,to) {
    const a={x:from.x+from.width/2,y:from.y+from.height/2},b={x:to.x+to.width/2,y:to.y+to.height/2};
    const horizontal=Math.abs(a.x-b.x)>Math.abs(a.y-b.y)*.9;
    let s,t,c1,c2;
    if(horizontal){const sign=b.x>=a.x?1:-1;s={x:a.x+sign*from.width/2,y:a.y};t={x:b.x-sign*to.width/2,y:b.y};const bend=Math.max(70,Math.abs(t.x-s.x)*.45);c1={x:s.x+sign*bend,y:s.y};c2={x:t.x-sign*bend,y:t.y};}
    else{const sign=b.y>=a.y?1:-1;s={x:a.x,y:a.y+sign*from.height/2};t={x:b.x,y:b.y-sign*to.height/2};const bend=Math.max(60,Math.abs(t.y-s.y)*.45);c1={x:s.x,y:s.y+sign*bend};c2={x:t.x,y:t.y-sign*bend};}
    return{d:`M${s.x},${s.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${t.x},${t.y}`,x:(s.x+3*c1.x+3*c2.x+t.x)/8,y:(s.y+3*c1.y+3*c2.y+t.y)/8};
  }
  function lines(board) {
    const title=id=>board.nodes.find(n=>n.id===id)?.title||id;
    return ['我的思路画布（手动笔记与关联，不代表文献结论）',...board.nodes.filter(n=>n.kind==='idea'||n.kind==='literature'||n.note).map(n=>n.kind==='literature'?`${n.id} ${n.title} [${literatureUses[n.useType]}]；来源 [${n.sourceId}] ${n.citation.title} (${n.citation.year})；DOI: ${n.citation.doi||'未提供'} ${n.citation.url}；使用说明：${n.note||'先作为备选'}；原文位置：${n.locator||'尚未标注'}`:`${n.id} ${n.title}${n.kind==='idea'?' [我的想法]':''}：${n.note||'（未填写说明）'}`),
      ...board.edges.map(e=>`${title(e.from)} → ${title(e.to)}${e.label?'：'+e.label:''} [${e.kind==='manual'?'手动关联':'学科关联'}]`)];
  }
  window.AtlasGraphModel={clone,reconcile,move,addIdea,addLiterature,citation,literatureUses,connect,removeIdea,arrange,bounds,fit,curve,lines};
})();
