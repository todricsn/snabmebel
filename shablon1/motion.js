const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const cards='.production-grid>a,.object-grid>article,.advantage-grid>article,.work-grid>figure,.model-card,.application-grid>article,.material-grid>article,.service-brief>article,.additional-list>a,.service-related>div>a';
document.querySelectorAll(cards).forEach(card=>card.classList.add('motion-card'));

if(!reducedMotion.matches&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const element=entry.target;
      element.classList.add('is-revealed');
      observer.unobserve(element);
      const finish=event=>{
        if(event.target!==element||event.propertyName!=='opacity')return;
        element.style.removeProperty('--reveal-delay');
        element.classList.add('reveal-complete');
        element.removeEventListener('transitionend',finish);
      };
      element.addEventListener('transitionend',finish);
    }
  },{threshold:0.08,rootMargin:'0px 0px -20px 0px'});
  const selectors='section h1,section h2,section p,.production-grid>a,.object-grid>article,.advantage-grid>article,.work-grid>figure,.model-card,.application-grid>article,.material-grid>article,.service-brief>article,.equipment-list>article,.process-list>li,.additional-list>a,.faq-list>details,.service-related>div>a,.request-layout>div:first-child';
  document.querySelectorAll(selectors).forEach(element=>{
    if(element.closest('form,.configurator,nav,.quote-summary')||element.parentElement.closest('[data-reveal]'))return;
    element.setAttribute('data-reveal','');
    observer.observe(element);
  });
  document.querySelectorAll('.production-grid,.object-grid,.advantage-grid,.work-grid,.application-grid,.model-grid,.material-grid,.service-brief,.equipment-list,.process-list,.additional-list,.faq-list,.service-related>div').forEach(group=>{
    [...group.children].forEach((element,index)=>{
      if(element.hasAttribute('data-reveal'))element.style.setProperty('--reveal-delay',`${index*0.08}s`);
    });
  });
  document.documentElement.classList.add('motion-enabled');
  reducedMotion.addEventListener('change',event=>{
    if(!event.matches)return;
    document.documentElement.classList.remove('motion-enabled');
    observer.disconnect();
  });
}
