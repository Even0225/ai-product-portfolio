'use strict';
function productDesignPage(tab='flow',workbench='script'){
 const E=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const book=workbench==='book';
 const name=book?'绘本工作台':'剧本工作台';
 const route=(t,w=workbench)=>`#design/${t}?workbench=${w}`;
 const tabs=[['flow','业务流程'],['prototype','页面原型'],['roles','关键角色']];
 let content='';
 if(tab==='roles'){
  const rows=book?[
   ['内容生产者','选择阶段和 IP，查看覆盖，确认双词与模型。','冻结的阶段、双词与生产任务。','#book/input?draw=2&panel=snapshot','查看输入与确认'],
   ['人工审核者','阅读分页中英正文；对需人工判断的问题作选择，确认采用与入库。','人工意见与独立的确认时间。','#book/delivery','查看人工确认'],
   ['系统编排','持久保存抽词快照，控制预算和轮次；校验补丁范围、全篇结构与目标词次数。','可追溯版本、分流结果与本地检查。','#book/repair?panel=policy','查看分流与复检'],
   ['三个 AI Agent','创作 Agent 一次输出规划和正文；门禁检查问题；修订 Agent 只改允许页。','分页文本、门禁报告、页面补丁。','#book/chain','查看 Agent 调用']
  ]:[
   ['内容生产者','选择词组、生成策略与 IP，阅读设计卡及正文。','本次任务输入与故事方向。','#script/input?panel=plan','查看设计卡'],
   ['人工审核者','结合原文和评分证据判断质量；提出修改意见，确认采用哪个版本。','人工反馈、所选版本及入库记录。','#script/revision?revision=R2','查看人工意见'],
   ['系统编排','冻结约束、编排主链；做本地校验，保存调用、父子版本与交付状态。','输入快照、版本血缘与导出记录。','#script/revision?panel=validation','查看血缘与验证'],
   ['四步主链＋修订 Agent','规划、起草、语义门禁、六维评分依次执行；人工意见另进入修订 Agent。','设计卡、R0、评分证据与 R1/R2。','#script/chain','查看 Agent 调用']
  ];
  content=`<section class="design-section"><h2>谁提出任务，谁作判断，谁执行</h2><p class="muted">角色表示业务职责，同一人可以承担生产与审核两种职责。</p><div class="roles-table-wrap"><table class="roles-table"><thead><tr><th scope="col">关键角色</th><th scope="col">主要动作</th><th scope="col">交付与记录</th><th scope="col">对应案例</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${E(r[0])}</th><td>${E(r[1])}</td><td>${E(r[2])}</td><td><a href="${r[3]}">${r[4]}</a></td></tr>`).join('')}</tbody></table></div><div class="role-boundary"><h3>人工决定采用，系统保留依据</h3><p>${book?'门禁报告明确问题和修复范围，系统据此分流；整篇检查通过后，仍由用户阅读并确认入库。':'六维评分提供可展开的原文证据，最终由用户判断和确认采用；R1/R2 保留修订关系，未自动重新进行语义门禁和评分。'}</p></div></section>`;
 }else{
  const key=(book?'book':'script')+(tab==='flow'?'Flow':'Prototype');
  const filename=(book?'book':'script')+'-'+(tab==='flow'?'flow':'prototype')+'.svg';
  const legend=tab==='flow'?`<div class="diagram-legend" aria-label="流程图图例"><span><svg width="40" height="22" aria-hidden="true"><rect x="1" y="2" width="37" height="18" rx="9"/></svg>起止</span><span><svg width="32" height="22" aria-hidden="true"><rect x="1" y="2" width="29" height="18"/></svg>操作</span><span><svg width="32" height="24" aria-hidden="true"><path d="M16 1 31 12 16 23 1 12Z"/></svg>条件判断</span><span><svg width="43" height="22" aria-hidden="true"><path d="M1 11H39M33 6 39 11 33 16"/></svg>流程方向</span></div>`:`<div class="diagram-legend"><span><svg width="35" height="24" aria-hidden="true"><rect x="1" y="2" width="32" height="20" class="legend-hotspot"/></svg>可点击页面或控件</span><span><svg width="43" height="22" aria-hidden="true"><path d="M1 11H39M33 6 39 11 33 16"/></svg>页面跳转</span><span><svg width="43" height="22" aria-hidden="true"><path d="M1 17H22V5H41" stroke-dasharray="4 3"/></svg>说明引线，无箭头</span></div>`;
  content=`<section class="design-section"><div class="design-section-header"><div><h2>${name}${tab==='flow'?'业务流程':'关键页面原型'}</h2><p class="muted">${tab==='flow'?'从上到下查看完整业务流程，修订与异常处理在侧边展开；点击节点打开对应案例。':'按页面编号阅读任务路径，点击蓝色描边控件打开对应案例。虚线只连接注释与所说明的界面。'}</p></div><a class="button ghost" href="diagrams/${filename}" target="_blank" rel="noopener">打开 SVG 大图</a></div>${legend}<div class="diagram-scroll" tabindex="0" role="region" aria-label="${name}${tab==='flow'?'流程图':'原型图'}，窄屏可横向滚动">${window.PRODUCT_DESIGN_ASSETS[key]}</div><div class="diagram-controls" aria-label="图面浏览"><span>图面可横向查看</span><button type="button" class="secondary" data-action="diagram-pan" data-value="-1" disabled>向左查看</button><button type="button" class="secondary" data-action="diagram-pan" data-value="1">向右查看</button></div><p class="diagram-caption">${tab==='flow'?'矩形表示操作步骤，菱形表示业务判断；节点小字标明执行角色。':'页面框表示界面；其中的圆角按钮与输入区采用界面控件语义，不作为业务流程节点。'} 窄屏可横向查看图面。</p>${tab==='flow'?`<p class="flow-rules">${book?'抽词时冻结快照，确认采用后绑定 IP。自动修订仅限局部问题且轮数、预算允许，最多 2 轮；需改变故事核心时建议作废重写。补丁合规后全篇复检，通过后的可选建议不触发自动改稿。':'设计卡完整且与冻结输入一致，才交接起草；正文先过本地硬校验，再进入语义门禁，通过后评分。未通过时保留问题并停止后续步骤，图中回路须经人工确认恢复。R1 / R2 保留父子版本与反馈，未自动重跑语义门禁和评分。'}</p>`:''}<div class="design-takeaway"><h3>${book?'绘本的重点：问题分流与全篇复检':'剧本的重点：质量依据与人工修订'}</h3><p>${book?'三个 Agent 完成创作、门禁与按需修订。修订只改允许页，之后重检整篇；人工入库保留独立的确认记录。':'规划交接、正文硬校验和语义门禁分别把关；本案例评分供人工阅稿参考。需要修改时提交具体意见，保留版本差异，确认采用后再入库。'}</p><a href="${book?'#book/repair':'#script/revision?revision=R2'}">${book?'看一次三页修订与复检':'看一次人工意见如何落到改动'}</a></div></section>`;
 }
 return `<div class="product-design ${book?'design-book':''}"><div class="intro design-intro"><h1>从业务输入，到可控交付。</h1><p>用业务流程、页面原型和关键角色，说明两套工作台如何组织内容生产。点击节点即可进入真实案例。</p></div><nav class="design-tabs" aria-label="产品设计内容">${tabs.map(([v,label])=>`<a href="${route(v)}" ${tab===v?'aria-current="page"':''}>${label}</a>`).join('')}</nav><div class="design-workbench"><nav aria-label="选择产品设计工作台"><a href="${route(tab,'script')}" ${!book?'aria-current="page"':''}>剧本工作台</a><a href="${route(tab,'book')}" ${book?'aria-current="page"':''}>绘本工作台</a></nav><a class="design-case-link" href="${book?'#book':'#script'}">进入${name}案例</a></div>${content}<div class="design-bottom"><a href="#overview">查看项目总览与两条真实案例</a><a href="#guide">查看 3 分钟演示顺序</a></div></div>`;
}
