(() => {
  'use strict';
  const M=window.AtlasGraphModel;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths={plus:'M12 5v14M5 12h14',minus:'M5 12h14',link:'m10 13 4-4M9 15l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
    arrange:'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z',undo:'M8 5 3 10l5 5M3 10h10a7 7 0 0 1 7 7',redo:'m16 5 5 5-5 5m5-5H11a7 7 0 0 0-7 7',
    fit:'M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6',close:'m6 6 12 12M6 18 18 6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    left:'M19 12H5m6-6-6 6 6 6',right:'M5 12h14m-6-6 6 6-6 6',up:'M12 19V5m-6 6 6-6 6 6',down:'M12 5v14m-6-6 6 6 6-6',grip:'M8 6h.1M16 6h.1M8 12h.1M16 12h.1M8 18h.1M16 18h.1'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
  const tool=(action,name,label,extra='')=>`<button type="button" class="graph-tool" data-graph-action="${action}" ${extra}>${icon(name)}<span>${label}</span></button>`;
  function mount(root,initialBoard,onUpdate,options={}) {
    let board=M.clone(initialBoard),selected=null,linking=false,linkStart=null,drag=null,ignoreClick=false,editing=null,focusByPointer=false;
    const past=options.history?.past||[],future=options.history?.future||[];
    root.classList.toggle('graph-compact',!!options.compact);
    const evidence=(type,id)=>options.getAnnotation?.(type,id,board)||options.getReview?.(type,id,board);
    const evidenceText=(type,id)=>{const r=evidence(type,id);return r?r.label+(r.count?' · '+r.count+'条依据':''):'';};
    const evidencePanel=(type,id)=>options.onReview?`<div class="graph-evidence"><p><strong>${esc(evidenceText(type,id))}</strong><span>先写清具体论断，再记录支持、分歧与原文位置。</span></p><button type="button" class="graph-tool" data-graph-action="review">核查依据 ↗</button></div>`:'';
    root.innerHTML=`<div class="graph-toolbar"><div class="graph-tools">${tool('add','plus','添加想法')}${tool('link','link',options.compact?'连线':'添加连线','aria-label="添加连线" aria-pressed="false"')}${options.compact?'':tool('arrange','arrange','自动整理')}</div><div class="graph-tools graph-history">${tool('undo','undo','撤销','aria-label="撤销画布操作" disabled')}${tool('redo','redo','重做','aria-label="重做画布操作" disabled')}${options.compact?`<details class="graph-more"><summary>更多</summary><div>${tool('arrange','arrange','自动整理')}${tool('export','download','导出思路','aria-label="导出思路"')}</div></details>`:tool('export','download','导出思路','aria-label="导出思路"')}</div></div><div class="graph-instructions"><span id="graph-hint" role="status" aria-live="polite">${options.compact?'拖动调整位置，点选节点或连线可修改。':'拖动节点整理思路，拖动空白处移动画布。'}</span><span class="graph-saved" id="graph-saved">已保存在本机</span></div><div class="graph-stage" tabindex="0" role="region" aria-label="可编辑的思路画布" aria-describedby="graph-keyboard-help"><div class="graph-layer"></div><div class="graph-zoom"><button type="button" data-graph-action="zoom-out" aria-label="缩小画布">${icon('minus')}</button><span id="graph-zoom-label">100%</span><button type="button" data-graph-action="zoom-in" aria-label="放大画布">${icon('plus')}</button><button type="button" data-graph-action="fit" aria-label="显示全部节点" title="显示全部节点">${icon('fit')}</button></div><div class="graph-legend"><span>学科关联</span><span>我的关联</span></div></div><div class="graph-inspector" aria-label="思路编辑区"></div>${options.compact?'<details class="graph-help"><summary>操作提示</summary>':''}<p class="graph-keyboard-help" id="graph-keyboard-help">点选节点后可用方向键微调，Shift 加快；也可使用下方移动按钮。位置、文献用途和连线会保存；可以选中文献卡片继续修改。</p>${options.compact?'</details>':''}`;
    const $=s=>root.querySelector(s),stage=$('.graph-stage'),layer=$('.graph-layer'),inspector=$('.graph-inspector');
    const node=id=>board.nodes.find(n=>n.id===id);
    const selectedNode=()=>selected?.type==='node'?node(selected.id):null;
    const selectedEdge=()=>selected?.type==='edge'?board.edges.find(e=>e.id===selected.id):null;
    const snapshot=()=>M.clone(board);
    function hint(message) {$('#graph-hint').textContent=message;}
    function publish(action='') {
      const saved=onUpdate(M.clone(board),action);
      $('#graph-saved').textContent=saved===false?'未保存，请导出思路备份':'已保存在本机';
    }
    function historyButtons() {
      $('[data-graph-action="undo"]').disabled=!past.length;
      $('[data-graph-action="redo"]').disabled=!future.length;
    }
    function commit(before,action) {
      if(JSON.stringify(before.nodes)===JSON.stringify(board.nodes)&&JSON.stringify(before.edges)===JSON.stringify(board.edges))return;
      past.push(before);if(past.length>40)past.shift();future.length=0;historyButtons();publish(action);
    }
    function transform() {
      const v=board.view;layer.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.k})`;
      stage.style.backgroundSize=`${24*v.k}px ${24*v.k}px`;stage.style.backgroundPosition=`${v.x}px ${v.y}px`;
      $('#graph-zoom-label').textContent=Math.round(v.k*100)+'%';
    }
    function fittedView(width,height) {
      const items=[...board.nodes];
      for(const e of board.edges) {
        const p=caption(e,M.curve(node(e.from),node(e.to)));
        if(!p.label)continue;
        items.push({x:p.x-p.width/2,y:p.y-16,width:p.width,height:31});
      }
      return M.fit({nodes:items},width,height);
    }
    function fit(save=true) {board.view=fittedView(stage.clientWidth,stage.clientHeight);transform();if(save)publish();}
    function defaultView() {
      if(stage.clientWidth<520&&board.layout==='vertical') {
        const b=node('base'),k=Math.min(1,(stage.clientWidth-40)/230);
        board.view={x:(stage.clientWidth-b.width*k)/2-b.x*k,y:30-b.y*k,k,w:stage.clientWidth,h:stage.clientHeight};transform();publish();
      } else fit();
    }
    function caption(edge,c) {
      const r=evidence('edge',edge.id),raw=r?.required?((edge.label||'待说明关系').slice(0,14)+' · '+r.label):edge.label;
      const label=raw.length>24?raw.slice(0,23)+'…':raw,width=Math.min(320,label.length*13+18);
      let y=c.y;
      for(const offset of [0,-40,40,-75,75,-110,110]) {
        const candidate=c.y+offset;
        if(!board.nodes.some(n=>c.x-width/2<n.x+n.width+6&&c.x+width/2>n.x-6&&candidate-16<n.y+n.height+6&&candidate+15>n.y-6)){y=candidate;break;}
      }
      return{label,width,x:c.x,y};
    }
    function edgeMarkup(edge) {
      const from=node(edge.from),to=node(edge.to),c=M.curve(from,to),manual=edge.kind==='manual';
      const p=caption(edge,c);
      return `<g data-edge="${edge.id}" class="graph-edge ${manual?'manual':''} ${edge.usageLink?'literature-link':''}" role="button" tabindex="0" aria-label="${esc(from.title+' → '+to.title+(edge.label?'：'+edge.label:''))}"><path class="graph-edge-hit" d="${c.d}"/><path class="graph-edge-line" d="${c.d}" marker-end="url(#graph-arrow-${edge.usageLink?'literature':manual?'manual':'auto'})"/>${p.label?`<line class="graph-caption-leader" x1="${c.x}" y1="${c.y}" x2="${p.x}" y2="${p.y}"/><g class="graph-edge-caption" transform="translate(${p.x},${p.y})"><rect x="${-p.width/2}" y="-15" width="${p.width}" height="28" rx="4"/><text text-anchor="middle" y="4">${esc(p.label)}</text></g>`:''}</g>`;
    }
    function literatureLine(n) {return '['+n.sourceId+'] '+(n.note||'先作为备选');}
    function nodeMarkup(n) {
      return `<button type="button" class="graph-node ${n.kind}" data-node="${n.id}" aria-label="${esc(n.title)}，${n.kind==='literature'?esc(n.role)+'，':''}可拖动，方向键微调" aria-pressed="false" style="width:${n.width}px;height:${n.height}px;transform:translate(${n.x}px,${n.y}px)"><span class="graph-grip">${icon('grip')}</span><span class="graph-node-role">${esc(n.role)}</span><strong class="graph-node-title">${esc(n.title)}</strong><span class="graph-node-note">${esc(n.kind==='literature'?literatureLine(n):n.note?'有思考笔记':'拖动调整')}</span><span class="graph-port"></span></button>`;
    }
    function renderScene(focusId) {
      layer.innerHTML=`<svg class="graph-connections" width="6000" height="5000" aria-label="思路连线"><defs><marker id="graph-arrow-auto" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" fill="none" stroke="#8b9f7d"/></marker><marker id="graph-arrow-manual" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" fill="none" stroke="#a65f3d"/></marker><marker id="graph-arrow-literature" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" fill="none" stroke="var(--adoption, #08735d)"/></marker></defs>${board.edges.map(edgeMarkup).join('')}</svg>${board.nodes.map(nodeMarkup).join('')}`;
      if(options.getReview||options.getAnnotation)for(const n of board.nodes){const el=layer.querySelector(`[data-node="${n.id}"]`),r=evidence('node',n.id);if(el&&r){if(n.kind!=='literature')el.querySelector('.graph-node-note').textContent=evidenceText('node',n.id);el.dataset.evidence=r.status;}}
      if(options.getReview||options.getAnnotation)for(const e of board.edges){const el=layer.querySelector(`[data-edge="${e.id}"]`),r=evidence('edge',e.id);if(el&&r)el.dataset.evidence=r.status;}
      transform();paintSelection();
      if(focusId)layer.querySelector(`[data-node="${focusId}"]`)?.focus({preventScroll:true});
    }
    function paint() {
      for(const n of board.nodes) {
        const el=layer.querySelector(`[data-node="${n.id}"]`);if(!el)continue;
        el.style.transform=`translate(${n.x}px,${n.y}px)`;
      }
      for(const edge of board.edges) {
        const el=layer.querySelector(`[data-edge="${edge.id}"]`),c=M.curve(node(edge.from),node(edge.to));
        el?.querySelectorAll('path').forEach(path=>path.setAttribute('d',c.d));
        const p=caption(edge,c);
        el?.querySelector('.graph-edge-caption')?.setAttribute('transform',`translate(${p.x},${p.y})`);
        const leader=el?.querySelector('.graph-caption-leader');
        if(leader){leader.setAttribute('x1',c.x);leader.setAttribute('y1',c.y);leader.setAttribute('x2',p.x);leader.setAttribute('y2',p.y);}
      }
      transform();
    }
    function paintSelection() {
      layer.querySelectorAll('[data-node]').forEach(el=>{
        const active=selected?.type==='node'&&selected.id===el.dataset.node;
        el.classList.toggle('selected',active);el.classList.toggle('link-start',linkStart===el.dataset.node);el.setAttribute('aria-pressed',String(active));
      });
      layer.querySelectorAll('[data-edge]').forEach(el=>el.classList.toggle('selected',selected?.type==='edge'&&selected.id===el.dataset.edge));
      stage.classList.toggle('connecting',linking);
      $('[data-graph-action="link"]').setAttribute('aria-pressed',String(linking));
    }
    function edgePicker() {
      return `<label class="graph-edge-picker">查看连线<select id="graph-edge-picker"><option value="">选择一条连线…</option>${board.edges.map(e=>`<option value="${e.id}" ${selected?.type==='edge'&&selected.id===e.id?'selected':''}>${esc(node(e.from).title+' → '+node(e.to).title)}</option>`).join('')}</select></label>`;
    }
    function renderInspector() {
      const n=selectedNode(),e=selectedEdge();editing=null;
      if(n) {
        const paper=n.kind==='literature',managed=paper&&options.onLiterature;
        const fields=managed?`<div class="graph-literature-edit"><p>在文献面板中调整这张卡片的用途与说明。</p><button type="button" class="graph-tool" data-graph-action="edit-literature">编辑文献用途</button>${n.citation?.url?`<a href="${esc(n.citation.url)}" target="_blank" rel="noopener noreferrer">打开原文</a>`:''}</div>`:`<div class="graph-note-fields">${['idea','literature'].includes(n.kind)?`<label>${paper?'卡片名称':'想法名称'}<input id="graph-node-title" data-edit="title" maxlength="40" value="${esc(n.title)}"></label>`:''}${paper?`<label>文献用途<select id="graph-literature-use" data-edit="useType">${Object.entries(M.literatureUses).map(([id,label])=>`<option value="${id}" ${n.useType===id?'selected':''}>${label}</option>`).join('')}</select></label>`:''}<label for="graph-node-note">${paper?'具体怎样使用':'我的思考'}<textarea id="graph-node-note" data-edit="note" maxlength="1000" placeholder="${paper?'记录想借鉴的内容及使用边界':'它与研究问题有什么联系？'}">${esc(n.note)}</textarea></label>${paper?`<label>原文位置<input data-edit="locator" maxlength="500" value="${esc(n.locator)}" placeholder="例如：Methods / 第6页"></label>${n.citation?.url?`<a href="${esc(n.citation.url)}" target="_blank" rel="noopener noreferrer">${esc(n.citation.title)}</a>`:''}`:''}</div>`;
        inspector.innerHTML=`<div class="graph-selected-title"><span>${esc(n.role)}</span><strong>${esc(n.title)}</strong><p>${esc(n.info)}</p></div>${fields}<div class="graph-node-actions"><span>点按微调位置</span><div class="graph-nudges">${['up','left','down','right'].map(dir=>`<button type="button" data-graph-action="move-${dir}" aria-label="${{up:'上移',left:'左移',down:'下移',right:'右移'}[dir]}当前节点">${icon(dir)}</button>`).join('')}</div>${['idea','literature'].includes(n.kind)?tool('delete-node','close',paper?'移除文献卡片':'删除想法'):''}<button type="button" class="graph-text-button" data-graph-action="close">收起编辑</button></div>`;
      } else if(e) {
        inspector.innerHTML=`<div class="graph-selected-title"><span>${e.usageLink?'文献用途关联':e.kind==='manual'?'我的关联':'学科关联'}</span><strong>${esc(node(e.from).title)} → ${esc(node(e.to).title)}</strong><p>在这里写清楚两个节点之间的关系。</p></div><div class="graph-note-fields"><label>关联说明<input id="graph-edge-label" data-edit="label" maxlength="60" value="${esc(e.label)}" placeholder="例如：提供测量方法"></label>${edgePicker()}</div><div class="graph-node-actions">${tool('delete-edge','close','删除连线')}<button type="button" class="graph-text-button" data-graph-action="close">收起编辑</button></div>`;
      } else inspector.innerHTML=options.compact?`<details class="graph-line-options"><summary>编辑已有连线</summary>${edgePicker()}</details>`:`<div class="graph-empty-inspector"><p><strong>整理研究思路。</strong><span>点选节点记录想法，也可以连线说明关联。</span></p>${edgePicker()}</div>`;
      if(options.onReview&&n)inspector.insertAdjacentHTML('beforeend',evidencePanel('node',n.id));
      else if(options.onReview&&e)inspector.insertAdjacentHTML('beforeend',evidencePanel('edge',e.id));
      const extra=selected&&options.renderSupplement?.(selected.type,selected.id,board);
      if(extra)inspector.insertAdjacentHTML('beforeend',`<div class="graph-source-supplement">${extra}</div>`);
      options.onSelection?.(selected?{...selected}:null,board);
    }
    function select(type,id) {if(editing){commit(editing,'edit-note');editing=null;}selected={type,id};paintSelection();renderInspector();}
    function zoom(factor) {
      const v=board.view,k=Math.max(.05,Math.min(2.2,v.k*factor)),cx=stage.clientWidth/2,cy=stage.clientHeight/2;
      v.x=cx-(cx-v.x)*k/v.k;v.y=cy-(cy-v.y)*k/v.k;v.k=k;transform();publish();
    }
    function cancelLink() {linking=false;linkStart=null;paintSelection();hint('拖动节点整理思路，拖动空白处移动画布。');}
    function handleNode(id) {
      if(!linking){select('node',id);return;}
      if(!linkStart){linkStart=id;select('node',id);hint(`起点：${node(id).title}。再点一个节点完成连线，Esc 取消。`);return;}
      if(linkStart===id){hint('请选择另一个节点作为终点。');return;}
      const before=snapshot(),result=M.connect(board,linkStart,id);
      if(result.error){hint('连线数量已达上限，请先整理现有连线。');return;}
      cancelLink();selected={type:'edge',id:result.edge.id};
      if(!result.existing)commit(before,'connect');
      renderScene();renderInspector();$('#graph-edge-label')?.focus({preventScroll:true});
      hint(result.existing?'这条连线已存在，可修改它的说明。':'连线已添加，可以写下关联说明。');
    }
    function undo(redo=false) {
      const from=redo?future:past,to=redo?past:future;if(!from.length)return;
      const view=board.view;to.push(snapshot());board=from.pop();board.view=view;
      selected=null;cancelLink();renderScene();renderInspector();historyButtons();publish(redo?'redo':'undo');
      hint(redo?'已重做上一次画布操作。':'已撤销上一次画布操作。');
    }
    function nudge(dx,dy) {
      const n=selectedNode();if(!n)return;
      const before=snapshot();M.move(board,n.id,n.x+dx,n.y+dy);paint();commit(before,'move');
    }
    function download() {
      const content=['交点 · 我的思路画布',new Date().toLocaleString('zh-CN'),'',...M.lines(board),'','布局记录',...board.nodes.map(n=>`${n.title}: x=${n.x}, y=${n.y}`)].join('\r\n');
      const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');
      a.href=url;a.download='交点_思路画布.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);hint('思路记录已导出，包含想法、连线和节点位置。');
    }
    function action(name,value) {
      if(name==='add') {
        const before=snapshot(),v=board.view,idea=M.addIdea(board,{x:(stage.clientWidth*.6-v.x)/v.k-100,y:(stage.clientHeight*.5-v.y)/v.k-45});
        if(!idea){hint('最多添加20个想法，先整理或删除已有想法。');return;}
        cancelLink();selected={type:'node',id:idea.id};commit(before,'add-idea');
        const k=Math.max(.8,board.view.k);board.view={x:stage.clientWidth/2-(idea.x+idea.width/2)*k,y:stage.clientHeight/2-(idea.y+idea.height/2)*k,k,w:stage.clientWidth,h:stage.clientHeight};
        renderScene();renderInspector();publish();
        $('#graph-node-title').focus({preventScroll:stage.clientWidth>=520});$('#graph-node-title').select();hint('新想法已添加。写下名称，再用连线连接到学科。');
      } else if(name==='link') {
        if(linking)cancelLink();else{linking=true;linkStart=null;paintSelection();hint('先点起点 → 再点终点。按 Esc 取消。');}
      } else if(name==='arrange') {
        const before=snapshot();M.arrange(board,stage.clientWidth<520);cancelLink();commit(before,'arrange');defaultView();renderScene();hint('已整理节点位置，想法和连线都保留；可撤销。');
      } else if(name==='undo'||name==='redo')undo(name==='redo');
      else if(name==='zoom-in')zoom(1.2);else if(name==='zoom-out')zoom(1/1.2);else if(name==='fit')fit();
      else if(name==='close'){selected=null;paintSelection();renderInspector();}
      else if(name.startsWith('move-')){const [dx,dy]={up:[0,-20],left:[-20,0],down:[0,20],right:[20,0]}[name.slice(5)];nudge(dx,dy);}
      else if(name==='delete-node') {
        const before=snapshot();if(M.removeIdea(board,selected?.id)){selected=null;commit(before,'delete-idea');renderScene();renderInspector();hint('已移除卡片及相关连线，可撤销；文献仍保留在备选池。');}
      } else if(name==='delete-edge') {
        const before=snapshot();board.edges=board.edges.filter(e=>e.id!==selected?.id);selected=null;commit(before,'delete-edge');renderScene();renderInspector();hint('已删除连线，可撤销。');
      } else if(name==='export')download();
      else if(name==='edit-literature'&&selectedNode()?.kind==='literature')options.onLiterature?.(selected.id);
      else if(name==='open-literature')options.onOpenLiterature?.(value);
      else if(name==='review'&&selected){publish();options.onReview?.(selected.type,selected.id);}
    }
    function onClick(event) {
      const button=event.target.closest('[data-graph-action]');
      if(button){event.preventDefault();if(!button.disabled)action(button.dataset.graphAction,button.dataset.value);return;}
      if(ignoreClick){ignoreClick=false;return;}
      const n=event.target.closest('[data-node]'),e=event.target.closest('[data-edge]');
      if(n)handleNode(n.dataset.node);else if(e){cancelLink();select('edge',e.dataset.edge);}
    }
    function pointerDown(event) {
      focusByPointer=true;setTimeout(()=>{focusByPointer=false;},0);
      if(drag||event.button!==0||event.isPrimary===false)return;
      const el=event.target.closest('[data-node]');
      if(linking||event.target.closest('[data-edge],.graph-zoom'))return;
      const n=el?node(el.dataset.node):null;
      if(n){select('node',n.id);el.focus({preventScroll:true});}
      else if(event.target.closest('button'))return;
      event.preventDefault();
      drag={pointer:event.pointerId,clientX:event.clientX,clientY:event.clientY,before:snapshot(),id:n?.id,startX:n?.x??board.view.x,startY:n?.y??board.view.y,moved:false};
      stage.setPointerCapture(event.pointerId);stage.classList.add('dragging');
    }
    function pointerMove(event) {
      if(!drag||drag.pointer!==event.pointerId)return;
      const dx=event.clientX-drag.clientX,dy=event.clientY-drag.clientY;
      if(!drag.moved&&Math.hypot(dx,dy)<3)return;drag.moved=true;
      if(drag.id)M.move(board,drag.id,drag.startX+dx/board.view.k,drag.startY+dy/board.view.k);
      else{board.view.x=drag.startX+dx;board.view.y=drag.startY+dy;}
      paint();
    }
    function finishPointer(event,cancel=false) {
      if(!drag||(event&&event.pointerId!==undefined&&event.pointerId!==drag.pointer))return;
      const ended=drag;drag=null;stage.classList.remove('dragging');
      if(stage.hasPointerCapture(ended.pointer))stage.releasePointerCapture(ended.pointer);
      if(cancel){board=ended.before;paint();publish();hint('拖动已取消，可以继续调整。');}
      else if(ended.moved){if(ended.id)commit(ended.before,'move');else publish();ignoreClick=true;setTimeout(()=>{ignoreClick=false;},0);}
    }
    function onKey(event) {
      if(event.target.matches('input,textarea,select'))return;
      if(event.key==='Escape'){finishPointer(null,true);cancelLink();return;}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo(event.shiftKey);return;}
      const el=event.target.closest('[data-node]');
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) {
        event.preventDefault();const step=event.shiftKey?40:10,[dx,dy]={ArrowUp:[0,-step],ArrowDown:[0,step],ArrowLeft:[-step,0],ArrowRight:[step,0]}[event.key];
        if(el){if(selected?.type!=='node'||selected.id!==el.dataset.node)select('node',el.dataset.node);nudge(dx,dy);}else if(event.target===stage){board.view.x+=dx*3;board.view.y+=dy*3;transform();publish();}
      } else if(event.target.closest('[data-edge]')&&['Enter',' '].includes(event.key)) {event.preventDefault();select('edge',event.target.closest('[data-edge]').dataset.edge);}
      else if(event.target===stage&&['+','=','-','0'].includes(event.key)){event.preventDefault();if(event.key==='0')fit();else zoom(event.key==='-'?1/1.2:1.2);}
    }
    function onFocus(event) {
      if(event.target.dataset.edit){editing=snapshot();return;}
      const el=event.target.closest('[data-node]');if(!el)return;
      if(focusByPointer)return;
      const n=node(el.dataset.node),v=board.view;if(!v)return;
      const left=n.x*v.k+v.x,top=n.y*v.k+v.y,right=left+n.width*v.k,bottom=top+n.height*v.k;
      if(left<12||right>stage.clientWidth-12||top<12||bottom>stage.clientHeight-12) {
        v.x=stage.clientWidth/2-(n.x+n.width/2)*v.k;v.y=stage.clientHeight/2-(n.y+n.height/2)*v.k;transform();publish();
      }
    }
    function onInput(event) {
      const key=event.target.dataset.edit;if(!key)return;
      if(!editing)editing=snapshot();
      const n=selectedNode(),e=selectedEdge();
      if(n&&['title','note','locator','useType'].includes(key)) {
        if(key==='useType'){if(!Object.hasOwn(M.literatureUses,event.target.value))return;n.useType=event.target.value;n.role=M.literatureUses[n.useType];}else n[key]=event.target.value.slice(0,key==='title'?40:key==='locator'?500:1000);
        const el=layer.querySelector(`[data-node="${n.id}"]`);
        if(key==='title'){el.querySelector('.graph-node-title').textContent=n.title||'未命名想法';el.setAttribute('aria-label',(n.title||'未命名想法')+'，可拖动，方向键微调');inspector.querySelector('.graph-selected-title strong').textContent=n.title||'未命名想法';}
        if(n.kind==='literature'){el.querySelector('.graph-node-role').textContent=n.role;el.querySelector('.graph-node-note').textContent=literatureLine(n);}else el.querySelector('.graph-node-note').textContent=evidenceText('node',n.id)||(n.note?'有思考笔记':'拖动调整');
      } else if(e&&key==='label') {e.label=event.target.value.slice(0,60);e.kind='manual';delete e.usageLink;renderScene();}
      if(selected&&options.getReview){const status=inspector.querySelector('.graph-evidence strong');if(status)status.textContent=evidenceText(selected.type,selected.id);}
      publish();
    }
    function onChange(event) {
      if(event.target.id==='graph-edge-picker'){if(event.target.value)select('edge',event.target.value);return;}
      if(!event.target.dataset.edit)return;
      const n=selectedNode();if(event.target.dataset.edit==='title'&&['idea','literature'].includes(n?.kind)&&!n.title.trim()){n.title='未命名想法';event.target.value=n.title;renderScene();}
      if(editing)commit(editing,'edit-note');editing=null;
    }
    function onWheel(event){if(event.ctrlKey){event.preventDefault();zoom(event.deltaY>0?1/1.12:1.12);}}
    const cancel=()=>finishPointer(null,true),lost=e=>finishPointer(e,true);
    root.addEventListener('click',onClick);root.addEventListener('keydown',onKey);root.addEventListener('focusin',onFocus);root.addEventListener('input',onInput);root.addEventListener('change',onChange);
    stage.addEventListener('pointerdown',pointerDown);stage.addEventListener('pointermove',pointerMove);stage.addEventListener('pointerup',finishPointer);stage.addEventListener('pointercancel',lost);stage.addEventListener('lostpointercapture',lost);stage.addEventListener('wheel',onWheel,{passive:false});window.addEventListener('blur',cancel);
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!board.customLayout&&((w<520)!==(board.layout==='vertical'))){M.arrange(board,w<520);board.view=null;}
    if(!board.view)defaultView();
    else if(Math.abs((board.view.w||w)-w)>w*.35)board.view=fittedView(w,h);
    else{board.view.x+=(w-board.view.w)/2;board.view.y+=(h-board.view.h)/2;board.view.w=w;board.view.h=h;}
    renderScene();renderInspector();historyButtons();publish();
    let resize;
    if(typeof window.ResizeObserver==='function') {
      resize=new window.ResizeObserver(()=>{const width=stage.clientWidth,height=stage.clientHeight;if(!width||!height)return;if(width!==board.view.w||height!==board.view.h){if(!board.customLayout){M.arrange(board,width<520);defaultView();renderScene();}else fit();}});resize.observe(stage);
    }
    const cleanup=()=>{cancel();if(editing){const n=selectedNode();if(['idea','literature'].includes(n?.kind)&&!n.title.trim())n.title='未命名想法';commit(editing,'edit-note');editing=null;}resize?.disconnect();root.removeEventListener('click',onClick);root.removeEventListener('keydown',onKey);root.removeEventListener('focusin',onFocus);root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);stage.removeEventListener('pointerdown',pointerDown);stage.removeEventListener('pointermove',pointerMove);stage.removeEventListener('pointerup',finishPointer);stage.removeEventListener('pointercancel',lost);stage.removeEventListener('lostpointercapture',lost);stage.removeEventListener('wheel',onWheel);window.removeEventListener('blur',cancel);};
    cleanup.selectNode=id=>{if(node(id))select('node',id);};
    cleanup.focusNode=id=>{const n=node(id);if(!n)return;select('node',id);const k=Math.max(.8,board.view.k);board.view={x:stage.clientWidth/2-(n.x+n.width/2)*k,y:stage.clientHeight/2-(n.y+n.height/2)*k,k,w:stage.clientWidth,h:stage.clientHeight};transform();publish();layer.querySelector(`[data-node="${id}"]`)?.focus({preventScroll:true});};
    return cleanup;
  }
  window.AtlasGraphEditor={mount};
})();
