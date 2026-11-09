'use strict';
const D = window.EXHIBIT_DATA;
const main = document.querySelector('#main');
const dialog = document.querySelector('#detail-dialog');
const state = {scriptVersion:'R0', dimension:0, revision:0, bookVersion:'R1', page:1, stage:0, draw:0,designReturn:'#design/flow?workbench=script',designScroll:0,designCanvasX:0,activePage:null};
const h = value => String(value ?? '未记录').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => `<pre>${h(JSON.stringify(value,null,2))}</pre>`;
const badge = (text,kind='neutral') => `<span class="badge ${kind}">${h(text)}</span>`;
const date = value => value ? new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(value)) : '未记录';
const usd = value => value == null ? '未记录' : `USD ${value}`;
const details = (label,body) => `<details><summary>${label}</summary><div>${body}</div></details>`;
const title = (no,text,id) => `<div class="chapter-title"><h2 id="${id}-heading"><span class="step-no">${no}</span>${text}</h2></div>`;
function highlight(text,words){
  let result=h(text);
  for(const word of words){
    const escaped=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    result=result.replace(new RegExp(`\\b(${escaped})\\b`,'gi'),'<mark>$1</mark>');
  }
  return result;
}
function facts(rows){return `<dl class="fact-list">${rows.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`;}
function overview(){
  const s=D.script,b=D.book;
  return `<div class="intro"><h1>让词汇进入故事，<br>让生产有据可查。</h1><p>儿童英语内容生产，既要遵循词义、角色与适龄约束，也要留下可解释的质量判断。这里用两条真实生产记录，展示不同任务下的流程取舍。</p><div class="badges">${badge('真实历史案例回放','green')}${badge('约 3 分钟了解项目')}${badge('可展开原文与证据')}</div></div>
  <div class="exhibits">
    <article class="exhibit"><div class="exhibit-head"><h2><a href="#script">剧本工作台</a></h2>${badge('评价与人工修订')}</div><p class="description">目标词落实到故事，六维评价支持人工判断；修订保留反馈与父子版本。</p><div class="preview"><div class="manuscript"><small>R0 正文节选 · ${h(s.title)}</small><h3>场景一 · 小院花径</h3><p>角色B指着花盆数数，角色A举起醋瓶。</p><p class="latin">I have <mark>vinegar</mark> for our picnic.</p><p class="latin">One, two, <mark>seven</mark> flower pots here.</p></div><div class="proof-stamp">R0 → R1 → R2 · 已有真实意见</div></div><p class="pathline">故事规划 → 剧本起草 → 语义门禁 → 质量评分<br>人工意见进入独立修订分支</p><a class="button" href="#script">进入剧本案例</a></article>
    <article class="exhibit"><div class="exhibit-head"><h2><a href="#book">绘本工作台</a></h2>${badge('生产与检查闭环','green')}</div><p class="description">按阶段管理词汇覆盖，一次生成分页中英文本；只修问题页，再检查整篇。</p><div class="preview book-preview"><div class="book-leaf"><small>第 3 页 · R0</small><p>爸爸找出漏勺，当作宇航员的头盔。</p><p class="latin">Dad says,</p>${badge('关键动作遗漏','yellow')}</div><div class="book-leaf"><small>第 3 页 · R1</small><p class="latin">Dad searches the kitchen and finds a big colander.</p><p class="latin">“A helmet for the <mark>astronaut</mark>!”</p><small>修订后全篇复检 PASS</small></div></div><p class="pathline">绘本创作 → 语义门禁 → 按需定向修订<br>修订后：局部补丁校验 ＋ 全篇复检</p><a class="button green" href="#book">进入绘本案例</a></article>
  </div>
  <div class="principles"><h2>相同的方法，<br>不同的生产判断。</h2><div><p>先冻结输入，再保存过程与产物；把模型检查、人工选择与最终交付分开记录。剧本保留独立的规划与评分；绘本合并规划起草，关闭评分，围绕明确问题决定局部修订或人工介入。</p><p>现有资料可核实流程、规则与实现。</p><a href="#evidence">查看流程设计与案例交付</a></div></div><div class="link-row"><a href="#guide">按 3 分钟演示顺序浏览</a></div>`;
}
function scriptHead(){
 const s=D.script;
 return `<a class="design-back" href="${h(state.designReturn)}">返回产品设计</a><div class="case-head"><div><div class="badges">${badge('剧本工作台')}${badge('CASE-S01','neutral')}${badge('AI生成 · 角色已匿名化')}${badge('历史 R2 已入库','green')}</div><h1>${h(s.title)}</h1><p>vinegar ＋ seven ／ 已配置 IP 约束 ／ ${date(s.date)}（上海时间）</p></div><label>回放案例<select id="script-case" aria-label="选择剧本案例"><option value="CASE-S01">CASE-S01 · ${h(s.title)}</option></select></label></div>
 <nav class="subnav" aria-label="剧本案例目录"><a href="#script/selection">00 选词与组题</a><a href="#script/input">01 业务输入</a><a href="#script/chain">02 生产链</a><a href="#script/score">03 正文与评分</a><a href="#script/revision">04 人工修订</a><a href="#script/delivery">05 交付与证据</a></nav>`;
}
function renderScriptBody(){
 const c=D.script.versions[state.scriptVersion];
 return `<div class="toolbar"><div class="segmented" aria-label="正文版本">${['R0','R1','R2'].map(v=>`<button data-action="script-version" data-value="${v}" aria-pressed="${state.scriptVersion===v}">${v} 正文</button>`).join('')}</div>${badge(state.scriptVersion==='R0'?'R0 为评分对应原文':'该修订版未重跑语义门禁及评分',state.scriptVersion==='R0'?'neutral':'yellow')}</div>${c.scenes.map(s=>`<article class="script-scene"><h3>${h(s.scene_id)} · ${h(s.scene_name_zh)}</h3><p class="scene-overview">${h(s.visual_overview_zh)}</p>${s.beats.map(b=>`<div class="beat" id="beat-${h(b.beat_id)}"><span class="beat-id">${h(b.beat_id)}</span><div><p class="beat-action">${h(b.visual_action_zh)}</p>${b.lines.map(l=>`<div class="dialogue"><span class="speaker">${h(l.speaker_name_zh || l.line_type)}</span><div><p class="en" lang="en">${highlight(l.text_en || '', ['vinegar','seven'])}</p><p class="zh">${h(l.text_zh || '')}</p></div></div>`).join('')}</div></div>`).join('')}</article>`).join('')}`;
}
function scoreBody(){
 const d=D.script.dimensions[state.dimension];
 return `<h3>${h(d.name)} <span class="muted">${d.score} / ${d.maximum}</span></h3><p class="small muted">以下均为 R0 的模型评分记录。原文片段与说明按当时结果保留。</p>${d.items.map(i=>`<div class="score-item"><h3>${h(i.id)} ${h(i.name)} <span class="badge neutral">${i.score} 分</span></h3>${i.evidence.length?i.evidence.map(e=>`<div class="evidence-quote" lang="en">${highlight(e['原文片段'],['vinegar','seven'])}</div><p>${h(e['得分原因说明'])}</p><p class="small">${h(e['主要镜头'])} ／ ${h(e['证据ID'])} ／ 本条计 ${e['对应得分']} 分</p>${details('查看动作原文与定位',`<p>${h(e['动作_画面_情绪证据'])}</p><a href="#script/score" data-action="locate-beat" data-value="${h(e['主要镜头'])}">在 R0 正文中定位 ${h(e['主要镜头'])}</a>`)}`).join(''):`<p>该项得分为 ${i.score}；记录未提供正向计分证据，不补写评分理由。</p>`}</div>`).join('')}`;
}
function revisionBody(){
 const r=D.script.revisions[state.revision];
 const changes=r.changes.filter(x=>!x.path.includes('metrics')&&!x.path.includes('revision'));
 return `<h3>${h(r.parent)} → ${h(r.revision)}</h3><p class="small muted">提交 ${date(r.started_at)} · 完成 ${date(r.completed_at)}</p><blockquote>${h(r.feedback)}</blockquote><p class="small muted">修订模型 ${h(r.receipt.model)} ／ Prompt ${h(r.receipt.prompt_version)} ／ 模型调用 ${(r.receipt.latency_ms/1000).toFixed(3)} 秒 ／ ${usd(r.receipt.cost.amount)}</p><div class="badges">${badge('修订已保存','green')}${badge('语义门禁 NOT_RUN','yellow')}${badge('质量评分 NOT_RUN','yellow')}</div><p class="small">人工反馈驱动修改，保留原版本及血缘。R0 的 79 分仅是历史参考，不是 ${h(r.revision)} 的分数。</p>${changes.map(c=>`<p class="diff-path">${h(c.path)}</p><div class="diff"><div><p class="diff-label">修改前 · ${h(r.parent)}</p><div class="diff-cell">${h(c.before)}</div></div><div><p class="diff-label">修改后 · ${h(r.revision)}</p><div class="diff-cell after">${h(c.after)}</div></div></div>`).join('')}${details('展开本次验证与血缘摘要',json({semantic:r.semantic,scoring:r.scoring,lineage:r.lineage}))}`;
}
function script(){
 const s=D.script;
 return `${scriptHead()}<section class="chapter" id="selection">${title('00','从词汇分组，到故事任务','selection')}${window.selectionPrimer('script')}</section>
 <section class="chapter" id="input">${title('01','先把词义与角色边界冻结','input')}<div class="two-col"><div class="panel"><h3>这次要生成什么</h3><div class="input-words">${s.targets.map(w=>`<div class="word"><strong>${h(w.word)}</strong><span>${h(w.meaning)} ／ ${h(w.id)} 位</span></div>`).join('')}</div>${facts([['选词方式','RANDOM（本次冻结结果）'],['生成策略','AB 双词组合'],['IP约束','已配置，具体名称与设定不展示'],['学习目标',h(s.versions.R0.objective)]])}</div><div class="panel"><h3>词汇如何成为情节</h3><p class="small">${h(s.plan.core_problem)}</p>${s.plan.target_arc_plan.map(a=>`<h3>${a.word_id==='W0908'?'vinegar':'seven'}</h3><div class="arc-grid">${[['铺垫',a.setup],['发展',a.development],['兑现',a.payoff]].map(([a,b])=>`<div><h3>${a}</h3><p>${h(b)}</p></div>`).join('')}</div>`).join('')}${details('查看完整故事设计卡',facts([['角色目标',h(s.plan.character_goal)],['触发事件',h(s.plan.inciting_event)],['解决机制',h(s.plan.resolution_mechanism)]])+`<ol>${s.plan.story_beats.map(beat=>`<li>${h(beat)}</li>`).join('')}</ol>`)}</div></div></section>
 <section class="chapter" id="chain">${title('02','四步主链，人工意见另走分支','chain')}<div class="flow">${['故事规划','剧本起草','语义门禁','质量评分'].map((n,i)=>`<button data-action="script-node" data-value="${i}"><span class="node-number">0${i+1}</span>${n}<small>查看本步条件与结果</small></button>`).join('')}</div><details id="script-stop-policy"><summary>主链停止与恢复规则</summary><div><ul><li><b>01 规划未完成：</b>缺少设计卡必要内容，或目标词、策略、角色范围与冻结输入不符时，不进入起草；保留问题，人工确认恢复后重做规划。</li><li><b>02 起草硬校验失败：</b>结构、词数、目标词复现、未分配词或角色范围不合要求时，不进入语义门禁；确认恢复后修正起草。</li><li><b>03 语义未通过：</b>词义、故事、角色表现或儿童安全需处理时，停止评分并保留原因。先由人工确认修复方案；正文问题定位到起草，涉及规划调整时先重新确认设计卡。</li><li><b>调用或返回格式失败：</b>停在对应阶段，按该次任务允许的次数处理；已有产物可复用时先核对，避免重复生成。技术重试与内容修订分别记录。</li></ul><p>未执行的后续步骤不展示为通过；本地校验未通过的修订响应不作为新版本。本案例 R1、R2 来自人工意见，未自动重跑语义门禁或评分。</p><a href="#script/delivery?panel=failure">查看独立工程样例的失败定位与真实停止位置</a></div></details><div class="branch">05 人工意见 → 定向修订 → 保存 R1 / R2　<a href="#script/revision">查看真实修订分支</a></div><p class="small muted" style="margin-top:15px">R0 主链共 ${s.cost.call_count} 次调用，记录费用 ${usd(s.cost.cost_amount)}。修订调用与费用不包含在这个 R0 数字内。</p></section>
 <section class="chapter" id="score">${title('03','先读正文，再看评分依据','score')}<div class="panel"><p>${h(s.versions.R0.logline)}</p><details class="script-text" id="script-text"><summary>展开完整剧本 · R0 / R1 / R2</summary><div id="script-body">${renderScriptBody()}</div></details>${details('查看 R0 六维评分与 26 个子项',`<div class="notice">六维原始分合计为 <strong>53</strong>；最终排序分为 <strong>79</strong>，经过长度归一化与校准，两者不能混作同一口径。本案例评分仅作参考，不按分数高低阻断交付。</div><div class="score-key"><div><strong>${s.score.raw_evidence_score}</strong><small>R0 原始证据分 / 100</small></div><div><strong>${s.score.final_ranking_score}</strong><small>R0 最终排序分 / 100</small></div><div><strong>26</strong><small>真实评分子项</small></div></div><div class="score-layout"><div class="score-buttons" aria-label="六维评分">${s.dimensions.map((d,i)=>`<button data-action="dimension" data-value="${i}" aria-pressed="${state.dimension===i}"><span class="score-row"><span>${h(d.name)}</span><span>${d.score}/${d.maximum}</span></span><span class="meter"><span style="width:${d.score/d.maximum*100}%"></span></span></button>`).join('')}</div><div id="score-evidence">${scoreBody()}</div></div>${details('查看量表、排序规则及长度处理',`<p>评分规则版本 ${h(s.rules.score_rule_version)}。本稿 Canonical 长度标签为 LONG；按实际 6 个镜头归入 STANDARD 评分桶。保留当时记录，不改写历史标签。</p><p>${h(s.ranking_rule)}</p><p>单篇回放不展示相对百分位评级。</p>${json(s.score)}`)}`)}</div></section>
 <section class="chapter" id="revision">${title('04','让人工意见落到真实改动','revision')}<div class="panel revision-layout"><div class="revision-tabs">${s.revisions.map((r,i)=>`<button data-action="revision" data-value="${i}" aria-pressed="${state.revision===i}">${r.parent} → ${r.revision}<small>${i?'增加结尾趣味动作':'细化场景环境'}</small></button>`).join('')}</div><div id="revision-body">${revisionBody()}</div></div></section>
 <section class="chapter" id="delivery">${title('05','确认交付，也保留失败的停止位置','delivery')}<div class="two-col"><div class="panel"><h3>这条案例实际走到了哪里</h3><ul class="timeline"><li>R0 主链完成<small>有独立门禁、评分与完整正文</small></li><li>人工意见产生 R1、R2<small>两个版本均未重跑语义门禁及评分</small></li><li>R2 人工入库<small>${date(s.library[0].stored_at)}</small></li><li>历史 TXT 导出<small>${date(s.exports[0].exported_at)} · ${s.exports[0].story_count} 篇</small></li></ul><a class="button" href="exports/CASE-S01_R2.txt" download="CASE-S01_R2_剧本展示副本.txt">下载 R2 展示版 TXT</a><p class="small muted">按实际 R2 正文重新排版。浏览和下载不会重复入库。</p></div><div class="panel"><h3>另一个任务：误拦截修好后，仍需如实停止</h3><p class="small">独立工程案例 ENGINEERING-S02，与上述成功回放分别记录。</p>${details('现象 → 定位 → 修改 → 复测',`<p><b>现象：</b>已声明角色的动作短语被本地 IP 规则误当成新角色，起草后停止。</p><p><b>定位：</b>原任务动作字段和最小对照实验确认误报。</p><p><b>修改：</b>v22 将连续动作归回已声明主语，保留独立角色、亲属关系与在场检查；增加审计绑定的已保存正文复验。</p><p><b>离线复测：</b>${s.failure.tests} 项封存工程测试通过；测试集合有重叠，不与其他批次相加。</p><p><b>真实复测：</b>重放后发现对白仅 55 词，未达 65 词下限；一次获授权的修正请求收到 HTTP 429。没有正式 R0、入库或导出，实际调用费用仍未知。没有把工程修复说成整条生产链通过。</p>${json(s.failure.actual)}`)}</div></div><div class="link-row"><a class="button green" href="#book">继续看绘本工作台</a><a class="button ghost" href="#overview">返回总览</a></div></section>`;
}
function coverage(){
 const s=D.book.stages[state.stage];
 return `<h3>阶段 ${s.stage_no} · ${h(s.name)}</h3><p class="small muted">${h(s.description)}</p><div class="coverage-summary"><span><strong>${s.total}</strong>词</span><span><strong>${s.covered}</strong>词抽中 ≥3 次</span><span><strong>${s.draws}</strong>次抽取</span><span><strong>${s.confirmed}</strong>个已确认双词任务</span></div>${state.stage!==0?'<div class="notice">本次案例属于第一阶段。此处仅查看其他阶段的真实覆盖快照，不切换或新建生产案例。</div>':''}${details('查看覆盖统计口径','<p>仅展示阶段汇总与本次双词样例，不公开完整词表。抽词覆盖、检查通过和人工入库分别统计。</p>')}`;
}
function drawBody(){
 const b=D.book;
 const labels=['打开冻结双词','查看已发生的计数变化','查看当时确认结果'];
 return `<div class="draw-replay">${labels.map((t,i)=>`<button data-action="draw" data-value="${i}" aria-pressed="${state.draw===i}">${t}</button>`).join('')}</div><div class="input-words">${b.selection.words.map((w,i)=>`<div class="word"><strong>${h(w.word)}</strong><span>${h(w.teaching_meaning)} · ${i?'非实意词':'实意词'}</span>${state.draw>0?`<p class="small" style="margin:8px 0 0">历史抽中次数 ${w.count_before} → ${w.count_after}</p>`:''}</div>`).join('')}</div><p class="small">${state.draw===0?'第一词义与认可词形已冻结，当前操作仅打开展示副本。':state.draw===1?'这次真实抽取保存时，两词次数各增加 1；重新抽取会形成新抽取记录并计数，选择阶段和确认不重复增加。':'当时确认时间：'+date(b.selection.confirmed_at)+'。确认绑定该快照，未再次抽词。'}</p>${details('查看冻结词形与任务摘要',json({case:'CASE-P01',stage:b.selection.stage_id,rule:b.selection.rules_version,created_at:b.selection.created_at,targets:b.targets}))}`;
}
function bookReader(){
 const v=D.book.versions.find(v=>v.revision===state.bookVersion), p=v.script.pages[state.page-1];
 const words=D.book.targets.flatMap(t=>t.accepted_forms);
 return `<div class="reader-top"><strong>${h(v.script.title_zh)}</strong>${badge(state.bookVersion==='R1'?'R1 全篇复检 PASS':'R0 门禁 BLOCK',state.bookVersion==='R1'?'green':'yellow')}</div><div class="reader-page"><span class="page-number">第 ${state.page} 页 / ${v.script.pages.length}</span><p class="en" lang="en">${highlight(p.en,words)}</p><p class="zh">${h(p.zh)}</p></div><div class="reader-bottom"><button data-action="page" data-value="${state.page-1}" ${state.page===1?'disabled':''}>上一页</button><div class="page-dots" aria-label="绘本页码">${v.script.pages.map((p,i)=>`<button data-action="page" data-value="${i+1}" aria-label="第 ${i+1} 页" ${state.page===i+1?'aria-current="page"':''}>${i+1}</button>`).join('')}</div><button data-action="page" data-value="${state.page+1}" ${state.page===v.script.pages.length?'disabled':''}>下一页</button></div>`;
}
function patchBody(){
 const b=D.book, before=b.versions[0].script.pages;
 return b.patches.map(p=>`<p class="diff-path">第 ${p.page_number} 页 · 仅英文有改动</p><div class="diff"><div><p class="diff-label">R0 问题原文</p><div class="diff-cell" lang="en">${h(before.find(x=>x.page_number===p.page_number).en)}</div></div><div><p class="diff-label">R1 接受的局部补丁</p><div class="diff-cell after" lang="en">${highlight(p.en,b.targets.flatMap(t=>t.accepted_forms))}</div></div></div>`).join('');
}
function book(){
 const b=D.book,issue=b.versions[0].gate_result.issues[0], usage=b.versions[1].target_usage_report;
 return `<div class="book-theme"><a class="design-back" href="${h(state.designReturn)}">返回产品设计</a><div class="case-head"><div><div class="badges">${badge('绘本工作台','green')}${badge('CASE-P01')}${badge('AI生成 · 角色已匿名化')}${badge('R1 全篇复检通过','green')}</div><h1>${h(b.title)}</h1><p>astronaut ＋ helpful ／ 已配置 IP 约束 ／ 8 页中英文本</p></div><label>回放案例<select id="book-case" aria-label="选择绘本案例"><option value="CASE-P01">CASE-P01 · ${h(b.title)}</option></select></label></div><nav class="subnav" aria-label="绘本案例目录"><a href="#book/selection">00 选词与主题</a><a href="#book/input">01 阶段与双词</a><a href="#book/chain">02 创作与检验</a><a href="#book/reader-section">03 逐页正文</a><a href="#book/repair">04 修订与复检</a><a href="#book/delivery">05 故事库</a></nav>
 <section class="chapter" id="selection">${title('00','从待生产词，到主题双词','selection')}${window.selectionPrimer('book')}</section>
 <section class="chapter" id="input">${title('01','先管理覆盖，再冻结本次输入','input')}<div class="panel"><div class="stage-tabs" aria-label="查看阶段覆盖">${b.stages.map((s,i)=>`<button data-action="stage" data-value="${i}" aria-pressed="${state.stage===i}">阶段 ${s.stage_no}${i===0?' · 案例所属':''}</button>`).join('')}</div><div id="coverage">${coverage()}</div></div><div class="panel" style="margin-top:24px"><h3>回看这一次抽词与确认</h3><div id="draw-body">${drawBody()}</div><p class="small muted">以上按钮回放已有状态；没有接入正式抽词或确认接口。</p></div></section>
 <section class="chapter" id="chain">${title('02','三个 Agent，把检查闭环做完整','chain')}<p class="section-note">规划与起草合并输出 story_plan＋script，评分 Agent 关闭；根据明确问题的修复范围分流。</p><div class="flow book-flow">${['绘本创作','R0 语义门禁','定向修订','R1 全篇复检'].map((x,i)=>`<button data-action="book-node" data-value="${i}"><span class="node-number">${['01','02','03','02 ↻'][i]}</span>${x}<small>${['8 页正文已保存','BLOCK · 三页缺失内容','接受第 2 / 3 / 8 页补丁','PASS · 整篇再检查'][i]}</small></button>`).join('')}</div><p class="small muted" style="margin-top:15px">最后一步复用语义门禁 Agent。该任务共 4 次调用、${usd(b.cost.actual_usd)}，未知费用调用 ${b.cost.unknown_cost_calls} 次。修订 1 轮，未达最多 2 轮上限。</p>${details('查看本次创作输入摘要',`<p>阶段：生活任务与职业体验；目标词：astronaut、helpful；IP约束：已配置，具体设定不展示。创作模型：${h(b.models.STORY_CREATION)}。</p>`)}${details('为什么采用不同流程：规则与实现依据',`<p>当前实现把简短规划和分页正文合并创作；以词义、复现次数、IP、双语与儿童安全检查决定问题分流。没有六维评分，也不按主观分数触发修订。</p><p>明确局部文字问题可修问题页；缺少资料、关键疑点转人工；需要推翻故事核心时建议作废重写。归纳来自现行规则，不把未记录的动机写作已证实的个人决策。</p>`)}</section>
 <section class="chapter" id="reader-section">${title('03','翻页读正文，也能直接定位问题','reader-section')}<div class="toolbar"><div class="segmented" aria-label="绘本正文版本">${['R0','R1'].map(v=>`<button data-action="book-version" data-value="${v}" aria-pressed="${state.bookVersion===v}">${v} 正文</button>`).join('')}</div><span class="small muted">目标词及认可词形已标亮</span></div><div class="reading-layout"><div class="reader" id="book-reader">${bookReader()}</div><aside class="issue"><div class="badges">${badge('R0 真实门禁问题','yellow')}${badge('ERROR / LOCAL_TEXT')}</div><h3>缺失对白，也遗漏了头盔的来源</h3><p>${h(issue.problem)}</p><div>${issue.pages.map(p=>`<button data-action="issue-page" data-value="${p}">定位第 ${p} 页</button>`).join('')}</div>${details('展开门禁原文证据',`<p>${h(issue.evidence)}</p><p>${h(issue.suggested_fix)}</p>`)}<a href="#book/repair">查看这条问题如何修复</a></aside></div></section>
 <section class="chapter" id="repair">${title('04','修好问题页，还要检查整篇','repair')}<div class="panel"><h3>允许改第 2、3、8 页，其他页保留</h3><p class="small muted">R0 当时按旧规则转人工。随后获得该篇修订授权，并迁移到 PB-DISPOSITION-1.1：依据问题性质与修复范围判断，不再把页数多当作自动转人工的门槛。</p>${patchBody()}<div class="notice">局部补丁被接受后，R1 重新执行整篇结构、目标词次数与语义检查。最终门禁为 PASS；不是仅凭补丁成功就宣布全篇通过。</div><div class="two-col"><div><h3>本地整篇复检</h3>${facts([['保留范围','全部中文、其余页英文未变化'],['astronaut',`${usage.targets[0].count} 次，页 ${usage.targets[0].matches.map(x=>x.page_number).join(' / ')}`],['helpful',`${usage.targets[1].count} 次，页 ${usage.targets[1].matches.map(x=>x.page_number).join(' / ')}`],['统计范围','只计英文正文页；每词至少 2 次']])}</div><div><h3>新的语义门禁</h3>${badge('R1 · PASS','green')}<p class="small" style="margin-top:14px">${h(b.versions[1].gate_result.summary)}</p><p class="small muted">剩余必修问题 ${b.versions[1].gate_result.issues.length}；本次自动修订停止于检查通过。</p></div></div>${details('查看问题分流与修订规则',`<p>现行 PB-DISPOSITION-1.1：通过保留；ERROR / LOCAL_TEXT 且页码有效、无需 IP/儿童安全人工判断时局部修订；INPUT_REQUIRED 转人工；STORY_CORE 建议作废重写。最多 2 轮，每轮后全篇复检；单篇预算沿用 6 次请求和 USD 0.50。</p><p>本案例实际发生的是：转人工 → 获授权迁移规则 → 局部修订 → 整篇复检通过。作废重写等其他分支仅为规则说明。</p>`)}</div></section>
 <section class="chapter" id="delivery">${title('05','检查通过与人工入库，分开记录','delivery')}<div class="two-col"><div class="panel"><h3>故事库 · ${h(b.title)}</h3><p class="small muted">The Little Astronaut ／ R1 ／ 8 页</p><div class="badges">${badge('全篇检查 PASS','green')}${badge(b.approved?'已人工确认入库':'待人工确认',b.approved?'green':'yellow')}</div>${facts([['历史验收','2026-11-06：待人工确认'],['最新确认',date(b.stored_at)],['当前快照',date(D.snapshot_at)],['展示产物','分页中英文本；不包含插画、音频或动画']])}<div class="link-row"><a class="button green" href="exports/CASE-P01_R1.txt" download="CASE-P01_R1_绘本展示副本.txt">下载 R1 展示版 TXT</a></div></div><div class="panel"><h3>完整生产时间线</h3><ul class="timeline">${b.events.map(e=>`<li>${h(e.detail)}<small>${date(e.created_at)} ／ ${h(e.phase)}</small></li>`).join('')}</ul>${details('分清三类计数',`<p>抽中次数来自选词账本；检查通过篇数来自生产结果；人工确认入库来自 stored_at 与事件。三者不互相替代。</p><p>当前整库快照：生产记录 ${b.library_stats.runs} 条，COMPLETE ${b.library_stats.passed} 条，有人工入库时间 ${b.library_stats.approved} 条。此处只是该时点的账本统计，不计算生产成功率。</p>`)}</div></div><div class="link-row"><a class="button" href="#script">切换剧本工作台</a><a class="button ghost" href="#overview">返回总览</a></div></section></div>`;
}
function evidence(){
 return `<div class="intro"><h1>结果可以点开，<br>判断可以回查。</h1><p>了解两套工作台的设计取舍、实现方式与案例交付。</p></div><div class="two-col"><div class="panel"><h2>产品设计与流程取舍</h2><div class="limits"><div><h3>把业务约束变成输入契约</h3><p>词库身份、词义词形、IP 与任务上下文冻结，避免生成过程中漂移。剧本设计卡与绘本任务快照体现不同输入组织方式。</p></div><div><h3>为两类产物选择不同检查链</h3><p>剧本保留六维证据供人工判断，修订独立成分支；绘本关闭评分，围绕明确问题实施页面补丁和全篇复检。</p></div><div><h3>保留停止位置与版本关系</h3><p>持久记录反馈、父子版本、失败分类、费用与未知费用。工程测试、内容门禁和人工入库分别表达。</p></div></div></div><div class="panel"><h2>运行方式与案例交付</h2><div class="limits"><div><h3>共用底座，隔离运行</h3><p>绘本目录复制保留了既有五端口基线，当前通过独立适配器、队列与运行数据库执行三个端口。保留的旧资料不等同于绘本当前生效流程。</p></div><div><h3>生产案例回放</h3><p>通过脱敏案例回看输入、模型调用记录、版本差异与入库状态，并下载案例正文 TXT。</p></div></div></div></div>`;
}
function guide(){return `<div class="intro"><h1>用 3 分钟，<br>走过两条真实生产链。</h1><p>按这个顺序介绍：先讲业务问题，再点开关键产物，最后说明验证边界。深入提问时，再展开评分子项、补丁与节点证据。</p></div><div class="panel">${[
 ['0:00','先看业务流程与角色分工','先看业务流程、页面原型和角色分工；两工作台的选词说明位于各自 00 开篇。','#design','产品设计'],
 ['0:25','剧本：从选词进入故事','先看 00 的分类、四词与十策略，再进入 01 设计卡和生产节点。','#script/selection','业务输入与生产链'],
 ['0:55','剧本：评分是证据，修订听取人工意见','展开六维评分，点选英语学习或趣味机制；查看 R0→R1→R2 的改动。强调修订后未重评。','#script/score','正文与评分'],
 ['1:35','绘本：局部修订为什么要全篇复检','定位 R0 第 3 页，切换 R1，展示头盔情节补全，再看 2、3、8 页补丁与全篇 PASS。','#book/reader-section','绘本逐页阅读'],
 ['2:25','收在真实交付与验证边界','检查通过与人工入库分开；下载 TXT。具体职责和学习效果没有证据的地方如实留空。','#book/delivery','故事库与交付'],
 ['2:50','回答追问','结合版本对比、评分依据和修订结果，说明产品设计取舍与当前边界。','#evidence','项目说明']
 ].map(([t,n,p,href,label])=>`<div class="guide-step"><strong>${t}</strong><div><h3>${n}</h3><p>${p}</p><a href="${href}">${label}</a></div></div>`).join('')}</div>`;}
function openNode(type,index){
 const names=type==='script'?['故事规划','剧本起草','语义门禁','质量评分']:['绘本创作','R0 语义门禁','定向修订','R1 全篇复检'];
 document.querySelector('#dialog-title').textContent=names[index]+' · 业务说明';
 let summary;
 if(type==='script'){
  const s=D.script,m=s.nodes[1].output.metrics;
  summary=[
   {status:'设计卡已交接',input:'已冻结的 vinegar、seven 及其教学词义，AB 双词策略与已配置的 IP 约束。',checks:['角色目标、触发事件、核心问题和解决机制明确，情节有因果推进。','每个目标词都安排铺垫、发展与兑现；目标词、策略和角色范围与本次任务一致。','设计卡内容完整、格式与绑定检查通过后，交给起草；缺项或绑定不符时停在规划阶段，确认恢复后重做 01。'],result:s.plan.core_problem,detail:`本次设计卡包含 ${s.plan.story_beats.length} 个故事节拍，并为两个目标词分别安排情节作用。`,next:'进入 02，按设计卡起草 R0。',href:'#script/input?panel=plan',link:'查看故事设计卡'},
   {status:'正文已完成本地校验',input:'已交接的设计卡、冻结双词与词形、正文格式及篇幅要求。',checks:['正文结构完整，场景、镜头和中英对白能对应。','对白词数、单句长度与目标词复现满足要求；未分配词不得混入英文正文，角色范围保持一致。','本地硬校验通过才进入语义门禁；失败保留原因，确认恢复后修正 02。'],result:`R0 已生成：${m.scene_count} 个场景、${m.beat_count} 个镜头、${m.dialogue_line_count} 句对白，英文对白 ${m.english_dialogue_word_count} 词。`,detail:'vinegar 与 seven 各出现 6 次；本次最长英文句为 9 词。',next:'进入 03，判断词义、故事与角色表现是否合适。',href:'#script/score?panel=body&version=R0',link:'阅读 R0 完整剧本'},
   {status:'R0 语义检查通过',input:'通过本地硬校验的 R0 正文、目标教学词义与已配置的角色及儿童安全约束。',checks:['目标词在情节中使用正确，语言和可见行为能支持儿童理解。','故事因果与解决方式成立，角色表现和儿童安全符合约束。','通过才进入评分；需人工判断或存在阻断问题时停止后续评分，保留问题位置与原因。'],result:'本次 R0 通过语义门禁，可以进入质量评分。',detail:'两个目标词分别成为寻找的关键物品和按顺序排查的线索，故事通过寻找、排查和发现完成闭环。',next:'进入 04，给出质量依据供人工阅稿。',href:'#script/score?panel=body&version=R0',link:'对照正文查看情节'},
   {status:'R0 评分已完成',input:'已通过语义门禁的 R0 正文与六维评分标准。',checks:['逐项给分并保留正文依据，六个维度共 26 个子项。','原始证据分与最终排序分分别展示，避免混淆口径。','本案例评分供人工判断，不因分数高低自动阻断交付；人工意见可以触发定向修订。'],result:`R0 原始证据分 ${s.score.raw_evidence_score}，最终排序分 ${s.score.final_ranking_score}。`,detail:'后续 R1、R2 未重新执行语义门禁和评分，R0 分数仅作历史参考。',next:'人工阅读正文与评分依据，决定采用或提交修改意见。',href:'#script/score?panel=score',link:'查看六维评分依据'}
  ][index];
 }else{
  const b=D.book;
  summary=[
   {status:'8 页正文已生成',input:'生活任务与职业体验阶段，已确认的 astronaut、helpful 双词快照及已配置的 IP 约束。',checks:['简短规划与分页正文一起创作，形成可逐页阅读的中英文本。','正文结构、双语内容、目标词复现和语义需要继续检查，生成完成仍需接受门禁判断。'],result:`本次生成《${b.title}》R0，共 ${b.versions[0].script.pages.length} 页。`,detail:'创作产物进入全篇检查，再按具体问题决定是否修订。',next:'检查 R0 全篇，定位必须修复的问题。',href:'#book/reader-section?version=R0&page=1',link:'逐页阅读 R0'},
   {status:'R0 存在必须修复的问题',input:'R0 全部 8 页正文、目标词与双语、角色及儿童安全要求。',checks:['检查整篇内容，并将问题定位到具体页。','局部文字问题可定向修订；缺少输入或需人工判断时暂停；影响故事核心时建议作废重写。','检查通过后，可选建议不触发自动改稿。'],result:'第 2、3、8 页英文缺少必要对白，也遗漏了头盔来源。',detail:'本案例先转人工；获得修订授权后，按局部问题处理，限定修改这三页。',next:'确认修复范围后，进入定向修订。',href:'#book/reader-section?version=R0&page=3',link:'定位 R0 第 3 页问题'},
   {status:'三页局部补丁已接受',input:'R0 正文、明确的问题说明，以及第 2、3、8 页的修改授权。',checks:['只修允许页的英文内容，保留全部中文与其余页英文。','先校验补丁页码和修改范围，再合并为 R1。','每轮修订后都检查整篇；自动修订最多 2 轮，并受调用次数与费用预算约束。'],result:'补齐三页英文对白与头盔来源，形成 R1。',detail:'本次修订 1 轮；局部补丁被接受后，还要检查完整的 8 页正文。',next:'对合并后的 R1 执行全篇复检。',href:'#book/repair',link:'查看三页修改前后对比'},
   {status:'R1 全篇复检通过',input:'合并三页补丁后的完整 R1 正文。',checks:['重新检查全篇结构、目标词次数与语义，避免局部改动引入新问题。','没有必须修复的问题才结束修订；通过后由人工另行确认采用与入库。'],result:'R1 全篇检查通过，剩余必须修复的问题为 0。',detail:'astronaut 出现 6 次，helpful 出现 4 次；本次后续已人工确认入库。',next:'结束修订，进入人工确认与交付。',href:'#book/delivery',link:'查看人工确认与交付'}
  ][index];
 }
 document.querySelector('#dialog-body').innerHTML=`<div class="node-summary"><div class="badges">${badge(summary.status,index===1&&type==='book'?'yellow':'green')}</div><section><h3>本步输入</h3><p>${h(summary.input)}</p></section><section><h3>检查与流转条件</h3><ul>${summary.checks.map(text=>`<li>${h(text)}</li>`).join('')}</ul></section><section><h3>本次案例结果</h3><p>${h(summary.result)}</p><p class="muted">${h(summary.detail)}</p></section><section><h3>下一步</h3><p>${h(summary.next)}</p><a class="button ghost" data-action="node-destination" href="${h(summary.href)}">${h(summary.link)}</a></section></div>`;
 dialog.showModal();document.querySelector('#dialog-close').focus();
}
function announce(text){document.querySelector('#announcer').textContent=text;}
function syncDiagramPan(surface){
 if(!surface)return;
 const controls=document.querySelector('.diagram-controls');
 if(!controls)return;
 const left=surface.scrollLeft,maximum=surface.scrollWidth-surface.clientWidth;
 controls.querySelector('[data-value="-1"]').disabled=left<=1;
 controls.querySelector('[data-value="1"]').disabled=left>=maximum-1;
}
function route(){
 if(!D){main.innerHTML='<h1>案例数据未载入</h1><p>请先运行 tools/build_data.py，确认 data.js 与 index.html 在同一目录，再重新打开。</p>';return;}
 const [raw,fragment]=(location.hash.slice(1)||'design').split('/');
 const [anchor,query='']=(fragment||'').split('?');
 const params=new URLSearchParams(query);
 if(raw==='main'){main.focus();return;}
 if(raw==='design'&&anchor==='selection'){
  const workbench=params.get('workbench')==='book'?'book':'script';
  state.designReturn='#design/flow?workbench='+workbench;
  location.replace('#'+workbench+'/selection');
  return;
 }
 const page=['design','overview','script','book','evidence','guide'].includes(raw)?raw:'design';
 const restoreDesign=page==='design'&&['script','book'].includes(state.activePage)&&location.hash===state.designReturn;
 state.activePage=page;
 if(page==='design')state.designReturn='#design/'+(['flow','prototype','roles'].includes(anchor)?anchor:'flow')+'?workbench='+(params.get('workbench')==='book'?'book':'script');
 const titles={design:'产品设计',overview:'项目总览',script:'剧本工作台 / CASE-S01',book:'绘本工作台 / CASE-P01',evidence:'项目说明',guide:'3 分钟演示顺序'};
 if(dialog.open)dialog.close();
 if(page==='book'){
  if(['R0','R1'].includes(params.get('version')))state.bookVersion=params.get('version');
  if(params.has('page'))state.page=Math.max(1,Math.min(8,Number(params.get('page'))||1));
  if(params.has('draw'))state.draw=Math.max(0,Math.min(2,Number(params.get('draw'))||0));
  if(params.get('panel')==='coverage')state.stage=0;
 }
 if(page==='script'){
  if(['R0','R1','R2'].includes(params.get('version')))state.scriptVersion=params.get('version');
  if(['R1','R2'].includes(params.get('revision')))state.revision=params.get('revision')==='R2'?1:0;
  if(params.get('panel')==='score')state.scriptVersion='R0';
 }
 main.innerHTML=page==='design'?productDesignPage(['flow','prototype','roles'].includes(anchor)?anchor:'flow',params.get('workbench')==='book'?'book':'script'):({overview,script,book,evidence,guide}[page])();
 document.querySelector('#breadcrumb').textContent=titles[page];
 document.title=titles[page]+'｜词进入故事';
 document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===page);if(a.dataset.nav===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 const panels={
  'script:body':'#script-text',
  'script:plan':'#input details',
  'script:score':'#score > .panel > details:last-child',
  'script:validation':'#revision-body details',
  'script:failure':'#delivery details',
  'script:stop-policy':'#script-stop-policy',
  'book:coverage':'#coverage details',
  'book:snapshot':'#draw-body details',
  'book:policy':'#repair details'
 };
 const target=panels[page+':'+params.get('panel')]?document.querySelector(panels[page+':'+params.get('panel')]):null;
 if(target)target.open=true;
 if(page!=='design'&&(anchor||target)){
  requestAnimationFrame(()=>{
   (target||document.getElementById(anchor))?.scrollIntoView({block:'start'});
   const node=Number(params.get('node'));
   if(['script','book'].includes(page)&&params.has('node')&&Number.isInteger(node)&&node>=0&&node<=3)openNode(page,node);
  });
 }else{window.scrollTo(0,restoreDesign?state.designScroll:0);main.focus({preventScroll:true});}
 if(page==='design'){
  const surface=document.querySelector('.diagram-scroll');
  if(surface){
   const axis=surface.querySelector('[data-main-axis]')?.dataset.mainAxis;
   surface.scrollTo({left:restoreDesign?state.designCanvasX:axis?Math.max(0,surface.scrollWidth*Number(axis)-surface.clientWidth/2):0,behavior:'instant'});
  }
  syncDiagramPan(surface);
 }
}
main.addEventListener('scroll',e=>{if(e.target.matches('.diagram-scroll'))syncDiagramPan(e.target);},true);
main.addEventListener('click',e=>{
 if(e.target.closest('.product-design a[href^="#script"],.product-design a[href^="#book"]')){
  state.designScroll=window.scrollY;
  state.designCanvasX=document.querySelector('.diagram-scroll')?.scrollLeft||0;
 }
 const button=e.target.closest('[data-action]');if(!button)return;
 const {action,value}=button.dataset;
 if(action==='diagram-pan'){
  const surface=document.querySelector('.diagram-scroll');
  if(surface){surface.scrollBy({left:Number(value)*surface.clientWidth*.8,behavior:'instant'});syncDiagramPan(surface);announce(Number(value)>0?'已向右查看图面':'已向左查看图面');}
 }
 if(action==='script-node'||action==='book-node')openNode(action==='script-node'?'script':'book',Number(value));
 if(action==='node-destination')dialog.close();
 if(action==='script-version'){
  state.scriptVersion=value;document.querySelector('#script-body').innerHTML=renderScriptBody();document.querySelector(`[data-action="script-version"][data-value="${value}"]`).focus();announce('已切换到 '+value+' 正文');
 }
 if(action==='dimension'){
  state.dimension=Number(value);document.querySelector('#score-evidence').innerHTML=scoreBody();document.querySelectorAll('[data-action="dimension"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));announce('已显示 '+D.script.dimensions[state.dimension].name+' 评分证据');
 }
 if(action==='revision'){
  state.revision=Number(value);document.querySelector('#revision-body').innerHTML=revisionBody();document.querySelectorAll('[data-action="revision"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }
 if(action==='stage'){
  state.stage=Number(value);document.querySelector('#coverage').innerHTML=coverage();document.querySelectorAll('[data-action="stage"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));announce('已显示阶段 '+(state.stage+1)+' 的覆盖快照');
 }
 if(action==='draw'){
  state.draw=Number(value);document.querySelector('#draw-body').innerHTML=drawBody();document.querySelector(`[data-action="draw"][data-value="${value}"]`).focus();
 }
 if(action==='book-version'){
  state.bookVersion=value;document.querySelectorAll('[data-action="book-version"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#book-reader').innerHTML=bookReader();announce('已切换到 '+value+' 第 '+state.page+' 页');
 }
 if(action==='page'||action==='issue-page'){
  state.page=Math.min(8,Math.max(1,Number(value)));
  if(action==='issue-page'){state.bookVersion='R0';document.querySelectorAll('[data-action="book-version"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value==='R0')));}
  document.querySelector('#book-reader').innerHTML=bookReader();
  if(action==='issue-page')document.querySelector('#book-reader').scrollIntoView({block:'center'});
  else document.querySelector(`[data-action="page"][aria-current="page"]`)?.focus({preventScroll:true});
  announce('当前为 '+state.bookVersion+' 第 '+state.page+' 页');
 }
 if(action==='locate-beat'){
  e.preventDefault();state.scriptVersion='R0';document.querySelector('#script-text').open=true;document.querySelector('#script-body').innerHTML=renderScriptBody();document.getElementById('beat-'+value)?.scrollIntoView({block:'center'});announce('已定位 R0 '+value);
 }

});
document.querySelector('#dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
window.addEventListener('hashchange',route);
if(D)document.querySelector('#snapshot').textContent='数据快照 '+date(D.snapshot_at)+'（上海时间）';
route();
