const demoBase='./demos/content-production/index.html';
const researchBase='./demos/research/index.html';
const projects=[
 {id:'resume',resume:true,title:'个人简历',summary:'孙怡文 · PDF原件',subtitle:'哈尔滨工业大学城乡规划学硕士在读 · AI应用与产品实践'},
 {id:'script',demo:true,workbench:'script',title:'儿童英语剧本自动化生产工作台',summary:'五Agent · 质量评价与人工修订',subtitle:'把目标词、IP规则与内容质量要求，组织成可追溯的剧本生产流程。',goal:'面向儿童英语动画剧本生产，打通策划、生成、检查、评分、人工修订、入库与TXT交付。',contribution:'个人主导需求拆解、产品方案和核心规则，利用Codex辅助实现与联调，并与内容、产品、研发对齐验收要求。',decisions:['故事规划、剧本起草、语义门禁、质量评分组成四步主链；人工意见另进入<span style="white-space: nowrap">修订 Agent。</span>','六维26项评分提供原文证据，结合长度归一化与有效内容密度，辅助人工判断。','R0、R1、R2保留父子版本与修改意见；R1/R2未自动重跑语义门禁和评分。'],evidence:['故事设计卡与真实R0正文','六维评分及原文证据','R1/R2反馈、版本差异与TXT交付'],boundary:'案例来自实际生产记录，已做必要脱敏。评分辅助人工判断；流程可运行不等于已经完成大样本效果验证。',nodes:22,download:'CASE-S01_R2.txt'},
 {id:'book',demo:true,designOnly:true,workbench:'book',title:'儿童英语绘本生产工作台',summary:'产品设计 · 分页创作与修订方案',subtitle:'当前处于产品设计阶段，展示选词、分页创作、问题分流与修订交互方案。',goal:'完成绘本工作台的需求、流程与页面原型设计。',contribution:'负责绘本工作台的需求梳理、流程方案与页面原型。',decisions:['设计创作、语义门禁与定向修订三个Agent职责；绘本方案不启用主观六维评分。','局部问题只修改允许页，并在方案中安排后续全篇复检。','将检查通过与人工确认分别表达，避免页面状态混淆。'],evidence:['阶段选词与双词输入设计','分页中英阅读与问题定位原型','局部修改、复检与人工确认流程方案'],boundary:'本人当前完成范围为产品设计。演示文本与案例用于说明流程和交互，不作为已上线或运营效果成果。',nodes:20,download:'CASE-P01_R1.txt'},
 {id:'subtitle',title:'字幕模型选型',summary:'模型评测 · API方案选型',subtitle:'通过模型与网页/API两轮比较，交付ElevenLabs＋API调用方式的选型建议。',goal:'在儿童英语字幕审核辅助场景下，比较识别效果、处理速度与费用，确定模型和调用方式。',contribution:'负责校核规则、模型及调用方式对比、评测结果分析与选型结论交付。',decisions:['先比较火山引擎、讯飞与ElevenLabs的识别效果，形成模型建议。','再比较网页与API的效果、速度与费用，推荐API方式。','个人参与止于选型评测，后续集成、上线监测与优化未参与。'],evidence:['原始识别输出与参考字幕','网页与API的比较记录','词级JSON时间戳与校核评测产物'],boundary:'评测结果采用离线复核口径；个人参与止于模型与API方案选型结论，后续接入和监测未参与。'},
 {"id": "research", "demo": true, "title": "交点 · 跨学科研究工作台", "icon": "./demos/research/assets/jiaodian-mark.svg", "summary": "个人兴趣 · 2–3天原型尝试", "subtitle": "从城乡规划出发，探索如何把跨学科兴趣整理成具体的研究问题。个人交互原型。", "goal": "出于自己的科研兴趣，将跨学科发散、文献阅读和研究思路整理连接起来。", "contribution": "由我自主提出、自主设计，并借助AI辅助搭建个人探索原型，与公司项目无关。", "decisions": ["先从学科组合发散，再形成方向与研究问题；允许返回修改，不把探索限定为一个固定题目。", "为文献标记用途、借鉴说明和原文位置，再放入画布并连接到具体想法。", "产品设计热点进入独立示例，个人研究记录保持隔离；模型研讨当前仅提供外部入口与上下文导出。"], "evidence": ["13节点探索流程与七个页面原型", "公开文献题录、阅读边界与文献用途", "可编辑思路画布、框架版本与研究方案草稿"], "boundary": "这是我独立完成的个人探索项目。当前用一个示例展示选题与文献检索路径，后续可通过研究者试用验证这条路径是否有帮助。", "nodes": 13}
];

let current='resume',section='design',step=0,pendingFocusId=null;
const $=id=>document.getElementById(id);
const sections=[['design','设计过程'],['demo','交互演示'],['evidence','证据与复盘']];
const selectionFlow=[['识别效果比较','在相同业务材料下，比较火山引擎、讯飞与ElevenLabs的识别效果。'],['网页与API比较','比较网页与API的效果、速度和费用，明确计时与成本口径。'],['交付选型结论','识别效果支持ElevenLabs；网页/API对比支持API方式。我交付方案建议，未参与后续集成与监测。']];
function designUrl(p,tab='flow'){return p.id==='research'?`${researchBase}#design/${tab}`:`${demoBase}#design/${tab}?workbench=${p.workbench}`;}
function caseUrl(p,part=''){return p.id==='research'?`${researchBase}?case=restoration&from=prototype#${part||'disciplines'}`:`${demoBase}#${p.workbench}/${part||'selection'}`;}
function setView(id,next='design',focusId=null){
 pendingFocusId=focusId;
 const hash=`#project/${id}/${next}`;
 if(location.hash===hash)readLocation();else location.hash=hash;
}
function readLocation(){
 const match=location.hash.match(/^#project\/([^/]+)\/(design|demo|evidence)$/);
 if(match){
  const id=match[1]==='production'?'script':match[1];
  const p=projects.find(x=>x.id===id);
  if(p){current=id;section=p.resume||!p.demo&&match[2]==='demo'?'design':match[2];step=0;}
 }
 const active=document.activeElement;
 // Keep focus on a replaced tab after hash navigation; never retain a stale node.
 const focusId=pendingFocusId||(active?.matches('[role="tab"]')?(active.id.startsWith('project-')?`project-${current}`:`tab-${section}`):null);
 render();
 if(focusId){const target=$(focusId);if(target?.getAttribute('aria-selected')==='true')target.focus();}
 pendingFocusId=null;
}
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function projectTitle(p){
 const parts=p.id==='script'?['儿童英语剧本','自动化生产工作台']:p.id==='book'?['儿童英语绘本','生产工作台']:p.id==='research'?['交点 · ','跨学科研究工作台']:[p.title];
 return parts.map(x=>`<span class="project-title-part">${escapeHtml(x)}</span>`).join('<wbr>');
}
function productJourneyMarkup(p){
 const story=window.PORTFOLIO_STORIES?.[p.id];if(!story)return '';
 const targets=story.targets?`<h3>目标与验收指标</h3><ul class="target-list">${story.targets.map(([name,detail])=>`<li><strong>${escapeHtml(name)}</strong><p>${escapeHtml(detail)}</p></li>`).join('')}</ul><p class="target-note">${escapeHtml(story.targetNote)}</p>`:'';
 return `${ownershipMarkup(story)}${targets}<h3>${escapeHtml(story.journeyTitle||'产品推进过程')}</h3><ol class="product-journey">${story.phases.map(([name,role,detail,kind])=>`<li class="journey-${kind==='lead'?'lead':kind==='collab'?'collab':'context'}"><div class="journey-heading"><h4>${escapeHtml(name)}</h4><span class="journey-role">${escapeHtml(role)}</span></div><p>${escapeHtml(detail)}</p></li>`).join('')}</ol>`;
}
function ownershipMarkup(story){
 const steps=story.phases.filter(x=>x[3]==='lead'||x[3]==='collab');
 if(!steps.length)return '';
 const lead=steps.filter(x=>x[3]==='lead').length,collab=steps.length-lead;
 const leadPct=Math.round(lead/steps.length*100),collabPct=100-leadPct;
 return `<section class="ownership-summary" aria-label="职责环节分布"><h3>职责环节分布</h3><p class="ownership-range">${escapeHtml(story.ownershipScope||'已展示的执行环节')}</p><div class="ownership-bar${lead&&collab?' is-split':''}" role="img" aria-label="个人主导或负责${lead}项，占${leadPct}%；共同参与或团队协作${collab}项，占${collabPct}%">${lead?`<span class="ownership-fill-lead" style="width:${lead/steps.length*100}%">个人 ${leadPct}%</span>`:''}${collab?`<span class="ownership-fill-collab" style="width:${collab/steps.length*100}%">协作 ${collabPct}%</span>`:''}</div><ul class="ownership-legend"><li class="ownership-key-lead"><strong>个人主导／负责</strong> ${lead}项</li>${collab?`<li class="ownership-key-collab"><strong>共同参与／团队协作</strong> ${collab}项</li>`:''}</ul><p class="ownership-count-note">按${steps.length}个已展示执行环节等权计数，业务背景不计入；展示职责覆盖范围。</p></section>`;
}
function costComparisonMarkup(item){
 const cost=item.costComparison;if(!cost)return '';
 return `<section class="cost-section" aria-label="${escapeHtml(cost.title)}"><h3>${escapeHtml(cost.title)}</h3><div class="cost-comparison"><div><span class="cost-label">${escapeHtml(cost.manualLabel)}</span><strong>${escapeHtml(cost.manualValue)}</strong></div><span class="cost-arrow" aria-hidden="true">→</span><div><span class="cost-label">${escapeHtml(cost.modelLabel)}</span><strong>${escapeHtml(cost.modelValue)}</strong></div></div><p class="cost-difference"><strong>${escapeHtml(cost.difference)}</strong><br>${escapeHtml(cost.saving)}</p><p class="cost-basis">${escapeHtml(cost.basis)}<br>${escapeHtml(cost.scope)}</p></section>`;
}
function impactMarkup(p,includeRole=true){
 const item=window.PORTFOLIO_IMPACT?.[p.id];if(!item)return '';
 const role=includeRole?`<h3>我的角色与主导模块</h3><p class="ownership"><strong>${escapeHtml(item.role)}</strong></p><p class="body-copy">${escapeHtml(item.scope)}</p>`:'';
 const actions=includeRole?window.PORTFOLIO_STORIES?.[p.id]?productJourneyMarkup(p):`<h3>关键动作</h3><ul>${item.actions.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'';
 return `${role}${actions}${p.id==='script'&&includeRole?window.scoringDesignSupplement?.('brief','entry')||'':''}${costComparisonMarkup(item)}<h3>${escapeHtml(item.resultsTitle||'已验证结果')}</h3><ul class="result-list">${item.results.map(x=>`<li><strong class="result-value">${escapeHtml(x.value)}</strong><span class="result-label">${escapeHtml(x.label)}</span><p>${escapeHtml(x.detail)}</p></li>`).join('')}</ul>${item.estimates?.length?`<h3>工作量换算（估算）</h3><ul class="result-list estimate-list">${item.estimates.map(x=>`<li><strong class="result-value">${escapeHtml(x.value)}</strong><span class="result-label">${escapeHtml(x.label)}</span><p>${escapeHtml(x.detail)}</p></li>`).join('')}</ul>`:''}<p class="metric-scope" hidden>${escapeHtml(item.note)}</p><details class="metric-source" hidden><summary>指标口径与记录依据</summary><ul>${item.sources.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></details>`;
}
function summary(p){const story=window.PORTFOLIO_STORIES?.[p.id];return `<h3>${escapeHtml(story?.goalTitle||'项目目标')}</h3><p class="body-copy">${escapeHtml(story?.goal||p.goal)}</p>${story?`<p class="stage-scope"><strong>${p.id==='research'?'原型范围':'本期范围'}</strong> ${escapeHtml(story.current)}</p>`:''}${window.PORTFOLIO_IMPACT?.[p.id]?impactMarkup(p):`<h3>我的工作</h3><p class="body-copy">${p.contribution}</p>${productJourneyMarkup(p)}`}<h3>关键取舍</h3><ul>${p.decisions.map(x=>`<li>${x}</li>`).join('')}</ul>`;}
function renderResume(){
 $('case-body').innerHTML=`<p class="resume-note">以下为提供的PDF原件预览。可放大阅读，或打开原PDF查看。</p><figure class="resume-preview"><a href="./resume/index.html" aria-label="放大阅读孙怡文的简历"><img src="./resume/resume-page-1.png" alt="孙怡文个人简历，第1页，共1页：教育背景、实习经历、竞赛奖项、科研论文和专业能力。" width="1323" height="1871" decoding="async" loading="lazy"></a></figure>`;
}
function render(){
 const p=projects.find(x=>x.id===current);
 const available=p.resume?[['design','简历预览']]:p.designOnly?[['design','设计过程'],['demo','流程演示'],['evidence','设计产物']]:p.demo?sections:[['design','项目说明'],['evidence','材料与复盘']];
 $('project-list').innerHTML=projects.map(x=>`<button type="button" role="tab" id="project-${x.id}" aria-controls="case-content" class="project-choice" aria-selected="${x.id===current}" tabindex="${x.id===current?0:-1}" data-project="${x.id}"><strong>${projectTitle(x)}</strong><span>${x.summary}</span></button>`).join('');
 $('case-content').setAttribute('aria-labelledby',`project-${current}`);
 $('case-heading').innerHTML=`${p.icon?`<div class="case-brand-heading"><img class="case-product-mark" src="${escapeHtml(p.icon)}" alt="交点标志" width="44" height="44"><h2>${projectTitle(p)}</h2></div>`:`<h2>${projectTitle(p)}</h2>`}<p class="case-subtitle">${p.subtitle}</p>`;
 $('section-tabs').innerHTML=available.map(([id,label])=>`<button type="button" class="tab" role="tab" aria-selected="${id===section}" tabindex="${id===section?0:-1}" aria-controls="case-body" id="tab-${id}" data-section="${id}">${label}</button>`).join('');
 $('case-body').setAttribute('aria-labelledby',`tab-${section}`);
 $('workbench-tabs').innerHTML=p.resume?`<div class="demo-entry"><a class="primary" href="./resume/index.html">放大阅读简历</a><a class="secondary-link" href="./resume/sun-yiwen-2611.pdf" target="_blank" rel="noopener">打开原版 PDF</a><a class="secondary-link" href="./resume/sun-yiwen-2611.pdf" download="孙怡文_简历_2611.pdf">下载 PDF</a></div>`:p.demo?`<div class="demo-entry"><a class="primary" href="${designUrl(p)}">查看产品设计</a><a class="secondary-link" href="${caseUrl(p)}">${p.designOnly?'查看流程演示':'体验 Demo'} →</a></div>`:'';
 if(p.resume)renderResume();else if(p.demo)renderConnected(p);else renderSelection(p);
 $('view-status').textContent=`已显示：${p.title} · ${available.find(([id])=>id===section)[1]}`;
 bind();
}
function renderConnected(p){
 const research=p.id==='research';
 if(section==='design'){
  const description=research?'保留13节点研究流程与七个页面原型。图面热点可进入独立示例，体验学科组合、文献使用、框架修改与方案整理。':`从业务输入到人工确认与交付，保留${p.nodes}个流程节点、判断分支与修订回路。流程节点和原型热点均可进入对应真实案例。`;
  $('case-body').innerHTML=`${summary(p)}<h3>完整产品设计</h3><p class="body-copy">${description}</p><div class="resource-links"><a href="${designUrl(p)}">业务流程</a><a href="${designUrl(p,'prototype')}">页面原型</a><a href="${designUrl(p,'roles')}">角色说明</a></div>`;
 }else if(section==='demo'){
  const stops=research?[['disciplines','学科组合'],['canvas','初步思路画布'],['research/evidence','文献检索与选择'],['research/canvas','修改框架与文献用途'],['research/plan','深化研究与方案导出']]:p.workbench==='script'?[['selection','00 选词与十种策略'],['input','输入与设计卡'],['chain','Agent生产链'],['score','六维评分证据'],['revision?revision=R2','人工反馈与R1/R2'],['delivery','入库与TXT交付']]:[['selection','00 主题阶段与双词组题'],['input?draw=2&panel=snapshot','双词与输入快照'],['reader-section','分页中英正文'],['repair?panel=policy','局部补丁与全篇复检'],['delivery','人工确认与TXT交付']];
  const text=research?'从城乡规划、计算机与环境心理学的示例组合开始，体验我自主设计的文献阅读、思路画布与方案整理原型。':p.workbench==='script'?'查看目标词怎样落实到故事，展开六维评分证据，再比较R0、R1、R2的正文与人工修订。':'通过分页正文、问题定位和修订对比，查看产品设计中的流程与交互；当前停留在产品设计阶段。';
  const note=research?'示例独立保存，个人研究记录保持隔离。内置示例无需模型服务；在线题录检索需要联网。':'案例取自实际生产记录，已做必要脱敏。这里回放已有产物，不触发实际生产操作。';
  $('case-body').innerHTML=`<h3>${p.designOnly?'流程与交互演示':'交互体验'}</h3><p class="body-copy">${text}</p><div class="resource-links case-stops">${stops.map(([part,label])=>`<a href="${caseUrl(p,part)}">${label}</a>`).join('')}</div><p class="local-note">${note}</p>`;
 }else{
  const resources=research?`<a href="${designUrl(p,'roles')}">角色、取舍与实现边界</a><a href="${caseUrl(p,'research/plan')}">查看并导出研究方案</a><a href="./demos/research/diagrams/research-flow.svg" target="_blank" rel="noopener">打开流程 SVG</a><a href="./demos/research/diagrams/research-prototype.svg" target="_blank" rel="noopener">打开原型 SVG</a>`:`<a href="${demoBase}#evidence">查看项目说明</a><a href="./demos/content-production/exports/${p.download}" download="${p.download}">下载${p.designOnly?'演示文本':p.workbench==='script'?'R2剧本正文':'R1绘本正文'} TXT</a><a href="./demos/content-production/diagrams/${p.workbench}-flow.svg" target="_blank" rel="noopener">打开流程 SVG</a><a href="./demos/content-production/diagrams/${p.workbench}-prototype.svg" target="_blank" rel="noopener">打开原型 SVG</a>`;
  $('case-body').innerHTML=`${impactMarkup(p,false)}<h3>产物与依据</h3><ul class="evidence-list">${p.evidence.map(x=>`<li><strong>${x}</strong></li>`).join('')}</ul><div class="resource-links">${resources}</div><h3>阅读边界</h3><p class="body-copy">${p.boundary}</p>`;
 }
}
function renderSelection(p){
 if(section==='design'){
  $('case-body').innerHTML=`${summary(p)}<h3>选型思路</h3><p class="subline">点击查看各环节。本项目以评测与选型过程说明为主，暂无交互 Demo。</p><div class="workflow" role="group" aria-label="字幕选型环节">${selectionFlow.map((x,i)=>`${i?'<span class="arrow" aria-hidden="true">→</span>':''}<button type="button" class="step" aria-pressed="${i===step}" aria-controls="step-note" data-step="${i}">${x[0]}</button>`).join('')}</div><div class="step-note" id="step-note" role="status" aria-live="polite" aria-atomic="true"></div>`;
  renderStep();
 }else{
  $('case-body').innerHTML=`${impactMarkup(p,false)}<h3>选型依据</h3><ul class="evidence-list">${p.evidence.map(x=>`<li><strong>${x}</strong></li>`).join('')}</ul><h3>阅读边界</h3><p class="body-copy">${p.boundary}</p><p class="subline">当前展示选型过程说明，未附交互Demo。离线方案比较与随机分组的线上A/B实验分别表述。</p>`;
 }
}
function renderStep(){const item=selectionFlow[step]||selectionFlow[0];const target=$('step-note');if(target)target.innerHTML=`<strong>${item[0]}</strong>${item[1]}`;document.querySelectorAll('[data-step]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.step)===step)));}
function bind(){
 document.querySelectorAll('[data-project]').forEach(x=>x.onclick=()=>setView(x.dataset.project,'design',x.id));
 document.querySelectorAll('[data-section]').forEach(x=>x.onclick=()=>setView(current,x.dataset.section,x.id));
 bindTabKeys($('project-list'),'vertical',x=>setView(x.dataset.project,'design',x.id));
 bindTabKeys($('section-tabs'),'horizontal',x=>setView(current,x.dataset.section,x.id));
 document.querySelectorAll('[data-step]').forEach(x=>x.onclick=()=>{step=Number(x.dataset.step);renderStep();});
}
function bindTabKeys(list,orientation,activate){
 list.onkeydown=event=>{
  const tab=event.target.closest('[role="tab"]');
  if(!tab||tab.parentElement!==list||event.altKey||event.ctrlKey||event.metaKey)return;
  const tabs=[...list.querySelectorAll('[role="tab"]')];
  const index=tabs.indexOf(tab),prev=orientation==='vertical'?'ArrowUp':'ArrowLeft',next=orientation==='vertical'?'ArrowDown':'ArrowRight';
  let target;
  if(event.key===prev)target=tabs[(index-1+tabs.length)%tabs.length];
  else if(event.key===next)target=tabs[(index+1)%tabs.length];
  else if(event.key==='Home')target=tabs[0];
  else if(event.key==='End')target=tabs[tabs.length-1];
  if(target){event.preventDefault();activate(target);}
 };
}
window.addEventListener('hashchange',readLocation);
readLocation();
