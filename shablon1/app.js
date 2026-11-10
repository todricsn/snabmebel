import './motion.js';
import {TYPES,COLORS,PRESETS,normalize,selection,layoutOptions,specification,renderLocker} from './configurator.mjs';

const root=document.querySelector('.configurator');
const form=document.querySelector('.request-form');
const direction=document.querySelector('#direction');
const project=document.querySelector('#project');
const summary=document.querySelector('#attached-summary');
const attached=document.querySelector('#attached-config');
const storageKey='snabmebel-lockers-v2';
let state=selection({});
let includeConfiguration=false;
try {state=selection(JSON.parse(localStorage.getItem(storageKey))||{});} catch {}
const requestedModel=new URLSearchParams(location.search).get('model');
if(root&&/^[0-5]$/.test(requestedModel)){const preset=PRESETS[Number(requestedModel)];state=selection({...state,...preset,type:preset.type||'standard',mode:'layout',bench:false});}
const plural=new Intl.PluralRules('ru');
const places=n=>`${n} ${{one:'место',few:'места',many:'мест',other:'места'}[plural.select(n)]}`;
const layoutLabel=s=>s.individual?'Индивидуальная компоновка':s.type==='sport'?`${s.sections} секц., встроенное сиденье`:`${s.sections} секц., ${s.tiers} яр.`;

function render() {
  if(!root) return;
  state=selection(state);
  root.querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===state.type)));
  root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  root.querySelectorAll('[data-sections]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.sections)===state.sections)));
  root.querySelectorAll('[data-tiers]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.tiers)===state.tiers)));
  root.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===state.color)));
  document.querySelector('#bench').checked=state.bench;
  document.querySelector('#bench').disabled=state.type==='sport';
  document.querySelector('#bench-help').textContent=state.type==='sport'?'У спортивной секции сиденье уже встроено':'Добавить скамью к выбранной компоновке';
  document.querySelector('#cabinet-preview').innerHTML=renderLocker(state,'main-locker');
  document.querySelector('#preview-capacity').textContent=places(state.places);
  document.querySelector('#preview-caption').textContent=layoutLabel(state);
  document.querySelector('#capacity-number').textContent=state.places;
  document.querySelector('#capacity-label').textContent=places(state.places).replace(/^\d+\s/,'')+' для хранения';
  document.querySelector('#capacity-description').textContent=layoutLabel(state);
  document.querySelector('#quantity-total').textContent='Всего в проекте: '+places(state.totalPlaces);
  document.querySelector('#quantity').value=state.quantity;
  document.querySelector('#material').value=state.material;
  document.querySelector('#lock').value=state.lock;
  document.querySelector('#custom-color-row').hidden=state.color!=='custom';
  document.querySelector('#custom-color').value=state.customHex;
  document.querySelector('#layout-controls').hidden=state.mode!=='layout';
  document.querySelector('#capacity-controls').hidden=state.mode!=='places';
  document.querySelector('#tier-field').hidden=state.type!=='standard';
  const fixed=document.querySelector('#fixed-layout-note');
  fixed.hidden=state.type==='standard';
  fixed.textContent=state.type==='sport'?'Одна секция — одно место. Верхний отсек и сиденье входят в секцию.':'В каждой секции две ячейки. Количество мест меняется вместе с количеством секций.';
  const capacityRoot=document.querySelector('#capacity-options');
  if(capacityRoot.dataset.type!==state.type) {
    const options=state.type==='standard'?Array.from({length:30},(_,i)=>i+1):state.type==='sport'?[1,2,3,4,5,6]:[2,4,6,8,10,12];
    capacityRoot.innerHTML=options.map(n=>`<button type="button" data-places="${n}" aria-pressed="false" aria-label="${places(n)}">${n}</button>`).join('');
    capacityRoot.dataset.type=state.type;
  }
  capacityRoot.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.places)===state.places)));
  const pairsRoot=document.querySelector('#layout-options');
  const pairs=layoutOptions(state.type,state.places);
  const pairsKey=state.type+':'+state.places;
  if(pairsRoot.dataset.key!==pairsKey) {
    pairsRoot.innerHTML=pairs.map(p=>`<button type="button" data-pair="${p.sections}-${p.tiers}" aria-pressed="false" aria-label="${p.sections} секций, ${p.tiers} ярусов">${p.sections} секц. × ${p.tiers} яр.</button>`).join('');
    pairsRoot.dataset.key=pairsKey;
  }
  pairsRoot.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pair===state.sections+'-'+state.tiers)));
  if(includeConfiguration) summary.textContent=specification(state);
  try {localStorage.setItem(storageKey,JSON.stringify(normalize(state)));} catch {}
}
root?.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button) return;
  const data=button.dataset;
  if(data.type) state={...state,type:data.type};
  else if(data.mode) state={...state,mode:data.mode};
  else if(data.sections) state={...state,sections:Number(data.sections)};
  else if(data.tiers) state={...state,tiers:Number(data.tiers)};
  else if(data.color) state={...state,color:data.color};
  else if(data.places) state={...state,places:Number(data.places)};
  else if(data.pair) {const [sections,tiers]=data.pair.split('-').map(Number);state={...state,sections,tiers};}
  else return;
  render();
});
for(const id of ['bench','quantity','material','lock']) document.getElementById(id)?.addEventListener('change',event=>{
  const key=event.target.id;
  state={...state,[key]:key==='bench'?event.target.checked:event.target.value};
  render();
});
document.querySelector('#custom-color')?.addEventListener('input',event=>{state={...state,customHex:event.target.value};render();});
document.querySelectorAll('[data-model]').forEach(link=>link.addEventListener('click',()=>{
  state=selection({...state,...PRESETS[Number(link.dataset.model)],type:PRESETS[Number(link.dataset.model)].type||'standard',mode:'layout',bench:false});
  render();
}));
document.querySelector('#quote-configuration')?.addEventListener('click',()=>{
  includeConfiguration=true;
  direction.value='Шкафчики для раздевалок';
  attached.hidden=false;
  summary.textContent=specification(state);
});
document.querySelector('#remove-config')?.addEventListener('click',()=>{includeConfiguration=false;attached.hidden=true;summary.textContent='';});
direction.addEventListener('change',()=>{
  if(direction.value!=='Шкафчики для раздевалок'){includeConfiguration=false;attached.hidden=true;summary.textContent='';}
});
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{
  direction.value=link.dataset.service;includeConfiguration=false;attached.hidden=true;summary.textContent='';
}));
document.querySelectorAll('[data-topic]').forEach(link=>link.addEventListener('click',()=>{direction.value='Шкафчики для раздевалок';if(!project.value.trim()) project.value=link.dataset.topic;}));
form.addEventListener('submit',event=>event.preventDefault());
document.querySelectorAll('.mobile-nav,.services-nav').forEach(menu=>{
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
  document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
});
render();
