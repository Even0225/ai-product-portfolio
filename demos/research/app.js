(() => {
  'use strict';
  const D = window.ATLAS;
  const EXAMPLE_MODE = /(?:^|[?&])case=restoration(?:&|$)/.test(window.location?.search||'');
  const KEY = EXAMPLE_MODE?'jiaodian.research.example.v1':'jiaodian.research.v1';
  const P = window.AtlasProductDesign;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initial = () => ({base:null, fields:[], step:1, direction:null, scope:'season', tab:'evidence', filter:'all', controls:['thermal','activity'], note:'', events:[], boards:{}, researchSessions:{}});
  let state = initial(), history = [], storageOK = true, lastStored = '';
  const explorer = {group:'all', query:'', scroll:0};
  const revealedFields = new Set();
  let cleanupPool = null;
  let cleanupGraph = null;
  let cleanupResearch = null;
  let cleanupDesign = null;
  let view = window.location?'design':'workbench';
  let designTab = /[?&]from=(flow|prototype|roles)(?:&|$)/.exec(window.location?.search||'')?.[1]||'flow';
  let restored = false;
  let navigationOpen = false;
  const compactNavigation = window.matchMedia?.('(max-width:720px)');
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === 'object') {
      state = {...state, base:D.bases.some(b=>b.id===s.base)?s.base:null,
        fields:[...new Set((Array.isArray(s.fields)?s.fields:[]).filter(id=>D.fields.some(f=>f.id===id)))],
        step:[1,2,3,4,5].includes(s.step)?s.step:1, direction:typeof s.direction==='string'?s.direction:null,
        scope:D.scopes.some(t=>t.id===s.scope)?s.scope:'season', tab:['evidence','discussion','canvas','framework','plan','hypotheses','validation'].includes(s.tab)?s.tab:'evidence',
        filter:['all','abstract','fulltext'].includes(s.filter)?s.filter:'all',
        controls:(Array.isArray(s.controls)?s.controls:[]).filter(id=>D.controls.some(c=>c.id===id)),
        note:typeof s.note==='string'?s.note.slice(0,3000):'', events:Array.isArray(s.events)?s.events.slice(-100):[],
        boards:Object.fromEntries(D.bases.filter(b=>s.boards&&typeof s.boards==='object'&&s.boards[b.id]).map(b=>[b.id,s.boards[b.id]])),
        researchSessions:Object.fromEntries(D.bases.filter(b=>s.researchSessions&&typeof s.researchSessions==='object'&&s.researchSessions[b.id]).map(b=>[b.id,s.researchSessions[b.id]]))};
      restored = true;
    }
  } catch { storageOK=false; }
  if(EXAMPLE_MODE&&!restored&&P)state=P.example(initial(),D,window.AtlasGraphModel,window.AtlasResearchModel);
  const base = () => D.bases.find(b=>b.id===state.base);
  const fields = () => D.fields.filter(f=>state.fields.includes(f.id));
  const scope = () => D.scopes.find(s=>s.id===state.scope);
  const isCore = () => state.base==='planning' && state.fields.includes('computing') && state.fields.includes('psychology');
  const ready = () => !!base() && state.fields.length>0;
  function candidates() {
    if (!ready()) return [];
    const cards = [...fields()].sort((a,b)=>state.fields.indexOf(b.id)-state.fields.indexOf(a.id)).map(f=>{
      const [title, object, method, variables] = D.drafts[state.base][f.id];
      return {id:`${state.base}-${f.id}`, title, object, method, variables, field:f.id, deep:false,
        why:`${base().name}界定${base().object}，${f.name}补充${f.short}，把空间描述推进到可观察的问题。`,
        unknown:`需检索${f.name}相关证据，核实数据可得性、测量效度与研究对象。`};
    });
    if (isCore()) cards.unshift({id:'restoration', title:'公共空间与恢复性体验', object:'严寒地区居住区公共空间与居民',
      method:'现场图像＋环境感知问卷＋跨季节比较（拟议）', variables:'视觉要素、季节与感知恢复性', deep:true,
      why:'城乡规划确定空间与人群，计算机提取视觉特征，环境心理学定义恢复体验与可能机制。',
      unknown:'已核对2条来源；核心论文仅有摘要，样本、量表与模型细节待查全文。'});
    return cards.slice(0,3);
  }
  const selected = () => candidates().find(c=>c.id===state.direction);
  const allowed = n => n===1 || ([2,3,5].includes(n) && ready()) || (n===4 && !!selected());
  if (!allowed(state.step)) state.step=1;
  if (!selected()) state.direction=null;
  const routeSteps=['disciplines','canvas','directions','question','research'];
  function syncRoute(push=false) {
    if(!window.location||!window.history?.replaceState)return;
    const route=view==='design'?'#design/'+designTab:'#'+routeSteps[state.step-1]+(state.step===5?'/'+(['evidence','canvas','plan'].includes(state.tab)?state.tab:'evidence'):'');
    if(window.location.hash!==route)window.history[push?'pushState':'replaceState'](null,'',route);
  }
  function applyRoute() {
    const parts=(window.location?.hash||'').slice(1).split('/');
    if(parts[0]==='design'&&P){view='design';designTab=P.validTab(parts[1]);return true;}
    const step=routeSteps.indexOf(parts[0])+1;
    if(!step||!allowed(step))return false;
    view='workbench';state.step=step;if(step===5){state.tab=['plan','hypotheses','validation'].includes(parts[1])?'plan':['canvas','framework','discussion'].includes(parts[1])?'canvas':'evidence';if(parts[1]!==state.tab)window.history?.replaceState(null,'','#research/'+state.tab);}return true;
  }
  applyRoute();
  window.addEventListener?.('popstate',()=>{if(applyRoute())render(true,false,view==='design');else syncRoute(false);});
  window.addEventListener?.('storage',event=>{if(event.key===KEY)lastStored='';});
  function save() {
    try { const value=JSON.stringify(state);if(value!==lastStored){localStorage.setItem(KEY,value);lastStored=value;}const recovered=!storageOK;storageOK=true;if(recovered){const label=$('.save-label');if(label)label.textContent='已自动保存';} } catch { storageOK=false;const label=$('.save-label');if(label)label.textContent='保存未完成，请导出备份'; }
  }
  function log(action, detail) {
    state.events.push({time:new Date().toISOString(),action,detail});
    state.events=state.events.slice(-100); save();
  }
  function toast(text) { $('#toast').textContent=text; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3200); }
  const paths = {
    building:'M4 21V5l8-3 8 3v16M2 21h20M8 8h1m6 0h1M8 12h1m6 0h1M10 21v-5h4v5',
    map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
    leaf:'M20 3C9 2 3 7 5 15c2 7 13 6 15-12ZM4 21 16 9',
    arrow:'M5 12h14m-6-6 6 6-6 6',
    back:'M19 12H5m6-6-6 6 6 6',
    check:'m5 12 4 4L19 6',
    close:'m6 6 12 12M6 18 18 6',
    plus:'M12 5v14M5 12h14',
    download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    book:'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15',
    reset:'M4 10a8 8 0 1 1 1 8M4 3v7h7',
    north:'M7 17 17 7M7 7h10v10',
    search:'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    down:'M12 4v16m-5-5 5 5 5-5'
  };
  const icon = (name,cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.plus}"/></svg>`;
  const btn = (label,action,cls='primary',extra='') => `<button class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const tags = () => [base()?.name,...fields().map(f=>f.name)].filter(Boolean);
  const combination = () => tags().map(esc).join('<span class="times">×</span>');
  const steps = ['学科组合','初步思路','研究方向','研究问题','研究探索'];
  const researchStages = [['evidence','选文献'],['canvas','优化框架'],['plan','深化研究']];
  const kicker = (n,en) => `<div class="eyebrow"><span>0${n} / 05</span><i></i>${en}</div>`;
  const title = (n,en,h,desc) => `<header class="page-heading"><h1 id="page-title" tabindex="-1">${h}</h1><p>${desc}</p></header>`;
  const badge = (t,kind='')=>`<span class="badge ${kind}">${t}</span>`;
  function footer(back,next,label,disabled=false) {
    return `<div class="page-actions">${back?btn(icon('back')+' 上一步','step','quiet',`data-value="${back}"`):`<span class="footnote">${base()?esc(base().name)+' · '+state.fields.length+' 个交叉视角':'先选择基础学科'}</span>`}<div>${disabled?'<span class="footnote">先选基础学科与至少一个交叉领域</span>':''}${btn(label+icon('arrow'),'step','primary',`data-value="${next}" ${disabled?'disabled':''}`)}</div></div>`;
  }
  function sidebarNavigation() {
    const working=view==='workbench',current=researchStages.findIndex(([id])=>id===state.tab);
    const exampleRoutes=['disciplines','canvas','directions','question','research/evidence'];
    const combo=working?tags().map(esc).join(' × '):'城乡规划 × 计算机 × 环境心理学';
    const entry=`<button type="button" class="design-entry" data-action="design" data-value="${designTab}" ${working?'':'aria-current="page"'}>${icon('book')}<span>产品设计</span></button>`;
    return `<div class="sidebar-heading"><h2>${working?'探索流程':'项目导览'}</h2><button type="button" class="icon-button" data-action="close-nav" aria-label="关闭探索流程">${icon('close')}</button></div>${entry}<nav aria-label="${working?'探索步骤':'体验研究流程'}"><ol>${steps.map((label,i)=>{
      const active=working&&state.step===i+1;
      const complete=working&&(i===0&&ready()&&state.step!==1||i===1&&state.boards[state.base]&&state.step>2||i===2&&selected()&&state.step>3||i===3&&selected()&&state.step===5);
      return `<li class="${active?'active':''}"><button data-action="${working?'step':'case-open'}" data-value="${working?i+1:exampleRoutes[i]}" ${working&&!allowed(i+1)?'disabled':''} ${active?'aria-current="step"':''}><span class="step-no">${complete?icon('check'):i+1}</span><span>${label}<small>${['选择基础与交叉学科','整理学科关系','聚焦研究方向','明确具体问题','文献、框架与方案'][i]}</small></span></button>${i===4?`<nav class="research-subnav" aria-label="研究探索进度"><ol class="research-stage-list">${researchStages.map(([id,name],j)=>`<li class="${working&&state.step===5&&current===j?'current-stage':working&&state.step===5&&j<current?'earlier-stage':''}"><button type="button" data-action="${working?'research-stage':'case-open'}" data-value="${working?id:'research/'+id}" data-workflow-step="${id}" ${working&&!allowed(5)?'disabled':''} ${working&&state.step===5&&state.tab===id?'aria-current="step"':''}><span class="stage-marker">${working&&state.step===5&&j<current?icon('check'):j+1}</span><span>${name}</span>${working&&state.step===5&&state.tab===id?'<small class="current-stage-label">当前</small>':''}</button></li>`).join('')}</ol></nav>`:''}</li>`;
    }).join('')}</ol></nav>${combo?`<div class="sidebar-combination"><span>${working?(EXAMPLE_MODE?'示例工作区':'当前组合'):'示例组合'}</span><p>${combo}</p></div>`:''}`;
  }
  function sidebar() {
    return `<aside id="app-sidebar" class="sidebar${view==='workbench'&&state.step===5?' research-mode':view==='design'?' design-mode':''}${navigationOpen?' is-open':''}" aria-label="探索流程" ${compactNavigation?.matches&&!navigationOpen?'inert':''}>${sidebarNavigation()}</aside><button type="button" class="nav-backdrop" data-action="close-nav" aria-label="关闭探索流程" ${navigationOpen?'':'hidden'}></button>`;
  }
  function setNavigation(open,focus=false){
    navigationOpen=!!open;const compact=compactNavigation?.matches===true,side=$('#app-sidebar'),backdrop=$('.nav-backdrop'),toggle=$('.workflow-toggle');
    side?.classList.toggle('is-open',navigationOpen);if(side)side.inert=compact&&!navigationOpen;if(backdrop)backdrop.hidden=!navigationOpen;if(toggle)toggle.setAttribute('aria-expanded',String(navigationOpen));const content=$('.workspace');if(content)content.inert=compact&&navigationOpen;
    if(focus)(navigationOpen?side?.querySelector('[aria-current="step"]'):toggle)?.focus();
  }
  compactNavigation?.addEventListener?.('change',()=>setNavigation(false));
  function header() {
    const working=view==='workbench',purpose=working?(state.step===5?'研究探索':'跨学科研究工作台'):'产品设计';
    const mark=`<svg class="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path class="brand-path-primary" d="M5 9h4c5 0 7 7 11 11s6 11 11 11h4"/><path class="brand-path-research" d="M5 31h4c5 0 7-7 11-11s6-11 11-11h4"/><circle cx="20" cy="20" r="4"/></svg>`;
    return `<header class="topbar${working&&state.step===5?' research-topbar':''}${EXAMPLE_MODE?' example-topbar':''}"><div class="topbar-inner"><a class="brand" href="#design/${designTab}" data-action="design" data-value="${designTab}" aria-label="交点，返回产品设计">${mark}<span class="brand-name">交点</span></a><span class="app-purpose">${purpose}</span><div class="top-tools">${EXAMPLE_MODE?'<span class="workspace-kind">示例</span>':''}${working?`<span class="save-label" role="status" aria-live="polite">${storageOK?'已自动保存':'请导出备份'}</span>`:''}<button type="button" class="text-button workflow-toggle" data-action="toggle-nav" aria-controls="app-sidebar" aria-expanded="${navigationOpen}">查看流程</button>${working&&state.step!==5&&!EXAMPLE_MODE?`<a class="text-button sample-entry" href="${P?.caseLink('canvas',designTab)||'index.html?case=restoration#canvas'}">体验示例</a>`:''}<button data-action="about" class="text-button">资料与边界</button></div></div></header>`;
  }
  const normalise = text => String(text).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,'');
  function poolGroups() {
    const query = normalise(explorer.query);
    return D.groups.filter(g=>explorer.group==='all'||explorer.group===g.id).map(g=>({
      ...g, items:g.ids.map(id=>D.fields.find(f=>f.id===id)).filter(f=>!query||normalise([f.name,f.short,f.desc,f.method,f.keywords,g.name].join(' ')).includes(query))
    })).filter(g=>g.items.length);
  }
  function poolContent(groups) {
    if (!groups.length) return `<div class="pool-empty">${icon('search')}<h3>还没找到这个方向</h3><p>试试“气候”“AI”或“教育”，也可以清除条件，重新浏览全部领域。</p>${btn('清除筛选条件','pool-reset','outline')}</div>`;
    return groups.map(g=>`<section class="pool-group" aria-labelledby="group-${g.id}"><div class="pool-group-heading"><h3 id="group-${g.id}">${g.name}</h3><span>${g.en}</span><small>${g.items.length} 个领域</small></div><div class="pool-options">${g.items.map(f=>{
      const on=state.fields.includes(f.id);
      return `<button class="field-card ${on?'selected':''}" data-action="field" data-value="${f.id}" aria-pressed="${on}"><span class="field-card-top"><strong>${f.name}</strong><span class="field-toggle">${icon(on?'check':'plus')}</span></span><span class="field-desc">${f.desc}</span><span class="role">${f.role}视角</span></button>`;
    }).join('')}</div></section>`).join('');
  }
  function poolCount(groups) {
    const count=groups.reduce((n,g)=>n+g.items.length,0);
    return `显示 ${count} / ${D.fields.length} 个领域`;
  }
  function fieldPool() {
    const groups=poolGroups();
    return `<section class="fields-panel"><div class="section-label"><span class="num-dot">2</span><h2 id="field-pool-title">叠加交叉视角</h2><span>${D.groups.length} 组 · ${D.fields.length} 个领域</span></div><div class="pool-toolbar"><div class="pool-search">${icon('search')}<label class="sr-only" for="field-search">搜索交叉学科</label><input id="field-search" type="search" autocomplete="off" maxlength="120" placeholder="搜索学科，如 人工智能、生态学…" value="${esc(explorer.query)}" aria-controls="field-pool"><button id="pool-query-clear" class="icon-button" data-action="pool-clear" aria-label="清空学科搜索" ${explorer.query?'':'hidden'}>${icon('close')}</button></div></div><div class="pool-filters" role="group" aria-label="按研究视角筛选"><button data-action="pool-group" data-value="all" aria-pressed="${explorer.group==='all'}" class="${explorer.group==='all'?'active':''}">全部领域</button>${D.groups.map(g=>`<button data-action="pool-group" data-value="${g.id}" aria-pressed="${explorer.group===g.id}" class="${explorer.group===g.id?'active':''}">${g.name}</button>`).join('')}</div><div class="pool-meta"><span id="pool-result-count" role="status" aria-live="polite" aria-atomic="true">${poolCount(groups)}</span><span>多选 · 随时撤销</span></div><div class="pool-window" id="pool-window"><div class="field-pool" id="field-pool" role="region" aria-labelledby="field-pool-title" aria-describedby="pool-scroll-hint" tabindex="0">${poolContent(groups)}</div></div><div class="pool-footer"><span id="pool-scroll-hint">向下滚动，发现更多领域</span><button class="text-button" data-action="pool-more">继续浏览 ${icon('down')}</button></div></section>`;
  }
  function mountPool() {
    cleanupPool?.(); cleanupPool=null;
    const pool=$('#field-pool');
    if (!pool?.querySelectorAll) return;
    pool.scrollTop=explorer.scroll;
    const motionReduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const updateScroll=()=>{
      explorer.scroll=pool.scrollTop;
      const more=pool.scrollHeight-pool.clientHeight-pool.scrollTop>4;
      const scrollable=pool.scrollHeight-pool.clientHeight>4;
      const frame=$('#pool-window');
      frame.dataset.scrolled=String(pool.scrollTop>8);frame.dataset.more=String(more);
      const next=$('[data-action="pool-more"]');next.disabled=!more;
      $('#pool-scroll-hint').textContent=more?'向下滚动，发现更多领域':scrollable?'已到最后一组，可继续叠加视角':'选择感兴趣的领域，可继续叠加';
    };
    pool.addEventListener('scroll',updateScroll,{passive:true}); updateScroll();
    let observer;
    if (!motionReduced && typeof window.IntersectionObserver==='function') {
      observer=new window.IntersectionObserver(entries=>{
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const card=entry.target, id=card.dataset.value;
          const reduceNow=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!reduceNow && !revealedFields.has(id) && typeof card.animate==='function') {
            card.animate([{opacity:0.38,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(0.16, 1, 0.3, 1)'});
          }
          revealedFields.add(id);observer.unobserve(card);
        }
      },{root:pool,threshold:0.12});
      pool.querySelectorAll('.field-card').forEach(card=>observer.observe(card));
    }
    cleanupPool=()=>{pool.removeEventListener('scroll',updateScroll);observer?.disconnect();};
  }
  function updatePoolView() {
    const groups=poolGroups();
    $('#field-pool').innerHTML=poolContent(groups);
    $('#pool-result-count').textContent=poolCount(groups);
    $('#pool-query-clear').hidden=!explorer.query;
    document.querySelectorAll('[data-action="pool-group"]').forEach(button=>{
      const active=button.dataset.value===explorer.group;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    explorer.scroll=0;mountPool();
  }
  function explore() {
    return `${title(1,'DISCIPLINE EXPLORER','选择学科组合','先选一门基础学科，再加入想探索的交叉视角。')}
    <div class="explorer-grid"><section class="base-panel"><div class="section-label"><span class="num-dot">1</span><h2>选择基础学科</h2><span>单选</span></div><div class="base-options">${D.bases.map(b=>`<button class="base-card ${state.base===b.id?'selected':''}" data-action="base" data-value="${b.id}" aria-pressed="${state.base===b.id}"><span class="base-icon">${icon(b.icon)}</span><span><strong>${b.name}</strong><small>${b.en}</small><p>${b.desc}</p></span><span class="selection-circle">${state.base===b.id?icon('check'):''}</span></button>`).join('')}</div></section>
    ${fieldPool()}</div>
    <section class="selection-tray" aria-label="已选学科组合"><div><span class="tiny-label">当前学科组合</span><h2>${state.fields.length>3?`${esc(base()?.name||'待选基础学科')}<span class="combination-count">× ${state.fields.length} 个交叉视角</span>`:tags().length?combination():'选择后，这里会显示你的学科组合。'}</h2>${state.fields.length?`<div class="selected-fields" aria-label="已选交叉学科">${fields().map(f=>`<button class="removable-chip" data-action="remove" data-value="${f.id}" aria-label="移除${f.name}">${f.name}${icon('close')}</button>`).join('')}</div>`:''}<p id="selection-feedback" aria-live="polite">${feedback()}</p></div><button data-action="undo" class="text-button" ${history.length?'':'disabled'}>${icon('reset')} 撤销上次选择</button></section>
    ${footer(null,2,'下一步：搭建思路',!ready())}`;
  }
  function feedback() {
    if (!base()) return '选择左侧的基础学科，确定你观察世界的起点。';
    if (!state.fields.length) return `${base().name}提供研究对象。再加入一个领域，看看问题如何变化。`;
    if (isCore()) return '已连接空间对象、计算方法与心理机制。接下来，把学科名称转为研究贡献。';
    return `已叠加${state.fields.length}个交叉视角。候选方向将按当前组合更新；未检索方向会明确标为草案。`;
  }
  function graphBoard() {
    const b=base();
    const board=window.AtlasGraphModel.reconcile(state.boards[b.id],b,fields());
    state.boards[b.id]=board;return board;
  }
  function graph() {
    graphBoard();
    return '<div class="idea-graph" id="idea-graph"></div><div class="graph-research-entry"><p>已有明确问题？也可以直接从文献继续完善。</p>'+btn('选择参考文献','study','outline','data-value="evidence"')+'</div>';
  }
  function researchContext() {
    const c=selected();
    return {base:state.base,fieldIds:[...state.fields],combination:tags().join(' × '),core:isCore(),directionName:c?.title||'尚未限定，可在当前探索中继续收敛',scopeName:c?.deep?scope().title:'待进一步限定',
      question:c?.deep?scope().question:c?.title||tags().join(' × ')+'：哪些关系值得检验？'};
  }
  function researchSession() {
    const ctx=researchContext();
    const session=window.AtlasResearchModel.create(state.researchSessions[state.base],ctx,ctx.core?D.sources:[]);
    state.researchSessions[state.base]=session;return session;
  }
  function reviewFromGraph(type,id,board) {
    const t=window.AtlasResearchModel.targets(board).find(t=>t.key===type+':'+id);
    return t?window.AtlasResearchModel.assess(researchSession(),t):null;
  }
  function combinationPage() {
    return `${title(2,'COMBINATION WORKBENCH','搭建初步研究思路','拖动、连线并记录想法，再结合文献补充方法与研究线索。')}<section class="workbench"><div class="workbench-head"><div class="graph-heading-group"><h2 class="graph-heading">思路画布</h2><span>可拖动 · 可连线 · 本机保存</span></div>${btn('修改学科组合','step','quiet', 'data-value="1"')}</div>${graph()}<div class="chip-row">${fields().map(f=>`<button class="removable-chip" data-action="remove" data-value="${f.id}" aria-label="移除${f.name}">${f.name}${icon('close')}</button>`).join('')}</div></section>
    <details class="contribution-disclosure"><summary>了解各学科的研究贡献</summary><div class="contribution-list"><article class="contribution base-contribution"><span class="contribution-index">00</span><div><span class="tiny-label">${base().name} / 研究对象</span><h2>${base().object}</h2><p>${base().method} → ${base().metric}</p></div>${icon(base().icon)}</article>${fields().map((f,i)=>`<article class="contribution"><span class="contribution-index">${String(i+1).padStart(2,'0')}</span><div><div class="contribution-heading"><h2>${f.name}</h2>${badge(f.role+'贡献')}</div><p>${f.contribution}</p><div class="method-line"><span>方法</span>${f.method}<span>观察</span>${f.metric}</div><div class="caution">待解决：${f.caution}</div></div></article>`).join('')}</div></details><div class="insight-line"><span>组合判断</span><p>${isCore()?'这条路径形成“空间对象 → 视觉测量 → 心理体验”的分工。比较方案围绕指标效度、混杂因素和跨季节可比性展开。':'根据学科组合生成互补的研究方向，供后续文献检索与选题比较。'}</p></div>${footer(1,3,'下一步：选择方向')}`;
  }
  function perspectives() {
    const fs=fields().filter(f=>!['computing','psychology'].includes(f.id));
    return fs.length?`<details class="supplement"><summary>补充学科视角（${fs.length}）</summary>${fs.map(f=>`<p><strong>${f.name}</strong> → ${f.contribution}</p>`).join('')}<small>补充视角可作为检索关键词和选题线索。</small></details>`:'';
  }
  function directionsPage() {
    return `${title(3,'RESEARCH DIRECTIONS','选择一个研究方向','比较研究对象与方法，选择最想继续追问的方向。')}<div class="current-combo">${combination()}${btn('调整学科','step','quiet','data-value="1"')}</div><div class="direction-intro"><span class="status-dot" aria-hidden="true"></span>${isCore()?'已整理的资料用于比较各方向的研究问题和方法。':'当前组合提供方向草案，接下来通过文献判断是否值得深化。'}<span>共 ${candidates().length} 个方向</span></div><div class="directions">${candidates().map(c=>`<article class="direction-card ${c.deep?'featured':''}"><div class="direction-summary"><div class="direction-top">${badge(c.deep?'已整理 2 条证据':'方向草案 · 未检索',c.deep?'green':'')}${state.direction===c.id?badge('当前选择','green'):''}</div><h2>${c.title}</h2><p class="direction-object">${c.object}</p></div>${btn('选择这个方向','direction','outline',`data-value="${c.id}"`)}<details class="direction-details"><summary>查看方向说明</summary><div class="direction-body"><div><span>为什么交叉</span><p>${c.why}</p></div><div><span>数据与方法</span><p>${c.method}</p></div><div><span>研究关注点</span><p>${c.unknown}</p></div></div></details></article>`).join('')}</div>${perspectives()}<div class="page-actions">${btn(icon('back')+' 返回初步思路','step','quiet','data-value="2"')}<span class="footnote">候选方向来自人工规则与资料整理。</span></div>`;
  }
  function scopePage() {
    const c=selected(), s=scope();
    if (!c.deep) return draftScope(c);
    return `${title(4,'FOCUS THE QUESTION','明确研究问题','选一个切口，确认要观察的变量，再进入文献探索。')}<div class="focus-banner"><span>研究方向</span><h2>${c.title}</h2>${badge('已整理资料','green')}</div><div class="scope-options" aria-label="选择问题切口">${D.scopes.map(t=>`<button class="scope-card ${s.id===t.id?'selected':''}" data-action="scope" data-value="${t.id}" aria-pressed="${s.id===t.id}"><strong>${t.title}</strong><span>${t.desc}</span>${s.id===t.id?icon('check'):''}</button>`).join('')}</div><div class="research-question"><h2>${s.question}</h2><p>选好文献后，可以把借鉴内容放到画布中，整理研究思路。</p></div><div class="variable-grid"><div><small>环境 / 暴露</small><strong>${s.x}</strong></div><div><small>感知 / 结果</small><strong>${s.y}</strong></div><div><small>调节 / 情境</small><strong>${s.moderator}</strong></div></div><details class="scope-evidence"><summary>研究对象与现有依据</summary><p><strong>研究对象</strong> 严寒地区居住区公共空间。拟关注日常使用公共空间的成年居民，样本招募与场地条件待落实。</p><p><strong>待澄清之处</strong> ${s.gap}</p></details>${footer(3,5,'下一步：选择文献')}`;
  }
  function draftScope(c) {
    return `${title(4,'DIRECTION DRAFT','明确研究问题','先确认研究对象与变量，再通过文献判断怎样继续。')}<div class="focus-banner"><span>方向草案</span><h2>${c.title}</h2>${badge('未检索文献')}</div><div class="research-question"><h2>在${c.object}中，${c.variables}如何关联？</h2><p>可按场地、人群、时间和比较条件收敛候选问题。</p></div><div class="variable-grid"><div><small>研究对象</small><strong>${c.object}</strong></div><div><small>拟观察变量</small><strong>${c.variables}</strong></div><div><small>拟采用的方法</small><strong>${c.method}</strong></div></div><details class="scope-evidence"><summary>查看方向说明与待核实问题</summary><p>${c.why}</p><p>以上为拟议方案，数据是否可获得、能否可靠测量需核实。</p><p>${c.unknown}</p></details>${perspectives()}${footer(3,5,'下一步：选择文献')}`;
  }
  function sourceCards() {
    const ss=D.sources.filter(s=>state.filter==='all'||s.type===state.filter);
    return `<div class="evidence-heading"><div><h2>可回查的文献证据</h2><p>来源陈述、研究启发与使用边界分别呈现。</p></div><div class="filter-group" role="group" aria-label="按阅读范围筛选">${[['all','全部 2'],['abstract','公开摘要 1'],['fulltext','开放全文 1']].map(([id,n])=>`<button data-action="filter" data-value="${id}" class="${state.filter===id?'active':''}" aria-pressed="${state.filter===id}">${n}</button>`).join('')}</div></div><div class="evidence-list">${ss.map(s=>`<article class="evidence-card" id="${s.id}"><div class="source-head"><span class="source-id">${s.id}</span>${badge(s.label,s.type==='fulltext'?'green':'')}<span>${s.year} · ${s.journal}</span></div><h3>${s.name}</h3><div class="evidence-columns"><div><span class="claim-label">来源报告</span><p>${s.finding}</p><small>${s.method}</small></div><div><span class="claim-label inference">研究启发 · 本Demo推断</span><p>${s.implication}</p><small>此处记录由文献引出的研究启发。</small></div></div><details><summary>查看阅读范围与不能推出的结论 ${icon('plus')}</summary><div class="evidence-detail"><p><strong>阅读范围</strong> ${s.limit}</p><p><strong>回查位置</strong> ${s.location}</p><p><strong>不能推出</strong> ${s.cannot}</p><p class="citation">${s.authors}. ${s.title}. ${s.journal}, ${s.year}. DOI: ${s.doi}</p></div></details><a class="source-link" href="${s.url}" target="_blank" rel="noopener noreferrer">打开出版社原始来源 ${icon('north')}</a></article>`).join('')}</div><div class="synthesis"><span class="tiny-label">把证据放在一起</span><h3>季节差异值得追问，但“恢复”需要拆开测量。</h3><p>E01聚焦特定寒地社区，E02汇总多种自然环境暴露。两者的场景、年代与结局不同，不能直接拼成同一个因果结论。</p><div class="claim-tags"><span>已有发现 → 有场景边界</span><span>指标分歧 → 心理与生理分开</span><span>仍未知 → 效应、机制与可推广性</span></div></div><div class="tab-next">${btn('继续：假设与替代解释 '+icon('arrow'),'tab','primary','data-value="hypotheses"')}</div>`;
  }
  function hypotheses() {
    const s=scope();
    const h1 = s.id==='season'?'视觉要素与感知恢复性的关联强度可能随季节变化。':s.id==='measurement'?'同一视觉指标的解释力可能因季节与图像识别误差而变化。':'基线压力不同的居民，其视觉环境与感知恢复性的关联可能不同。';
    const falsify = s.id==='season'?'在预先确定的模型中，季节交互项接近零或区间跨越有意义差异范围时，不支持季节调节解释。':s.id==='measurement'?'人工校准后指标依然不能解释额外差异，或在留出场地表现不稳定时，不支持直接使用该视觉代理。':'控制场地与活动后分组差异不稳定、区间过宽时，不支持明确的人群调节结论。';
    return `<div class="section-intro"><h2>提出解释，也留下被推翻的可能。</h2><p>以下均为本Demo的候选假设，未被本原型实测或验证。</p></div><div class="causal-sketch"><span class="tiny-label">研究假设关系图</span><div class="causal-chain"><span>视觉环境要素<small>计算机测量</small></span><b>→</b><span>环境感知<small>心理机制候选</small></span><b>→</b><span>感知恢复性<small>问卷结果</small></span></div><div class="confound">季节 / 天气 / 活动 / 基线压力 ↗ 可能同时影响多个环节</div></div><article class="hypothesis"><div><span class="hypo-id">H1</span>${badge('候选假设','rust')}</div><h3>${h1}</h3><p><strong>线索依据</strong> E01提供季节与环境要素线索；不代表原文已经检验了这里提出的交互关系。</p><div class="challenge"><span>如何反驳</span><p>${falsify}</p></div></article><article class="hypothesis"><div><span class="hypo-id">H2</span>${badge('候选假设','rust')}</div><h3>主观感知改善与生理变化可能不同步。</h3><p><strong>线索依据</strong> E02中不同结局的证据并不一致。若后续采集生理数据，应单独报告，避免用其中一类替代另一类。</p><div class="challenge"><span>如何反驳</span><p>若在可靠测量、可比暴露与足够精度下，两类结局稳定同步变化，则应修正“不同步”的解释。</p></div></article><div class="alternatives"><h3>至少保留三种替代解释</h3><div><p><b>01</b><strong>热舒适，而非视觉差异</strong><span>温度与风可能同时改变空间选择和情绪。</span></p><p><b>02</b><strong>活动与陪伴，而非空间本身</strong><span>步行、运动或社会交往可能带来恢复感。</span></p><p><b>03</b><strong>选择偏差与测量误差</strong><span>愿意出门的居民、拍摄条件或基线状态可能不同。</span></p></div></div><div class="tab-next">${btn('继续：设计下一步验证 '+icon('arrow'),'tab','primary','data-value="validation"')}</div>`;
  }
  function validation() {
    const chosen=D.controls.filter(c=>state.controls.includes(c.id));
    return `<div class="section-intro"><h2>把问题转成可以执行的验证。</h2><p>这是拟议研究方案，没有参与者数据、模型训练结果或实测效果。</p></div><div class="validation-layout"><div class="validation-steps">${[
      ['先补齐证据','获取E01全文，核实样本、量表与模型；补检索季节、感知恢复性和视觉指标效度，记录纳入与排除理由。'],
      ['确定可比的研究设计','拟在同一组公共空间跨季节重复观察；优先追踪同一批居民，记录失访，并检查季节间样本构成。图片实验可辅助，不能替代真实暴露。'],
      ['先验证测量，再分析关系','定点、定时、统一视角采图；人工复核语义分割与绿视率。选择经验证且适合目标人群的量表，先做小规模试测，记录信度与缺失。'],
      ['预先写清分析与失败标准','预先确定主要结局、交互项与混杂调整；按居民/场地结构考虑重复测量模型，报告效应与不确定区间。样本量由试测方差与精度目标估计。'],
      ['用结果决定是否继续','若关联不稳、测量误差过大或替代解释更强，就修正假设；若只能观察关联，不作确定的因果解释。涉及居民数据时先落实伦理与知情同意。']
    ].map(([t,p],i)=>`<article class="validation-step"><span>0${i+1}</span><div><h3>${t}</h3><p>${p}</p></div></article>`).join('')}</div><aside class="control-panel"><span class="tiny-label">设计你的混杂记录</span><h3>哪些因素需要优先控制？</h3><p>选择会写入导出的验证记录。</p>${D.controls.map(c=>`<label class="control-option"><input type="checkbox" data-control="${c.id}" ${state.controls.includes(c.id)?'checked':''}><span><strong>${c.title}</strong><small>${c.desc}</small></span></label>`).join('')}<div class="control-feedback" role="status">已记录 ${chosen.length} / 4 类因素。${chosen.length===4?'仍需检查遗漏因素与选择偏差。':'尚未选择的因素会保留为方案缺口。'}</div></aside></div><div class="note-panel"><label for="research-note">我的研究备忘 <span>保存在本机 · 最多3000字</span></label><textarea id="research-note" maxlength="3000" placeholder="例如：先确认能否跨季节追踪同一批居民，再决定样本设计。">${esc(state.note)}</textarea></div><div class="export-banner"><div><h3>保留一条完整的推理链</h3><p>组合 → 问题 → 证据范围 → 假设 → 替代解释 → 验证方案</p></div><div>${btn(icon('download')+' 导出研究记录','export','primary')}${btn('修改学科组合','step','quiet','data-value="1"')}</div></div>`;
  }
  function draftResearch(c) {
    return `${title(5,'RESEARCH BACKLOG','先找到证据，再给出结论。','当前方向处于探索草案阶段，暂不生成“已有发现”或证据支持的假设。')}<div class="focus-banner"><span>当前方向</span><h2>${c.title}</h2>${badge('0 条已核实来源')}</div><div class="draft-backlog"><span class="empty-symbol">＋</span><h2>这条路径的证据仍待整理</h2><p>已完成学科分工与对象收敛。下一步需要为“${c.variables}”查找可回查资料。</p><ol><li>检索：用研究对象、关键变量和比较条件组合中英文关键词。</li><li>筛选：优先核对原始研究；记录只读摘要还是阅读全文。</li><li>提取：区分原文发现、作者解释、本Demo推断与未知。</li><li>设计：确认数据可得性、测量工具和替代解释后，再提出假设。</li></ol>${btn('载入已整理的示例路径 '+icon('arrow'),'sample','primary')}<p class="footnote">示例路径：城乡规划 × 计算机 × 环境心理学</p></div><div class="page-actions">${btn(icon('back')+' 返回具体切口','step','quiet','data-value="4"')}${btn('修改组合','step','outline','data-value="1"')}</div>`;
  }
  function researchPage() {
    const s=researchSession();graphBoard();
    return `<h1 id="page-title" class="sr-only" tabindex="-1">研究探索</h1><div id="research-workspace" data-sources="${s.sources.length}"></div>`;
  }
  function render(focus=false,resetPool=false,restoreDesign=false) {
    const oldPool=$('#field-pool');
    if (!resetPool && oldPool) explorer.scroll=oldPool.scrollTop||0;
    if (resetPool) explorer.scroll=0;
    cleanupDesign?.();cleanupDesign=null;
    cleanupPool?.();cleanupPool=null;
    cleanupGraph?.();cleanupGraph=null;
    cleanupResearch?.();cleanupResearch=null;
    if (!allowed(state.step)) state.step=1;
    const pages=[explore,combinationPage,directionsPage,scopePage,researchPage];
    const content=view==='design'?P.render(designTab,{hasResearch:ready(),exampleMode:EXAMPLE_MODE}):pages[state.step-1]();
    const foot=view==='design'?`<footer class="app-footer design-footer"><span>产品设计图按当前原型整理于 2026-11-07</span><span>个人交互原型 v${D.version}</span></footer>`:`<footer class="app-footer"><span>${EXAMPLE_MODE?'示例内容，改动单独保存':'交点 · 跨学科研究工作台'}</span><button class="text-button" data-action="reset">${EXAMPLE_MODE?'重新载入示例':'新建探索'}</button><span>本地原型 v${D.version}</span></footer>`;
    $('#app').innerHTML=`${header()}${sidebar()}<div class="workspace"><main id="main">${content}</main>${foot}</div>`;
    if(view==='workbench'||EXAMPLE_MODE)save();mountPool();
    if(view==='design'&&$('#main')?.querySelectorAll)cleanupDesign=P.mount($('#main'),designTab,restoreDesign);
    const graphRoot=$('#idea-graph');
    if(view==='workbench'&&state.step===2&&graphRoot?.querySelectorAll) {
      const graphBase=state.base;
      cleanupGraph=window.AtlasGraphEditor.mount(graphRoot,graphBoard(),(board,action)=>{
        state.boards[graphBase]=board;
        if(action)log('graph-'+action,{base:graphBase,nodes:board.nodes.length,edges:board.edges.length});else save();
        return storageOK;
      },{compact:true,getAnnotation:reviewFromGraph});
    }
    const researchRoot=$('#research-workspace');
    if(view==='workbench'&&state.step===5&&researchRoot?.querySelectorAll) {
      const researchBase=state.base;
      cleanupResearch=window.AtlasResearchWorkspace.mount(researchRoot,researchSession(),graphBoard(),researchContext(),{
        tab:state.tab,
        onSave:(session,tab)=>{const changed=state.tab!==tab;state.researchSessions[researchBase]=session;state.tab=tab;save();syncRoute(true);if(changed){const side=$('#app-sidebar');if(side)side.innerHTML=sidebarNavigation();}},
        onBoard:(board,action)=>{state.boards[researchBase]=board;if(action)log('research-graph-'+action,{base:researchBase,nodes:board.nodes.length,edges:board.edges.length});else save();return storageOK;}
      });
    }
    syncRoute(focus);
    if (focus) { window.scrollTo({top:0,behavior:'instant'}); $('#page-title')?.focus({preventScroll:true}); }
  }
  function changeSelection(action,id) {
    history.push({base:state.base,fields:[...state.fields],boards:window.AtlasGraphModel.clone(state.boards)});
    history=history.slice(-20);
    if (action==='base') state.base=state.base===id?null:id;
    else state.fields=state.fields.includes(id)?state.fields.filter(f=>f!==id):[...state.fields,id];
    state.direction=null; state.tab='evidence'; state.step=state.step===1?1:2;
    log(action,{base:state.base,fields:[...state.fields]}); render();
    const target=$(`[data-action="${action}"][data-value="${id}"]`);
    if (target) target.focus({preventScroll:true});
    else if (action==='remove') $('#field-search')?.focus({preventScroll:true});
  }
  function sample() {
    history.push({base:state.base,fields:[...state.fields],boards:window.AtlasGraphModel.clone(state.boards)});
    view='workbench';Object.assign(state,{base:'planning',fields:['computing','psychology'],direction:null,step:2,scope:'season',tab:'evidence'});
    Object.assign(explorer,{group:'all',query:'',scroll:0});
    log('load-example','城乡规划→计算机→环境心理学'); render(true,true); toast('已载入示例组合。可返回第01步演示逐步叠加。');
  }
  function showAbout() {
    const dialog=$('#dialog');
    dialog.innerHTML=`<div class="dialog-head"><button class="icon-button" data-action="close-dialog" aria-label="关闭资料与边界">${icon('close')}</button></div><h2 id="dialog-title">资料与边界</h2><p>交点是一份个人探索作品，将学科组合、文献阅读与画布中的研究思考连接起来。不是任何机构的委托需求或已部署科研系统。</p><div class="about-section"><h3>01 / 运行方式</h3><p>学科组合与方向采用人工规则；两条文献由人工核对后预先整理。网页可实时检索Crossref学术元数据，也提供外部学术检索入口；它不覆盖全网文献。检索结果先作为候选。题录直接展示原文标题、作者、期刊、发表年份和DOI；部分期刊指标已附官网来源，其余可核对后补录。模型部分仅提供平台入口与上下文复制/下载，无API调用。浏览器保存画布、资料与人工核查记录。</p></div><div class="about-section"><h3>02 / 研究来源</h3>${D.sources.map(s=>`<p><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.id} · ${esc(s.title)} ${icon('north')}</a><small>${esc(s.authors)}<br>${esc(s.journal)} · ${s.year} · DOI: ${s.doi}<br>${s.label}</small></p>`).join('')}<p>核查日期：${D.reviewed}。两条来源用于演示证据处理，未构成系统检索或创新性证明。</p></div><div class="about-section"><h3>03 / 作者与经历</h3><p>孙怡文，哈尔滨工业大学城乡规划学硕士在读（据本人简历）。简历列有E01，出版社作者页列出 Yiwen Sun；此处只据此关联研究经历，具体个人分工未核实，不将合作研究表述为独立完成。</p></div><div class="about-section"><h3>04 / 机构背景</h3><p>作品面向交叉研究与AI产品相关能力展示。已核查<a href="https://www.bza.edu.cn/" target="_blank" rel="noopener noreferrer">北京中关村学院</a>与<a href="https://www.zgci.ac.cn/about" target="_blank" rel="noopener noreferrer">中关村人工智能研究院</a>官网；不代表与两机构存在合作或需求确认。</p></div>${btn('回到探索','close-dialog','primary')}`;
    dialog.showModal();
  }
  function exportRecord() {
    const s=scope();
    const text=[`交点 · 研究探索记录`,`导出时间：${new Date().toLocaleString('zh-CN')}`,`模式：文献线索与人工核查；模型上下文导出；无模型API调用或实测结果。`,``,
      `1. 学科组合`,tags().join(' × '),...fields().map(f=>`${f.name}：${f.contribution}`),``,
      `2. 具体切口`,selected()?.title||'未选择',s.question,`变量：${s.x} → ${s.y}；情境：${s.moderator}`,`待澄清：${s.gap}`,``,
      `3. 可回查证据`,...D.sources.flatMap(s=>[`${s.id} ${window.AtlasResearchModel.citation(window.AtlasResearchModel.curated(s))}`,`阅读范围：${s.label}。${s.limit}`,`来源报告：${s.finding}`,`Demo推断：${s.implication}`,`不能推出：${s.cannot}`,`回查位置：${s.location}`,s.url,``]),
      `4. 候选假设与替代解释`,`H1（未验证）：${s.id==='season'?'视觉要素与感知恢复性的关联可能随季节变化。':s.id==='measurement'?'视觉指标的解释力可能随季节与识别误差变化。':'基线压力可能调节视觉环境与感知恢复性的关联。'}`,
      `H2（未验证）：主观感知改善与生理变化可能不同步。`,`替代解释：热舒适；活动与陪伴；选择偏差与测量误差。`,``,
      `5. 下一步验证`,`补查E01全文与更新文献 → 设计同场地跨季节重复观察 → 人工核对视觉指标与试测量表 → 预先确定主要结局、混杂、交互与失败标准 → 报告效应和不确定性。`,`样本量应由试测方差与精度目标估计；无已采集数据。`,
      `已选混杂记录：${D.controls.filter(c=>state.controls.includes(c.id)).map(c=>c.title).join('、')||'尚未选择'}`,`方案缺口：${D.controls.filter(c=>!state.controls.includes(c.id)).map(c=>c.title).join('、')||'仍需检查遗漏混杂与选择偏差'}`,``,`6. 我的备忘`,state.note||'（未填写）',``,`7. 实现边界`,`本地研究原型。Crossref检索提供候选元数据，支持度来自人工阅读记录；不提供创新性认证，不代表机构内部需求。`,``,`8. 我的思路`,...window.AtlasGraphModel.lines(graphBoard()),``,`9. 操作记录（最近100项）`,...state.events.map(e=>`${e.time} | ${e.action} | ${typeof e.detail==='string'?e.detail:JSON.stringify(e.detail)}`),``,`10. 当前框架核查`,window.AtlasResearchModel.report(researchSession(),graphBoard(),researchContext())].join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a'); a.href=url;a.download='交点_研究探索记录.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
    log('export-record',s.id);toast('已导出研究记录，包含来源边界与当前验证选择。');
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-action]'); if (!el||el.disabled) return;
    e.preventDefault(); const {action,value}=el.dataset;
    if(action==='design'){
      const restore=view==='workbench';designTab=P.validTab(value||designTab);view='design';navigationOpen=false;render(true,false,restore);return;
    }
    if(action==='enter-workbench'){view='workbench';navigationOpen=false;render(true);return;}
    if(action==='case-open'){window.location.href=P.caseLink(value,designTab);return;}
    if(action==='toggle-nav'){setNavigation(!navigationOpen,true);return;}
    if(action==='close-nav'){setNavigation(false,true);return;}
    if(action==='research-stage'){
      if(!allowed(5)||!researchStages.some(([id])=>id===value))return;
      if(state.step===5&&cleanupResearch?.navigate)cleanupResearch.navigate(value);
      else{view='workbench';state.step=5;state.tab=value;navigationOpen=false;render(true);}
      if(navigationOpen)setNavigation(false);return;
    }
    if(navigationOpen)setNavigation(false);
    if (action==='base'||action==='field'||action==='remove') changeSelection(action,value);
    else if (action==='pool-group') {
      if (value!=='all'&&!D.groups.some(g=>g.id===value)) return;
      explorer.group=value;updatePoolView();
    } else if (action==='pool-clear'||action==='pool-reset') {
      explorer.query='';if(action==='pool-reset')explorer.group='all';
      $('#field-search').value='';updatePoolView();$('#field-search').focus({preventScroll:true});
    } else if (action==='pool-more') {
      const pool=$('#field-pool');
      const reduce=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      pool.scrollBy({top:pool.clientHeight*0.78,behavior:reduce?'auto':'smooth'});
    }
    else if (action==='step'||action==='home') {
      const n=action==='home'?1:Number(value); if (!allowed(n)) return;
      view='workbench';state.step=n;log('navigate',steps[n-1]);render(true);
    } else if (action==='undo') {
      const prev=history.pop();if(!prev)return;
      Object.assign(state,prev,{direction:null,step:1});log('undo-selection',prev);render();toast('已撤销上次学科选择。');
    } else if (action==='sample') sample();
    else if (action==='study'&&ready()) {state.tab=['discussion','canvas','framework'].includes(value)?value:'evidence';state.step=5;log('open-research',state.tab);render(true);}
    else if (action==='direction') {
      if (!candidates().some(c=>c.id===value))return;
      Object.assign(state,{direction:value,step:4,scope:'season',tab:'evidence'});log('select-direction',value);render(true);
    } else if (action==='scope') { state.scope=value;log('select-scope',value);render(); $(`[data-action="scope"][data-value="${value}"]`)?.focus({preventScroll:true}); }
    else if (action==='tab') {state.tab=value;log('research-tab',value);render();$(`#research-tab-${value}`)?.focus({preventScroll:true});}
    else if (action==='filter') {state.filter=value;render();$(`[data-action="filter"][data-value="${value}"]`)?.focus({preventScroll:true});}
    else if (action==='about') showAbout();
    else if (action==='close-dialog') $('#dialog').close();
    else if (action==='export') exportRecord();
    else if (action==='reset') {
      $('#dialog').innerHTML=`<div class="dialog-head"><button class="icon-button" data-action="close-dialog" aria-label="关闭">${icon('close')}</button></div><h2 id="dialog-title">${EXAMPLE_MODE?'重新载入示例？':'开始一次新的探索？'}</h2><p>${EXAMPLE_MODE?'仅重置示例工作区中的改动，个人研究记录继续保留。':'当前学科组合、画布、文献与依据记录将重置。已有下载文件会保留。'}</p><div class="dialog-actions">${btn('继续当前探索','close-dialog','outline')}${btn(EXAMPLE_MODE?'重新载入示例':'开始新探索','confirm-reset','primary')}</div>`;$('#dialog').showModal();
    } else if (action==='confirm-reset') {$('#dialog').close();state=EXAMPLE_MODE?P.example(initial(),D,window.AtlasGraphModel,window.AtlasResearchModel):initial();view='workbench';history=[];Object.assign(explorer,{group:'all',query:'',scroll:0});revealedFields.clear();save();render(true,true);toast(EXAMPLE_MODE?'已重新载入独立示例。':'已开始新的探索。');}
  });
  document.addEventListener('change',e=>{
    if (!e.target.matches('[data-control]')) return;
    const id=e.target.dataset.control;
    state.controls=e.target.checked?[...new Set([...state.controls,id])]:state.controls.filter(c=>c!==id);
    log('validation-control',{id,selected:e.target.checked});render();$(`[data-control="${id}"]`)?.focus({preventScroll:true});
  });
  function updateSearch(e) {
    if(e.target.id!=='field-search'||e.isComposing||explorer.query===e.target.value)return;
    explorer.query=e.target.value;updatePoolView();
  }
  document.addEventListener('input',e=>{if(e.target.id==='research-note'){state.note=e.target.value;save();}else updateSearch(e);});
  document.addEventListener('compositionend',updateSearch);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&navigationOpen){e.preventDefault();setNavigation(false,true);return;}
    if(!e.target.matches('[role="tab"]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const tabs=['evidence','hypotheses','validation'],index=tabs.indexOf(state.tab);
    state.tab=tabs[e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:2))%3];save();render();$(`#tab-${state.tab}`)?.focus({preventScroll:true});
  });
  $('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=$('#dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#dialog').close();}});
  render();
})();
