/* Return navigation added by the portfolio; research storage and routes are unchanged. */
(()=>{
 function mount(){
  const tools=document.querySelector('.top-tools');
  if(!tools||tools.querySelector('.portfolio-return'))return;
  const link=document.createElement('a');
  link.className='text-button portfolio-return';
  link.href='../../index.html#project/research/design';
  link.textContent='返回作品集';
  tools.prepend(link);
 }
 mount();
 new MutationObserver(mount).observe(document.querySelector('#app'),{childList:true,subtree:true});
})();
