(() => {
  'use strict';
  const M=window.AtlasResearchModel,G=window.AtlasGraphModel;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(label,action,extra='',kind='outline')=>`<button type="button" class="btn ${kind}" data-r-action="${action}" ${extra}>${label}</button>`;
  const reading={metadata:'仅题录',abstract:'公开摘要',fulltext:'相关全文'};
  function mount(root,initial,board,ctx,options) {
    let session=initial,tab=['plan','hypotheses','validation'].includes(options.tab)?'plan':['canvas','framework','discussion'].includes(options.tab)?'canvas':'evidence',results=session.searchResults||[],searching=false,error='',notice='',expandedPaper='',showAll=false,metricId='',importOpen=false,discussionOpen=false,controller=null,destroyed=false,cleanupCanvas=null,focusIdeaId='';
    let editingLiteratureId=board.nodes.some(n=>n.id===session.canvasEditing&&n.kind==='literature')?session.canvasEditing:'',libraryError='',restoringSelection=false,selectionKey='',libraryViewKey='';
    const available=()=>M.canvasPapers(session,board);
    const canvasHistory={past:[],future:[]},importDraft={},pinnedIds=new Set(session.chosenSourceIds||[]);
    const $=s=>root.querySelector(s),chosen=()=>M.chosenSources(session);
    const stages=[['evidence','选文献'],['canvas','优化框架'],['plan','深化研究']];
    const canOpen=id=>stages.some(s=>s[0]===id);
    if(!canOpen(tab)||!stages.some(s=>s[0]===tab))tab='evidence';
    if(tab==='plan')M.startPlan(session,board);
    function persist(){options.onSave(session,tab);}
    function unmountCanvas(){const cleanup=cleanupCanvas;cleanupCanvas=null;cleanup?.();}
    function publishBoard(next,action=''){
      if(M.semantic(board)!==M.semantic(next))session.frameReadyForReview=false;
      board=next;const saved=options.onBoard(board,action);const preview=$('#discussion-context');if(preview)preview.value=M.context(session,board,ctx);persist();return saved;
    }
    function go(id,focus=true){
      if(id==='discussion'){id='canvas';discussionOpen=true;}if(id==='framework')id='canvas';
      if(id==='hypotheses'||id==='validation')id='plan';
      if(!canOpen(id))id='evidence';
      if(id==='plan'){unmountCanvas();const result=M.startPlan(session,board);if(result.changed)notice='已带入最新框架，方案文字已保留，可继续调整。';}
      tab=id;render(focus);
    }
    function download(text,name){const u=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}
    function paperPool(){
      const all=new Map();for(const p of [...session.sources,...results]){const key=p.doi||p.id;if(!all.has(key))all.set(key,p);}
      const ranked=M.rank([...all.values()],session.lastSearch?.query||session.query,session.searchSort);
      return session.searchSort==='relevance'?ranked.sort((a,b)=>Number(pinnedIds.has(b.id))-Number(pinnedIds.has(a.id))):ranked;
    }
    function publication(p){
      const volume=p.volume?`${p.volume}${p.issue?'('+p.issue+')':''}`:'';
      return `<cite>${esc(p.journal||'期刊信息未提供')}</cite><span>${esc(p.year||'发表年份未提供')}</span>${volume?`<span>${esc(volume)}${p.pages?': '+esc(p.pages):''}</span>`:p.pages?`<span>pp. ${esc(p.pages)}</span>`:''}${p.articleNumber?`<span>Article ${esc(p.articleNumber)}</span>`:''}`;
    }
    function impact(p){
      const m=p.metric;
      if(!m)return '<span class="paper-impact pending">影响因子 IF：待核实</span>';
      const year=m.year?`${m.year}${m.checked?'':'，待核对'}`:'指标年份待核实';
      return `<span class="paper-impact ${m.checked?'':'pending'}">影响因子 IF <b>${String(m.value)}</b><span>（${esc(year)}）</span><a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.journal)}影响因子来源${m.source?'：'+esc(m.source):''}" ${m.checkedAt?`title="核查日期：${esc(m.checkedAt)}"`:''}>${esc(m.source||'指标来源')}</a></span>`;
    }
    function bibliography(p){
      return `${p.name&&p.name!==p.title?`<p class="paper-summary">中文概述：${esc(p.name)}</p>`:''}<p class="paper-authors">${esc(p.authors||'作者信息未提供')}</p><p class="paper-publication">${publication(p)}</p><div class="paper-reference-links"><div class="paper-metrics">${impact(p)}${p.citations!==null?`<span class="paper-citations">Crossref引用 ${p.citations}</span>`:''}</div>${p.doi?`<a class="paper-doi" href="https://doi.org/${esc(encodeURI(p.doi))}" target="_blank" rel="noopener noreferrer">DOI: ${esc(p.doi)}</a>`:p.url?`<a class="paper-doi" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">原始来源（未提供DOI）</a>`:'<span class="paper-doi">DOI未提供</span>'}</div>`;
    }
    function paperDetails(p){
      return `<div class="paper-detail"><p>${esc(p.finding||p.abstract?.slice(0,1600)||'索引未提供摘要，请打开原始来源阅读。')}</p>${p.implication?`<p><strong>阅读启发</strong> ${esc(p.implication)}</p>`:''}<p class="detail-boundary">${esc(p.limit||'索引题录与摘要线索，尚未核对方法、结果和适用范围。')}</p>${p.url?`<a class="source-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">打开原始来源</a>`:''}<details class="paper-metadata" ${metricId===p.id?'open':''}><summary>题录来源与核对记录</summary><p>${p.origin==='crossref'?'题录来源：Crossref':p.origin==='curated'?'题录来源：出版社与Crossref核对':'题录来源：手动录入'}${p.fetchedAt?' · 检索时间：'+esc(p.fetchedAt.slice(0,10)):''} · 整理范围：${reading[p.reading]}</p>${p.location?`<p>回查位置：${esc(p.location)}</p>`:''}${p.cannot?`<p>使用边界：${esc(p.cannot)}</p>`:''}${p.metric?.checkedAt?`<p>期刊指标核查日期：${esc(p.metric.checkedAt)}${p.metric.year?'':'；来源页未标明指标年份，不参与IF排序'}。</p>`:''}${p.citations!==null?`<p>Crossref收录引用数：${p.citations}（${esc(p.fetchedAt?.slice(0,10)||'检索时')}）</p>`:''}${session.sources.some(s=>s.id===p.id)?btn('记录期刊指标','metric',`data-value="${p.id}"`,'quiet'):''}${metricId===p.id?metricForm(p):''}</details></div>`;
    }
    function paperRow(p){
      const selected=session.chosenSourceIds.includes(p.id);
      return `<article class="paper-choice ${selected?'selected':''}"><div class="paper-record"><label class="paper-pick"><input type="checkbox" data-paper-id="${p.id}" aria-labelledby="paper-title-${p.id}" ${selected?'checked':''}><strong id="paper-title-${p.id}">${esc(p.title)}</strong></label><div class="paper-bibliography">${bibliography(p)}</div></div>${btn(expandedPaper===p.id?'收起':'阅读','paper-details',`data-value="${p.id}" aria-expanded="${expandedPaper===p.id}" aria-label="阅读文献：${esc(p.title)}"`,'quiet')}${expandedPaper===p.id?paperDetails(p):''}</article>`;
    }
    function metricForm(p){return `<form data-r-form="metric" data-id="${p.id}" class="metric-form"><p>记录已核对的期刊指标；它不决定论断支持度。</p><div class="research-form-grid"><label>IF<input name="value" type="number" min="0" max="1000" step="0.001" required value="${p.metric?.value??''}"></label><label>指标年份<input name="year" pattern="20[0-9]{2}" required value="${esc(p.metric?.year||'')}"></label><label class="wide">来源链接<input name="url" type="url" required value="${esc(p.metric?.url||'')}"></label></div><label class="research-check"><input name="checked" type="checkbox" ${p.metric?.checked?'checked':''}>已核对年份与来源</label><button class="btn outline" type="submit">保存指标</button></form>`;}
    function importForm(){return `<form data-r-form="import" class="paper-import"><div class="research-form-grid">${[['title','原文题名',2000],['doi','DOI',300],['url','原始来源链接',1000],['journal','期刊',300],['year','年份',4],['authors','作者',4000]].map(([id,label,max])=>`<label ${id==='title'?'class="wide"':''}>${label}<input name="${id}" maxlength="${max}" ${id==='title'?'required':''} ${id==='url'?'type="url"':''} value="${esc(importDraft[id]||'')}"></label>`).join('')}<label class="wide">阅读笔记<textarea name="abstract" maxlength="4000">${esc(importDraft.abstract||'')}</textarea></label></div><button class="btn outline" type="submit">加入备选文献</button></form>`;}
    function evidence(){
      const papers=paperPool(),visible=showAll?papers:papers.slice(0,3);
      return `<section class="paper-step"><header class="research-stage-heading"><h2 id="research-stage-title" tabindex="-1">选择参考文献</h2></header><form id="literature-search-form" data-r-form="search" class="simple-search" aria-busy="${searching}"><label>检索文献<input id="literature-query" name="query" maxlength="600" required value="${esc(session.query)}" placeholder="输入研究对象、变量或方法"></label><button class="btn outline" type="submit" ${searching?'disabled':''}>${searching?'搜索中…':'搜索'}</button></form>${error?`<p class="research-error" role="alert">${esc(error)}</p>`:''}<div class="paper-list-heading"><span>备选文献</span>${results.length?`<label class="sort-label"><span class="sr-only">文献排序</span><select id="literature-sort" aria-label="文献排序">${[['relevance','相关性'],['year','较新研究'],['citations','引用较多'],['if','已核对IF']].map(([v,l])=>`<option value="${v}" ${session.searchSort===v?'selected':''}>${l}</option>`).join('')}</select></label>`:''}</div><div id="paper-results" class="paper-choices">${visible.map(paperRow).join('')||'<p class="research-empty">还没有文献。搜索关键词，或在下方手动加入已有论文。</p>'}</div>${papers.length>3?btn(showAll?'收起列表':`查看更多（共${papers.length}篇）`,'show-papers','','quiet'):''}<details class="research-secondary" ${importOpen?'open':''}><summary>其他检索与录入方式</summary><label>起始年份<input id="literature-year" form="literature-search-form" name="year" maxlength="4" pattern="20[0-9]{2}" value="${esc(session.searchYear)}" placeholder="不限"></label><p class="research-help">当前检索来自Crossref；词项匹配、引用与IF仅供筛选参考。</p><div class="external-search"><a href="https://search.crossref.org/?q=${encodeURIComponent(session.query)}" target="_blank" rel="noopener noreferrer">Crossref</a><a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(session.query)}" target="_blank" rel="noopener noreferrer">PubMed</a><a href="https://scholar.google.com/scholar?q=${encodeURIComponent(session.query)}" target="_blank" rel="noopener noreferrer">Google Scholar</a></div>${btn(importOpen?'收起录入':'手动加入文献','toggle-import','','quiet')}${importOpen?importForm():''}</details><div class="research-nextbar"><span role="status" id="paper-selection-count">${chosen().length?`已选 ${chosen().length} 篇`:'也可以先改框架，稍后补文献'}</span>${btn('下一步：优化框架','finish-selection','id="research-next"','primary')}</div></section>`;
    }
    function discussion(){
      const urls={chatgpt:'https://chatgpt.com/',deepseek:'https://chat.deepseek.com/',claude:'https://claude.ai/'};
      return `<details class="model-helper" ${discussionOpen?'open':''}><summary>和模型讨论</summary><p class="research-help">复制当前问题、框架、文献用途与方案，到常用的模型平台继续讨论。</p><div class="research-form-grid"><label>讨论平台<select id="discussion-platform">${[['general','通用上下文'],['chatgpt','ChatGPT'],['deepseek','DeepSeek'],['claude','Claude']].map(([v,l])=>`<option value="${v}" ${session.platform===v?'selected':''}>${l}</option>`).join('')}</select></label><label>这次想追问什么？<input id="discussion-question" maxlength="2000" value="${esc(session.question)}" placeholder="例如：哪些关系还缺证据？"></label></div><div class="inline-actions">${btn('复制讨论上下文','copy-context')}${urls[session.platform]?`<a class="source-link" href="${urls[session.platform]}" target="_blank" rel="noopener noreferrer">打开所选平台</a>`:''}</div><details class="research-secondary"><summary>查看或下载上下文</summary><textarea id="discussion-context" readonly aria-label="讨论上下文">${esc(M.context(session,board,ctx))}</textarea>${btn('下载上下文','export-context','','quiet')}</details><label>把有用的讨论记下来<textarea id="discussion-return" maxlength="4000" placeholder="记录想纳入框架的修改与理由。">${esc(session.discussion)}</textarea></label><div class="idea-return-row"><label>新想法名称<input id="discussion-idea-title" maxlength="40" value="${esc(session.discussionTitle)}"></label>${btn('加入画布','add-discussion')}</div></details>`;
    }
    function currentPaper(){const n=board.nodes.find(n=>n.id===editingLiteratureId&&n.kind==='literature'),papers=available();return papers.find(p=>p.id===(n?.sourceId||session.canvasSource))||papers[0];}
    function draftKey(){return editingLiteratureId||currentPaper()?.id||'';}
    function currentDraft(){const p=currentPaper();return p?M.literatureDraft(session,board,p,editingLiteratureId):null;}
    function rememberUse(el){
      const field={'paper-use-type':'useType','paper-use-note':'note','paper-use-target':'targetId','paper-use-locator':'locator','paper-use-title':'title'}[el.id],p=currentPaper();if(!field||!p)return false;
      const d=currentDraft();d[field]=el.value;session.libraryDrafts[draftKey()]=M.useDraft(d);persist();return true;
    }
    function renderLibrary(){
      const panel=$('#canvas-library');if(!panel)return;
      const key=draftKey(),keep=key===libraryViewKey,prior=panel.querySelector?.('.canvas-library-content'),top=keep?(prior?.scrollTop||0):0;
      const paperOpen=keep&&panel.querySelector?.('.canvas-paper-preview')?.open,extraOpen=keep&&panel.querySelector?.('.paper-use-extra')?.open;
      panel.innerHTML=library();libraryViewKey=key;
      const paper=panel.querySelector?.('.canvas-paper-preview'),extra=panel.querySelector?.('.paper-use-extra'),next=panel.querySelector?.('.canvas-library-content');
      if(paper)paper.open=!!paperOpen;if(extra)extra.open=!!extraOpen;if(next)next.scrollTop=top;
    }
    function library(){
      const papers=available(),p=currentPaper(),n=board.nodes.find(n=>n.id===editingLiteratureId&&n.kind==='literature');
      if(!p)return `<div class="canvas-library-heading"><h3>文献备选池</h3></div><p class="research-help">可以先整理自己的想法，也可以选些文献，再注明想借鉴的内容。</p>${btn('选择参考文献','tab','data-value="evidence"')}`;
      session.canvasSource=p.id;const d=currentDraft(),shortAuthors=p.authors.split(',')[0]+(p.authors.split(',').length>1?', et al.':'');
      return `<div class="canvas-library-content" role="region" aria-label="文献内容与用途" tabindex="0"><div class="canvas-library-heading"><h3>${n?'编辑文献卡片':'文献备选池'}</h3>${btn(n?'新增用途':'管理文献',n?'new-paper-use':'tab',n?'':'data-value="evidence"','quiet')}</div>${papers.length>1&&!n?`<label class="canvas-source-picker">选择文献<select id="paper-use-source" aria-label="选择备选文献">${papers.map(p=>`<option value="${p.id}" ${p.id===session.canvasSource?'selected':''}>${esc((p.year||'')+' '+p.title)}</option>`).join('')}</select></label>`:''}<details class="canvas-paper-preview"><summary><span><strong>[${esc(p.id)}] ${esc(p.title)}</strong><small>${esc(shortAuthors||'作者未提供')} · ${esc(p.year||'年份待核实')}<br>${esc(p.journal||'期刊未提供')}</small></span></summary><div class="canvas-paper-reading"><p class="canvas-reading-scope">整理范围：${reading[p.reading]}</p><p>${esc(p.finding||p.abstract||'题录未提供摘要，请打开原文阅读。')}</p>${p.limit?`<p class="detail-boundary">${esc(p.limit)}</p>`:''}${bibliography(p)}${p.url?`<a class="source-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">打开原文</a>`:''}</div></details><div class="canvas-paper-metric">${impact(p)}</div><div class="paper-use-editor"><label>文献用途<select id="paper-use-type">${Object.entries(M.paperUses).map(([id,label])=>`<option value="${id}" ${d.useType===id?'selected':''}>${label}</option>`).join('')}</select></label><label>${d.useType==='reference'?'备注（可稍后补充）':'借鉴说明'}<textarea id="paper-use-note" maxlength="1000" placeholder="${d.useType==='method'?'记录想借鉴的方法，以及准备怎样用于自己的研究':d.useType==='innovation'?'记录想借鉴的切入点，以及与你的问题有什么不同':d.useType==='review'?'记录综述梳理出的概念、分类或研究线索':d.useType==='finding'?'记录准备参考的发现，以及它的场景和局限':'可先放进画布，之后再补用途与说明'}" ${libraryError?'aria-describedby="paper-use-error"':''}>${esc(d.note)}</textarea></label><label>连接到哪个节点？<select id="paper-use-target"><option value="">暂不连线，先独立放置</option>${board.nodes.filter(x=>x.id!==n?.id).map(x=>`<option value="${x.id}" ${d.targetId===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label><details class="paper-use-extra"><summary>卡片名称与原文位置${d.locator||d.title?'<span class="details-filled">已填写</span>':''}</summary><label>卡片名称<input id="paper-use-title" maxlength="40" value="${esc(d.title)}" placeholder="可选，默认使用作者与年份"></label><label>原文位置<input id="paper-use-locator" maxlength="500" value="${esc(d.locator)}" placeholder="例如：Methods / 第6页"></label></details>${libraryError?`<p class="research-error" id="paper-use-error" role="alert">${esc(libraryError)}</p>`:''}</div></div><div class="paper-use-actions">${btn(n?'保存卡片修改':'放入思路画布','apply-paper-use')}</div>`;
    }
    function selectedInCanvas(selected,current){
      if(restoringSelection)return;const key=selected?selected.type+':'+selected.id:'';if(key===selectionKey)return;selectionKey=key;
      const n=selected?.type==='node'?current.nodes.find(n=>n.id===selected.id):null;
      editingLiteratureId=n?.kind==='literature'?n.id:'';session.canvasEditing=editingLiteratureId;libraryError='';
      if(editingLiteratureId)session.canvasSource=n.sourceId;
      else if(n&&currentPaper()){const d=currentDraft();if(!d.targetId){d.targetId=n.id;session.libraryDrafts[draftKey()]=d;}}
      renderLibrary();persist();
    }
    function referenceDetails(type,id,current){
      if(type==='node'&&current.nodes.find(n=>n.id===id)?.kind==='literature')return '';
      const linked=type==='node'?current.edges.filter(e=>e.to===id).map(e=>current.nodes.find(n=>n.id===e.from&&n.kind==='literature')).filter(Boolean):[];
      const t=M.targets(current).find(t=>t.key===type+':'+id),old=t?M.review(session,t).bindings:[];
      if(!linked.length&&!old.length)return '';
      return `<details class="canvas-origin-records"><summary>相关文献与记录（${linked.length+old.length}）</summary>${linked.map(n=>`<div><strong>${esc(M.paperUses[n.useType])}</strong><p>${esc(n.note||'先作为备选')}</p><button type="button" class="graph-text-button" data-graph-action="open-literature" data-value="${n.id}">查看这张文献卡片</button></div>`).join('')}${old.map(b=>{const p=session.sources.find(p=>p.id===b.sourceId);return `<div><span>此前保存的参考记录</span><p>${p?.url?`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>`:esc(b.sourceId)}</p><p>${esc(b.note)}</p><small>${esc(b.locator)} · ${reading[b.reading]}</small></div>`;}).join('')}</details>`;
    }
    function canvas(){
      return `<section class="canvas-step"><header class="research-stage-heading"><h2 id="research-stage-title" tabindex="-1">把文献用进研究框架</h2></header><div class="literature-canvas-workspace"><div class="canvas-main"><div class="workbench research-graph-shell"><div class="idea-graph" id="research-idea-graph"></div></div><details class="canvas-reflection"><summary>记录一个新想法</summary><label>准备怎样调整？<textarea id="canvas-insight-note" maxlength="2000" placeholder="补充解释，或记录准备修改的关系。">${esc(session.canvasNote)}</textarea></label><div class="idea-return-row"><label>想法名称<input id="canvas-insight-title" maxlength="40" value="${esc(session.canvasTitle||'待验证的新想法')}"></label>${btn('加入画布','add-reflection')}</div></details></div><aside class="canvas-library" id="canvas-library" aria-label="文献用途面板">${library()}</aside></div>${discussion()}<details class="research-secondary"><summary>导出与草稿版本</summary>${btn('导出框架与文献','export-working','','quiet')}${Object.keys(session.reviews).length?btn('导出原有依据记录','export-review','','quiet'):''}${session.draftVersions.map(v=>`<p class="research-help">草稿 V${v.number} · ${esc(v.time)}</p>`).join('')}</details><div class="research-nextbar research-nextbar-secondary"><button type="button" class="text-button" data-r-action="tab" data-value="evidence">返回选文献</button>${btn('保存框架草稿','save-working','','quiet')}${btn('下一步：深化研究','continue-plan','id="research-next"','primary')}</div></section>`;
    }
    function researchPlan(){
      const p=session.plan,papers=available(),ideas=board.nodes.filter(n=>n.kind==='idea');
      return `<section class="plan-step"><header class="research-stage-heading"><h2 id="research-stage-title" tabindex="-1">把框架深化为研究方案</h2><p class="stage-hint">写清准备检验的解释、需要的数据，以及接下来要做的事。</p></header><div class="research-plan-layout"><div class="research-plan-editor"><label>研究假设或核心观点<span class="plan-field-hint">以画布里的想法为线索，改写成具体、可检验的陈述。</span><textarea id="plan-hypotheses" maxlength="8000" placeholder="你准备检验什么关系？还有哪些可能的解释？">${esc(p.hypotheses)}</textarea></label><label>研究方法与数据<span class="plan-field-hint">把方法备注补充为研究对象、数据来源和实施步骤。</span><textarea id="plan-methods" maxlength="8000" placeholder="准备研究谁、采集什么数据、怎样分析？引用方法时可标注文献编号。">${esc(p.methods)}</textarea></label><label>下一步行动<textarea id="plan-nextSteps" maxlength="4000" placeholder="例如：补读哪篇文献、确认哪些数据、先开展什么试测。">${esc(p.nextSteps)}</textarea></label></div><aside class="research-plan-context" aria-label="带入的研究材料"><h3>带入的研究材料</h3><p>框架草稿 V${p.frameVersion}</p><details class="plan-board-context"><summary>查看画布想法与关系</summary>${ideas.length?ideas.map(n=>`<div class="plan-context-row"><strong>${esc(n.title)}</strong>${n.note?`<p>${esc(n.note)}</p>`:''}</div>`).join(''):'<p class="research-help">画布还没有独立想法，可以先补写研究想法。</p>'}${board.edges.length?`<div class="plan-context-row"><strong>当前连线</strong>${board.edges.map(e=>`<p>${esc(board.nodes.find(n=>n.id===e.from)?.title||e.from)} → ${esc(board.nodes.find(n=>n.id===e.to)?.title||e.to)}${e.label?'：'+esc(e.label):''}</p>`).join('')}</div>`:''}</details><details class="plan-reference-context"><summary>查看参考文献与用途（${papers.length}）</summary>${papers.map(paper=>`<div class="plan-context-row"><h4>[${esc(paper.id)}] ${esc(paper.title)}</h4>${bibliography(paper)}${board.nodes.filter(n=>n.kind==='literature'&&n.sourceId===paper.id).map(n=>`<p><strong>${esc(M.paperUses[n.useType])}</strong><br>${esc(n.note||'先作为备选')}${n.locator?`<br><small>原文位置：${esc(n.locator)}</small>`:''}</p>`).join('')||'<p>已选参考文献，暂未指定画布用途。</p>'}</div>`).join('')||'<p class="research-help">暂未选择文献，之后可返回补充。</p>'}</details><p class="research-help">返回画布修改后，已写的方案文字会保留。</p></aside></div>${discussion()}${session.planVersions.length?`<details class="research-secondary"><summary>方案草稿版本</summary>${session.planVersions.map(v=>`<p class="research-help">方案 P${v.number} · ${esc(v.time)} · 框架 V${v.plan.frameVersion}</p>`).join('')}</details>`:''}<div class="research-nextbar research-nextbar-secondary">${btn('返回优化框架','return-graph','','text-button')}${btn('保存方案草稿','save-plan','','quiet')}${btn('导出研究方案','export-plan','id="research-next"','primary')}</div></section>`;
    }
    function mountCanvas(){
      const graphRoot=$('#research-idea-graph');if(tab!=='canvas'||!graphRoot?.querySelectorAll)return;
      restoringSelection=true;
      cleanupCanvas=window.AtlasGraphEditor.mount(graphRoot,board,publishBoard,{compact:true,history:canvasHistory,getAnnotation:(type,id,current)=>M.annotation(session,current,type,id),renderSupplement:referenceDetails,onSelection:selectedInCanvas,onLiterature:()=>{$('#paper-use-note')?.focus({preventScroll:false});},onOpenLiterature:id=>{if(cleanupCanvas?.focusNode)cleanupCanvas.focusNode(id);else{focusIdeaId=id;render();}}});
      restoringSelection=false;
      const focus=focusIdeaId;focusIdeaId='';
      if(focus){if(cleanupCanvas.focusNode)cleanupCanvas.focusNode(focus);else graphRoot.querySelector?.(`[data-node="${focus}"]`)?.click();if(window.matchMedia?.('(max-width:900px)').matches)graphRoot.scrollIntoView?.({block:'start',behavior:'instant'});}
      else if(editingLiteratureId&&cleanupCanvas.selectNode)cleanupCanvas.selectNode(editingLiteratureId);
    }
    function render(focus=false){
      unmountCanvas();if(!canOpen(tab))tab='evidence';if(editingLiteratureId&&!board.nodes.some(n=>n.id===editingLiteratureId&&n.kind==='literature')){editingLiteratureId='';session.canvasEditing='';}selectionKey='';
      root.innerHTML=`<details class="research-question-summary" id="research-context-anchor"><summary><span>研究问题</span><strong>${esc(session.topic)}</strong><span class="question-edit">编辑</span></summary><p>${esc(ctx.directionName||ctx.combination)} · ${esc(ctx.scopeName||'待限定切口')}</p><label>修改研究问题<input id="research-topic" maxlength="600" value="${esc(session.topic)}"></label></details>${notice?`<p class="research-notice" role="status">${esc(notice)}</p>`:''}<section id="research-work-panel" role="region" aria-labelledby="research-stage-title" tabindex="-1">${tab==='evidence'?evidence():tab==='plan'?researchPlan():canvas()}</section>`;
      if(tab==='canvas')libraryViewKey=draftKey();mountCanvas();if(focus){$('#research-context-anchor')?.scrollIntoView({block:'start',behavior:'instant'});$('#research-stage-title')?.focus({preventScroll:true});}persist();
    }
    function addIdea(title,note,sourceId='',origin='reflection'){
      unmountCanvas();const before=M.clone(board),idea=M.addInsight(session,board,{title,note,sourceId,origin});
      if(!idea){notice='最多添加20个想法，请先整理画布。';render();return;}
      canvasHistory.past.push(before);if(canvasHistory.past.length>40)canvasHistory.past.shift();canvasHistory.future.length=0;session.frameReadyForReview=false;publishBoard(board,'add-insight');tab='canvas';focusIdeaId=idea.id;notice='想法已加入画布。';render();
    }
    async function search(form){
      const query=form.elements.namedItem('query').value.trim(),year=form.elements.namedItem('year')?.value||'';
      session.query=query;session.searchYear=year;persist();error='';notice='';
      if(location.protocol==='file:'){error='实时检索需先双击“启动文献检索演示.cmd”。';render();return;}
      searching=true;render();controller=new AbortController();
      try{const endpoint = new URL('https://api.crossref.org/works');
        endpoint.searchParams.set('query', query);
        endpoint.searchParams.set('rows', '12');
        endpoint.searchParams.set('filter', 'type:journal-article' + (year ? ',from-pub-date:' + year + '-01-01' : ''));
        const response = await fetch(endpoint, {signal: controller.signal});
        if (!response.ok) throw new Error('检索暂时不可用，请稍后重试。');
        const {message} = await response.json();
        if (!Array.isArray(message?.items)) throw new Error('题录返回格式异常，请稍后重试。');
        const data = {query, fetchedAt: new Date().toISOString(), url: endpoint.href, items: message.items};
        if(destroyed)return;results=data.items.map(p=>M.fromCrossref(p,data.query,data.fetchedAt));for(const fresh of results){const saved=session.sources.find(p=>p.doi&&p.doi===fresh.doi);if(saved){for(const key of ['title','authors','authorCount','journal','year','volume','issue','pages','articleNumber','issn','citations','fetchedAt'])if(fresh[key]!==''&&fresh[key]!==null)saved[key]=fresh[key];if(!saved.metric)saved.metric=fresh.metric;}}session.searchResults=results;session.lastSearch={query:data.query,fetchedAt:data.fetchedAt,url:data.url,dois:results.map(p=>p.doi)};showAll=false;if(!results.length)notice='没有匹配结果，试试减少限定词。';}catch(e){if(!destroyed&&e.name!=='AbortError')error=e.message;}finally{if(!destroyed){searching=false;if(tab==='evidence')render();else persist();}}
    }
    async function click(event){
      const el=event.target.closest('[data-r-action]');if(!el||el.disabled)return;event.preventDefault();const action=el.dataset.rAction,value=el.dataset.value;
      if(action==='apply-paper-use'){
        const d=currentDraft();if(!d)return;
        if(d.useType!=='reference'&&!d.note.trim()){libraryError='写一句具体想借鉴的内容；也可以先选“备选文献”。';renderLibrary();$('#paper-use-note')?.focus();return;}
        unmountCanvas();const before=M.clone(board),result=M.applyLiterature(session,board,{...d,nodeId:editingLiteratureId});
        if(result.error){libraryError=result.error;render();return;}
        if(M.semantic(before)!==M.semantic(board)){canvasHistory.past.push(before);if(canvasHistory.past.length>40)canvasHistory.past.shift();canvasHistory.future.length=0;}
        editingLiteratureId=result.node.id;libraryError='';focusIdeaId=result.node.id;const target=board.nodes.find(n=>n.id===d.targetId);
        notice=result.created?`已将文献作为“${M.paperUses[d.useType]}”加入画布${target?'，连接到“'+target.title+'”':''}。`:'文献卡片的用途与说明已保存。';publishBoard(board,result.created?'add-literature':'edit-literature');render();
      }
      else if(action==='new-paper-use'){editingLiteratureId='';session.canvasEditing='';notice='';render();$('#paper-use-type')?.focus();}
      else if(action==='save-working'){unmountCanvas();const v=M.saveWorkingDraft(session,board);notice=`已保存框架草稿 V${v.number}。点击“下一步：深化研究”，继续整理研究方案。`;render();}
      else if(action==='continue-plan'){notice='';go('plan');}
      else if(action==='save-plan'||action==='export-plan'){const v=M.savePlan(session,board);notice=action==='export-plan'?`方案 P${v.number} 已保存，研究方案文件已开始下载。`:`已保存方案草稿 P${v.number}，可继续修改或导出研究方案。`;if(action==='export-plan')download(M.planReport(session,board,ctx),'交点_研究方案草稿.txt');render();}
      else if(action==='export-working')download(M.workingReport(session,board,ctx),'交点_研究框架草稿.txt');
      else if(action==='tab'){notice='';go(value);}
      else if(action==='finish-selection'){session.selectionConfirmed=true;notice='';go('canvas');}
      else if(action==='finish-frame'){notice='';go('canvas');}
      else if(action==='return-graph'){notice='';go('canvas');}
      else if(action==='paper-details'){expandedPaper=expandedPaper===value?'':value;render();}
      else if(action==='show-papers'){showAll=!showAll;render();}
      else if(action==='toggle-import'){importOpen=!importOpen;render();}
      else if(action==='metric'){metricId=metricId===value?'':value;render();}
      else if(action==='reflect-paper'){if(!chosen().some(p=>p.id===value))return;session.canvasSource=value;notice='';if(canOpen('canvas')){tab='canvas';render();$('#canvas-insight-note')?.focus({preventScroll:false});}else go('canvas');}
      else if(action==='add-reflection'){const note=$('#canvas-insight-note').value.trim();if(!note){notice='先写下准备怎样修改。';render();return;}addIdea($('#canvas-insight-title').value.trim(),note);}
      else if(action==='add-discussion'){if(!session.discussion.trim()){notice='先记录一段准备采用的想法。';discussionOpen=true;render();return;}discussionOpen=true;addIdea(session.discussionTitle,session.discussion,'','discussion');}
      else if(action==='export-review')download(M.report(session,board,ctx),'交点_框架证据记录.txt');
      else if(action==='export-context')download(M.context(session,board,ctx),'交点_模型研讨上下文.txt');
      else if(action==='copy-context'){discussionOpen=true;try{await navigator.clipboard.writeText(M.context(session,board,ctx));notice='已复制，可在所选平台粘贴讨论。';}catch{notice='自动复制未获允许，请展开上下文后手动复制。';}render();}
    }
    function input(event){
      const el=event.target;if(rememberUse(el))return;
      if(el.id==='research-topic'){session.topic=el.value;const summary=$('.research-question-summary > summary strong');if(summary)summary.textContent=el.value;}
      else if(el.id==='literature-query')session.query=el.value;
      else if(el.id==='literature-year')session.searchYear=el.value;
      else if(el.id==='discussion-question'){session.question=el.value;const preview=$('#discussion-context');if(preview)preview.value=M.context(session,board,ctx);}
      else if(el.id==='discussion-return')session.discussion=el.value;
      else if(el.id==='discussion-idea-title')session.discussionTitle=el.value;
      else if(el.id==='canvas-insight-note'||el.id==='canvas-insight-title'){const key=el.id==='canvas-insight-note'?'note':'title';session[key==='note'?'canvasNote':'canvasTitle']=el.value;}
      else if(el.id?.startsWith('plan-')&&Object.hasOwn(M.planFields,el.id.slice(5))){const key=el.id.slice(5);session.plan[key]=el.value.slice(0,key==='nextSteps'?4000:8000);}
      else if(el.closest('form[data-r-form="import"]'))importDraft[el.name]=el.value;
      if(el.id?.startsWith('discussion-')||el.id?.startsWith('plan-')){const preview=$('#discussion-context');if(preview)preview.value=M.context(session,board,ctx);}
      persist();
    }
    function change(event){
      const el=event.target;
      if(rememberUse(el)){if(el.id==='paper-use-type'){libraryError='';renderLibrary();$('#paper-use-type')?.focus({preventScroll:true});}return;}
      if(el.id==='paper-use-source'){session.canvasSource=el.value;editingLiteratureId='';session.canvasEditing='';libraryError='';renderLibrary();persist();return;}
      if(el.dataset?.paperId){const p=paperPool().find(p=>p.id===el.dataset.paperId);if(p&&!M.chooseSource(session,p,el.checked))notice='备选文献已满，请先导出整理。';render();root.querySelector(`[data-paper-id="${el.dataset.paperId}"]`)?.focus({preventScroll:true});}
      else if(el.id==='discussion-platform'){session.platform=el.value;discussionOpen=true;render();}
      else if(el.id==='literature-sort'){session.searchSort=el.value;render();}
    }
    function submit(event){
      const form=event.target.closest('[data-r-form]');if(!form)return;event.preventDefault();const v=n=>form.elements.namedItem(n)?.value||'';
      if(form.dataset.rForm==='search'){search(form);return;}
      if(form.dataset.rForm==='metric'){const p=session.sources.find(p=>p.id===form.dataset.id);p.metric=M.source({...p,metric:{value:Number(v('value')),year:v('year'),url:v('url'),checked:form.elements.namedItem('checked').checked,checkedAt:new Date().toISOString().slice(0,10)}}).metric;metricId='';notice=p.metric?'期刊指标已保存。':'请核对数值、年份和来源链接。';render();}
      else if(form.dataset.rForm==='import'){
        if(!v('doi').trim()&&!M.safeUrl(v('url'))){notice='请填写DOI或原始来源链接。';render();return;}
        const p=M.source({title:v('title'),doi:v('doi'),url:v('url'),journal:v('journal'),year:v('year'),authors:v('authors'),abstract:v('abstract'),origin:'manual'}),duplicate=session.sources.some(x=>x.id===p.id||p.doi&&x.doi===p.doi);
        if(!duplicate){if(session.sources.length>=80){notice='备选文献已满，请先导出整理。';render();return;}session.sources.push(p);}const canonical=session.sources.find(x=>x.id===p.id||p.doi&&x.doi===p.doi);if(canonical){pinnedIds.add(canonical.id);expandedPaper=canonical.id;}importOpen=false;Object.keys(importDraft).forEach(k=>delete importDraft[k]);notice=duplicate?'这篇文献已在列表中。':'已加入备选文献，可勾选使用。';render();
      }
    }
    function keys(event){
      const id=event.target.getAttribute('data-workflow-step');if(!id||event.ctrlKey||event.metaKey)return;
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();const available=stages.filter(([id])=>canOpen(id)),i=available.findIndex(([v])=>v===id),next=available[event.key==='Home'?0:event.key==='End'?available.length-1:(i+(event.key==='ArrowRight'?1:available.length-1))%available.length][0];go(next,false);root.querySelector(`[data-workflow-step="${next}"]`)?.focus();
    }
    function toggle(event){if(event.target.classList?.contains('model-helper'))discussionOpen=event.target.open;}
    root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('submit',submit);root.addEventListener('keydown',keys);root.addEventListener('toggle',toggle,true);render();
    const cleanup=()=>{destroyed=true;unmountCanvas();controller?.abort();root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('submit',submit);root.removeEventListener('keydown',keys);root.removeEventListener('toggle',toggle,true);};
    cleanup.navigate=id=>{notice='';go(id);};return cleanup;
  }
  window.AtlasResearchWorkspace={mount};
})();
