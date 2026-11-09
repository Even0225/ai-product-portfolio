/* Product-design explanation of the current prototype, compiled 2026-11-07. */
(() => {
  'use strict';
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs=[['flow','业务流程'],['prototype','页面原型'],['roles','角色与取舍']];
  const validTab=value=>tabs.some(([id])=>id===value)?value:'flow';
  const routes=['disciplines','canvas','directions','question','research/evidence','research/canvas','research/plan'];
  const caseLink=(route='disciplines',from='flow')=>'index.html?case=restoration&from='+validTab(from)+'#'+(routes.includes(route)?route:'disciplines');
  const link=(label,route,tab,cls='')=>`<a class="${cls}" href="${caseLink(route,tab)}">${label}</a>`;
  const pageNames=['学科组合','初步思路','研究方向','研究问题','选文献','优化框架','深化研究'];

  function legend(tab){
    return tab==='flow'?`<div class="design-legend" aria-label="流程图图例"><span><svg viewBox="0 0 38 24" aria-hidden="true"><rect x="2" y="3" width="34" height="18" rx="9"/></svg>开始与结束</span><span><svg viewBox="0 0 38 24" aria-hidden="true"><rect x="3" y="3" width="32" height="18"/></svg>操作步骤</span><span><svg viewBox="0 0 38 24" aria-hidden="true"><path d="M19 2 36 12 19 22 2 12Z"/></svg>研究者判断</span><span><svg viewBox="0 0 38 24" aria-hidden="true"><path d="M2 12H35m-6-5 6 5-6 5"/></svg>推进或返回</span></div>`:`<div class="design-legend"><span><svg viewBox="0 0 38 24" aria-hidden="true"><rect class="legend-hotspot" x="3" y="3" width="32" height="18" rx="4"/></svg>蓝色控件可进入示例</span><span><svg viewBox="0 0 38 24" aria-hidden="true"><path d="M2 12H35m-6-5 6 5-6 5"/></svg>页面导航顺序</span></div>`;
  }

  function diagram(tab){
    const flow=tab==='flow',title=flow?'研究探索的完整路径':'七个关键页面，连成一次探索';
    const desc=flow?'初步思路是起点。阅读文献与修改框架可以反复往返，由研究者决定何时进入方案整理。':'按编号阅读页面结构，点击蓝色控件体验对应页面。图中文案为结构示意。';
    return `<section class="design-section" aria-labelledby="design-section-title"><header class="design-section-heading"><div><h2 id="design-section-title">${title}</h2><p>${desc}</p></div><a class="btn outline" href="diagrams/research-${tab}.svg" target="_blank" rel="noopener">打开 SVG 大图</a></header>${legend(tab)}<div class="design-pan-controls" aria-label="图面查看" hidden><span>在图内查看完整内容</span><button type="button" class="btn outline" data-design-pan="-1">向左查看</button><button type="button" class="btn outline" data-design-pan="1">向右查看</button></div><div class="design-diagram" data-design-scroll tabindex="0" role="region" aria-label="${flow?'科研探索业务流程图':'关键页面原型图'}，可在图内横向查看">${window.AtlasDesignAssets?.[tab]||'<p class="research-help">图面未能载入，可打开 SVG 大图查看。</p>'}</div><p class="design-caption">${flow?'矩形是操作步骤，菱形是研究者的判断；虚线连接可选的外部研讨。':'页面框表示界面结构，蓝色控件是体验热点，不在原型图里直接编辑数据。'} 图面按当前可运行原型整理于 2026-11-07。</p>${flow?`<div class="design-takeaway"><h3>文献的作用，落实在节点与说明里</h3><p>选中的论文可以成为备选、方法、创新点、综述或研究发现卡片。写明准备借鉴什么，再连接到具体想法；新的阅读和讨论可以继续改变这张图。</p>${link('体验一次“读文献 → 改框架 → 写方案”','research/canvas',tab)}</div>`:`<div class="design-page-links" aria-label="直接体验七个页面">${routes.map((route,i)=>link(String(i+1).padStart(2,'0')+' '+pageNames[i],route,tab)).join('')}</div>`}</section>`;
  }

  function roles(){
    const decisions=[
      ['先发散，再聚焦','从宏观学科交叉出发，而不是先给出一个固定题目。','基础学科与可撤销的交叉视角 → 初步思路 → 方向和研究问题。','disciplines'],
      ['把文献变成框架材料','选完文献之后，需要明确它到底用于什么。','为文献写用途、借鉴说明与原文位置，再放进画布并连接到具体节点。','research/canvas'],
      ['让探索可以往返','读过文献、与模型讨论后，还要继续修改原来的思路。','选文献与优化框架反复切换，保留研究问题、节点、备注和方案草稿。','research/evidence'],
      ['把下一步说清楚','保存完成后，仍需要知道接下来去哪里。','保存框架草稿之外，提供明确的“下一步：深化研究”，继续整理可编辑方案。','research/plan']
    ];
    return `<section class="design-section" aria-labelledby="design-section-title"><header class="design-section-heading"><div><h2 id="design-section-title">研究者保留判断，系统组织过程</h2><p>这个原型关注选题探索中的思路组织、资料使用和反复修改。它把产品流程做成可操作的界面，研究结论仍需要原始文献和实际研究支持。</p></div></header><dl class="design-brief"><div><dt>为谁设计</dt><dd>建筑、城乡规划与风景园林方向，正在探索交叉选题的研究生。</dd></div><div><dt>要解决什么</dt><dd>学科组合、读文献和画思路分散，读后修改与下一步衔接不清楚。</dd></div><div><dt>本项目中的产品工作</dt><dd>场景拆解、流程与信息架构、交互取舍，以及 AI 辅助原型实现与反馈迭代。</dd></div></dl><div class="design-role-list"><article><h3>研究者</h3><p>选择方向、阅读原文、标注文献用途，修改思路并决定下一步。</p><p class="design-role-output">留下：研究问题、借鉴说明、框架与方案。</p>${link('查看研究者的操作','research/canvas','roles')}</article><article><h3>系统</h3><p>组织候选方向、检索题录，保存图中的节点、连线、资料与版本。</p><p class="design-role-output">提供：可编辑画布、持续保存与导出。</p>${link('查看方案与保存','research/plan','roles')}</article><article><h3>外部模型（可选）</h3><p>帮助质疑关系、寻找替代解释，研究者把有用的新想法带回画布。</p><p class="design-role-output">当前：模型入口与上下文复制、下载。</p>${link('查看模型研讨入口所在页面','research/canvas','roles')}</article></div><section class="design-decisions"><h2>四个实际的产品取舍</h2>${decisions.map(([title,need,change,route])=>`<article><h3>${title}</h3><div><p class="design-decision-need">${need}</p><p>${change}</p>${link('进入对应页面',route,'roles')}</div></article>`).join('')}</section><details class="design-boundary"><summary>实现范围与当前边界</summary><p>目前是个人交互原型。学科组合与候选方向来自人工整理规则；在线文献检索使用 Crossref 题录，期刊指标保留各自年份和来源，缺失项不补造。</p><p>模型研讨暂未接入 API，提供外部入口和上下文导出。示例中的借鉴说明与研究方案是演示草稿，未被本原型实测或验证。本地保存和版本记录用于继续修改。</p><p>产品设计图是根据本轮已实现页面补充整理的展示材料（2026-11-07），不作为研究发生时的历史设计文档或上线效果证明。</p></details></section>`;
  }

  function render(tab='flow',{hasResearch=false,exampleMode=false}={}){
    tab=validTab(tab);
    return `<div class="design-page"><header class="design-intro"><div><h1 id="page-title" tabindex="-1">交点：从学科组合到研究框架</h1><p>面向空间研究的交互原型，连接文献阅读、思路修改与方案整理。</p></div><div class="design-entry-actions">${link('体验示例','disciplines',tab,'btn primary')}<button type="button" class="btn outline" data-action="enter-workbench">${exampleMode?'返回当前示例':hasResearch?'继续我的研究':'开始我的探索'}</button></div></header><nav class="design-tabs" aria-label="产品设计内容">${tabs.map(([id,label])=>`<a data-action="design" data-value="${id}" href="#design/${id}" ${tab===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav>${tab==='roles'?roles():diagram(tab)}<section class="design-guide" aria-labelledby="design-guide-title"><h2 id="design-guide-title">用两分钟体验一轮探索</h2><ol><li>${link('看学科如何组合成初步思路','canvas',tab)}<span>选择空间学科，叠加新的方法与理论视角。</span></li><li>${link('把一篇文献的方法用进框架','research/canvas',tab)}<span>修改示例用途说明、拖拽节点或添加新的想法。</span></li><li>${link('继续写研究方案','research/plan',tab)}<span>保存草稿，补写下一步，再返回画布继续推敲。</span></li></ol><p class="design-caption">示例单独保存，你已有的个人研究记录继续保留。${exampleMode?'<a href="index.html#disciplines">进入个人工作区</a>':''}</p></section></div>`;
  }

  const memoryKey='jiaodian.design.view.v1';
  function readMemory(){try{const v=JSON.parse(sessionStorage.getItem(memoryKey)||'{}');return v&&typeof v==='object'?v:{};}catch{return{};}}
  function restoreLeft(tab,saved,scrollWidth,clientWidth){
    const max=Math.max(0,scrollWidth-clientWidth);
    const centre=Number.isFinite(saved?.centre)?Math.min(1,Math.max(0,saved.centre)):.5;
    const left=tab==='flow'?centre*scrollWidth-clientWidth/2:Number.isFinite(saved?.left)?saved.left:0;
    return Math.max(0,Math.min(max,left));
  }
  function mount(root,tab,restore=false){
    tab=validTab(tab);const box=root.querySelector('.design-diagram'),buttons=[...root.querySelectorAll('[data-design-pan]')],saved=readMemory()[tab];
    let lastClient=box?.clientWidth||1,lastScroll=box?.scrollWidth||1;
    const update=()=>{const controls=root.querySelector('.design-pan-controls');if(controls)controls.hidden=!box||box.scrollWidth<=box.clientWidth+2;buttons.forEach(b=>{b.disabled=!box||(Number(b.dataset.designPan)<0?box.scrollLeft<2:box.scrollLeft+box.clientWidth>=box.scrollWidth-2);});};
    const resize=()=>{if(box){if(tab==='flow')box.scrollLeft=restoreLeft(tab,{centre:(box.scrollLeft+lastClient/2)/lastScroll},box.scrollWidth,box.clientWidth);lastClient=box.clientWidth;lastScroll=box.scrollWidth;}update();};
    const capture=()=>{try{const m=readMemory();m[tab]={left:box?.scrollLeft||0,centre:box?(box.scrollLeft+box.clientWidth/2)/box.scrollWidth:.5,top:window.scrollY||0};sessionStorage.setItem(memoryKey,JSON.stringify(m));}catch{}};
    const click=e=>{const b=e.target.closest('[data-design-pan]');if(b&&box){e.preventDefault();const reduce=window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;box.scrollBy({left:Number(b.dataset.designPan)*box.clientWidth*.75,behavior:reduce?'instant':'smooth'});}const a=e.target.closest('a');if(a?.getAttribute('href')?.includes('case=restoration'))capture();};
    root.addEventListener('click',click);box?.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',resize);window.addEventListener('pagehide',capture);
    const frame=window.requestAnimationFrame(()=>{if(box){box.scrollLeft=restoreLeft(tab,saved,box.scrollWidth,box.clientWidth);lastClient=box.clientWidth;lastScroll=box.scrollWidth;}if(restore&&Number.isFinite(saved?.top))window.scrollTo({top:Math.max(0,saved.top),behavior:'instant'});update();});
    return()=>{capture();window.cancelAnimationFrame(frame);root.removeEventListener('click',click);box?.removeEventListener('scroll',update);window.removeEventListener('resize',resize);window.removeEventListener('pagehide',capture);};
  }

  function example(state,D,G,M){
    Object.assign(state,{base:'planning',fields:['computing','psychology'],step:1,direction:'restoration',scope:'season',tab:'evidence',note:'这是独立的演示工作区，说明与方案均为示例草稿。'});
    const board=G.reconcile(null,D.bases.find(b=>b.id==='planning'),D.fields.filter(f=>state.fields.includes(f.id)));
    const idea=G.addIdea(board,{x:660,y:270});idea.title='季节会改变关联吗？';idea.note='示例待检验：视觉环境与感知恢复性的关联可能随季节变化。';
    const ctx={base:'planning',fieldIds:state.fields,core:true,combination:'城乡规划 × 计算机 × 环境心理学',directionName:'公共空间与恢复性体验',scopeName:'季节差异',question:D.scopes.find(s=>s.id==='season').question};
    const session=M.create(null,ctx,D.sources);M.chooseSource(session,session.sources.find(p=>p.id==='E01'),true);
    const result=M.applyLiterature(session,board,{sourceId:'E01',useType:'method',title:'示例：跨季节比较方法',note:'示例借鉴：参考跨季节比较的切入点。具体量表、样本与模型需查阅全文后再决定。',locator:'Abstract（目前只读公开摘要）',targetId:idea.id});
    const positions={base:[60,170],'field-computing':[360,40],'field-psychology':[360,270],[idea.id]:[660,270],[result.node.id]:[660,40]};
    for(const n of board.nodes){if(positions[n.id])[n.x,n.y]=positions[n.id];}
    G.connect(board,'field-computing',idea.id,'视觉要素的测量');G.connect(board,'field-psychology',idea.id,'感知恢复性的定义');board.view=null;
    M.startPlan(session,board);Object.assign(session.plan,{hypotheses:'示例待检验：在寒冷与非寒冷季节，视觉环境要素与居民感知恢复性的关联可能不同。',methods:'示例方案：拟结合公共空间现场图像、感知问卷与跨季节比较。文献用途卡记录了当前想借鉴的思路，样本、量表与分析模型仍需补读全文并细化。',nextSteps:'补读原文方法与量表；确认可获得的跨季节资料；根据阅读和试测结果继续调整画布。'});
    state.boards.planning=board;state.researchSessions.planning=session;return state;
  }
  window.AtlasProductDesign={tabs,validTab,caseLink,render,mount,example,restoreLeft};
})();
