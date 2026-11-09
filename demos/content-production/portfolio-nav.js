/* Portfolio-only navigation and an explicitly requested scoring supplement.
   The delivered Demo scripts, styles, data and routes remain unchanged. */
'use strict';
(()=>{
 let workbench='script';
 function syncPortfolio(){
  const [path,query='']=location.hash.slice(1).split('?');
  const [page,view='flow']=path.split('/');
  const params=new URLSearchParams(query);
  if(page==='script'||page==='book')workbench=page;
  else if(page==='design')workbench=params.get('workbench')==='book'?'book':'script';
  document.querySelector('.portfolio-return').setAttribute('href',`../../index.html#project/${workbench}/design`);
  // A direct case URL has no previous design-tab state in the standalone Demo.
  // Keep its return link in the same workbench while retaining the selected tab.
  const designBack=document.querySelector('a.design-back');
  if(designBack&&(page==='script'||page==='book')){
   const [backPath,backQuery='']=designBack.getAttribute('href').split('?');
   const backParams=new URLSearchParams(backQuery);
   backParams.set('workbench',workbench);
   designBack.setAttribute('href',`${backPath}?${backParams}`);
  }
  // Keep the approved Demo design pages intact on their normal entry routes.
  // Existing portfolio scoring links opt into the separate, anonymized supplement.
  if(page==='design'&&workbench==='script'&&params.get('focus')==='scoring'&&['flow','prototype'].includes(view)){
   const end=document.querySelector('.product-design .design-bottom');
   if(end&&!document.querySelector('.scoring-design-supplement')&&window.scoringDesignSupplement){
    end.insertAdjacentHTML('beforebegin',window.scoringDesignSupplement(view,'demo'));
    requestAnimationFrame(()=>document.querySelector('.scoring-design-supplement')?.scrollIntoView({block:'start'}));
   }
  }
 }
 window.addEventListener('hashchange',syncPortfolio);
 syncPortfolio();
})();
