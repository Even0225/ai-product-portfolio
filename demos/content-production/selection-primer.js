'use strict';
(()=>{
 const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const slots={A:'实意词 1',B:'实意词 2',C:'非实意词 1',D:'非实意词 2'};
 const caseWords={"A":{"word":"vinegar","meaning":"醋"},"B":{"word":"seven","meaning":"七"},"C":{"word":"C","meaning":"非实意词1（原词不公开）"},"D":{"word":"D","meaning":"非实意词2（原词不公开）"}};
 const strategies=['AB','AC','AD','BC','BD','CD','A','B','C','D'];
 function strategyDetail(code){
  const assigned=[...code],unused=Object.keys(slots).filter(k=>!assigned.includes(k));
  return `<strong>${code}：${assigned.map(k=>`${caseWords[k].word}（${caseWords[k].meaning}）`).join(' ＋ ')}</strong><p>${assigned.map(k=>`${k}＝${slots[k]}`).join('；')}。本篇围绕${assigned.length===2?'这两个目标词':'这个目标词'}展开；同组未分配的 ${unused.map(k=>caseWords[k].word).join('、')} 及其禁用词形不进入本篇英文内容。</p>`;
 }
 function classification(){
  return `<section class="primer-part"><h3>按儿童怎样感知词义来分，而不是按词性贴标签</h3><p>本项目先确定主要教学义项，再按“能否用具体对象、明显动作或客观性质直接呈现”划分。名词、动词、副词等词性保留作参考，不直接决定分组；抽象名词和认知动词，也可能属于非实意词。</p><dl class="word-types"><div><dt>实意词 <small>CONTENT</small></dt><dd>实体、动作、自然变化和可直接表现的性质。为故事提供看得见、能模仿的对象或行动。</dd></div><div><dt>非实意词 <small>NON_CONTENT</small></dt><dd>情绪、认知、方式程度、抽象关系等。借助角色行为、情境和因果关系帮助理解。</dd></div></dl><p class="primer-note">这是本项目的教学与创作分类。“非实意”不表示不能画，而是词义往往需要情境支撑；同一个词换了主要义项，也需要重新判断。</p></section>`;
 }
 function script(){
  return `<div class="selection-primer" data-primer="script"><div class="primer-heading"><h2>剧本：从 2＋2 个词，到 10 种故事策略</h2><p>先用可表现的词搭起故事，再让抽象词进入具体情境。词组准备、策略展开和单篇生产是三个连续环节。</p></div>${classification()}
  <section class="primer-part"><h3>三种组词模式，分别解决常见度搭配与覆盖问题</h3><p>基础词库共 1,157 词：实意词 821 个、非实意词 336 个。每个自动词组固定抽取 <strong>2 个实意词＋2 个非实意词</strong>。词频表示原词频数据中的常见程度，与本系统“抽中过几次”分别记录。</p><div class="primer-table-wrap" tabindex="0" role="region" aria-label="三种组词模式对比"><table class="primer-table mode-table"><thead><tr><th scope="col">模式</th><th scope="col">怎样组织两类词池</th><th scope="col">搭配思路</th></tr></thead><tbody><tr class="current-mode"><th scope="row">Random <span>本次案例</span></th><td>不按词频加权；历史 Random 使用较少的词优先，同次数内用固定种子打散。</td><td>跨常见度组合，同时照顾词汇覆盖与结果可复现。</td></tr><tr><th scope="row">Order</th><td>实意、非实意两个池都按真实词频由高到低排列，再按对应位置组成 2＋2。</td><td>同序搭配：从高频配高频，逐步走向低频配低频。</td></tr><tr><th scope="row">Cross</th><td>实意词按词频从高到低，非实意词从低到高排列，各取两个组成一组。</td><td>交叉搭配：高频实意词与低频非实意词组合。</td></tr></tbody></table></div><p class="primer-note">先判断模式资格，再使用真实词频排序。缺词频不记成 0：Cross 排除普通缺频词；Order 放在尾部候补；Random 可以参加。人工白名单单独分层。三种模式均检查轮内不放回及四词组去重。</p></section>
  <section class="primer-part"><h3>固定 A／B／C／D，再展开十种策略</h3><p>本次 Random 四词组按 A–D 表示；仅公开本篇使用的 A、B 两个词，C、D 保留类型和代号。</p><div class="primer-slots" aria-label="本次 Random 四词映射">${Object.entries(slots).map(([k,v])=>`<span><b>${k}</b>${v}<strong>${['A','B'].includes(k)?caseWords[k].word+' · '+caseWords[k].meaning:'原词不公开'}</strong><small>${['A','B'].includes(k)?'本篇目标词':'仅保留组合代号'}</small></span>`).join('')}</div><p><strong>从 4 个词中任选 2 个：6 种双词策略；再加 4 种单词策略，共 10 种。</strong>组合不区分前后顺序，AB 与 BA 属于同一种策略。</p><div class="strategy-picker" role="group" aria-label="预览十种词汇组合策略">${strategies.map(k=>`<button type="button" data-primer-strategy="${k}" aria-pressed="${k==='AB'}" aria-label="预览 ${k} 策略">${k}</button>`).join('')}</div><div class="strategy-detail" aria-live="polite" aria-atomic="true">${strategyDetail('AB')}</div><p class="primer-note">上方仅预览组合方式，C、D不公开原词。当前回放的是 <strong>Random／AB</strong> 的一篇实际案例：vinegar（醋）＋ seven（七）；页面不会把十种策略展示成已经生成的十篇成品。</p></section>
  <section class="primer-part primer-handoff"><h3>选词完成后，才进入生产</h3><ol><li>冻结四词及 A–D 映射，保留词义、词形与约束。</li><li>展开 10 种策略，形成各篇目标词；再为各篇分配 IP、规划故事设计卡。</li><li>进入起草、语义门禁、六维评分与人工阅稿；本 Demo 回放其中的 AB 案例。</li></ol><div class="link-row"><a href="#design/flow?workbench=script">查看完整业务流程</a><a href="#script/input">进入本次案例输入</a></div></section></div>`;
 }
 function book(){
  const stages=window.EXHIBIT_DATA.book.stages;
  return `<div class="selection-primer primer-book" data-primer="book"><div class="primer-heading"><h2>绘本：先平衡主题词池，再按 1＋1 组题</h2><p>从待生产词的义项、类型与可描绘场景出发，形成适合讲故事的主题阶段；每篇聚焦一对目标词。</p></div>${classification()}
  <section class="primer-part"><h3>六个主题阶段，是统计与场景归类共同形成的结果</h3><p>先梳理 <strong>505 个待生产词</strong>的主要教学义项，统计出 <strong>192 个实意词、313 个非实意词</strong>；再按生活、校园、自然、科学、文化和公共生活中的具体活动归类。在词义与场景合理的前提下调整分布，使每阶段规模接近，情绪与认知词嵌入活动中理解。</p><p>本轮形成六阶段，每阶段 <strong>83–86 词</strong>；17 个小学词优先放在第一阶段。它们是场景主题，不是六个难度等级；阶段数量也是这轮词表的分组结果。</p><div class="primer-table-wrap" tabindex="0" role="region" aria-label="六个主题阶段与词量均衡"><table class="primer-table stage-balance-table"><thead><tr><th scope="col">主题阶段</th><th scope="col">实意词</th><th scope="col">非实意词</th><th scope="col">总词数</th><th scope="col">覆盖理论下限</th></tr></thead><tbody>${stages.map(s=>`<tr><th scope="row"><small>阶段 ${s.stage_no}</small>${escape(s.name)}${s.primary_count?'<span class="primary-note">含 17 个小学词</span>':''}</th><td>${s.content_count}</td><td>${s.non_content_count}</td><td>${s.total}</td><td>${s.minimum_draws} 次</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">合计</th><td>192</td><td>313</td><td>505</td><td>按各阶段分别计算</td></tr></tfoot></table></div><p class="primer-note">均衡指阶段规模、类型分布与覆盖机会接近。两类词总量本就不同，不为凑成 1∶1 修改词义或分类。</p></section>
  <section class="primer-part"><h3>先选阶段，再从阶段内抽 1 个实意词＋1 个非实意词</h3><ol class="book-draw-rules"><li><strong>第一阶段优先小学词。</strong>先照顾尚未抽满 3 次的小学词。</li><li><strong>分别补足两类词的覆盖。</strong>优先抽中次数最少、且未满 3 次的词；同层随机，优先换新搭档。</li><li><strong>完成较早的一类继续作搭档。</strong>一类已满 3 次、另一类还未覆盖完成时，继续从前者的低次数词中选搭档；3 次不是抽取上限。</li><li><strong>保存双词快照后计数。</strong>一次新抽词保存成功，两词各加 1；确认采用、刷新或恢复同一任务，不重复增加。</li></ol><p class="primer-formula">覆盖理论下限＝3 × max（实意词数，非实意词数）<span>例如阶段 1：3 × max（34，52）＝156 次新抽取。它是从零开始的理论下限，不是已完成篇数。</span></p><p class="primer-note">跨故事“每词至少抽中 3 次”，与单篇正文中的目标词复现次数分开统计；本案例单篇每词至少出现 2 次，由正文检查单独核验。</p></section>
  <section class="primer-part primer-handoff"><h3>双词直接成为本篇目标，不再展开十种策略</h3><p>本次选择阶段 1，得到 astronaut（宇航员，实意）＋ helpful（乐于助人的，非实意）。astronaut 因小学词优先归入阶段 1，同时保留科学想象的次场景。</p><ol><li>冻结阶段、双词及教学义项，确认采用并绑定 IP。</li><li>创作 Agent 一次输出故事规划和分页正文。</li><li>检查结构、词频与语义；需要时修问题页，再对整篇复检。</li></ol><div class="link-row"><a href="#design/flow?workbench=book">查看完整业务流程</a><a href="#book/input?panel=coverage">查看本阶段覆盖汇总</a></div></section></div>`;
 }
 window.selectionPrimer=kind=>kind==='book'?book():script();
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-primer-strategy]');
  if(!button)return;
  const code=button.dataset.primerStrategy,root=button.closest('.selection-primer');
  if(!root||!strategies.includes(code))return;
  root.querySelectorAll('[data-primer-strategy]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  root.querySelector('.strategy-detail').innerHTML=strategyDetail(code);
 });
})();
