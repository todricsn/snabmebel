import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../shablon1/motion.js',import.meta.url),'utf8');
function fixture(reduced=false,supported=true){
 const element=()=>({classList:{values:new Set(),add(v){this.values.add(v)},remove(v){this.values.delete(v)}},parentElement:{closest(){return null}},closest(){return null},attrs:new Set(),setAttribute(k){this.attrs.add(k)},hasAttribute(k){return this.attrs.has(k)},style:{values:new Map(),setProperty(k,v){this.values.set(k,v)},removeProperty(k){this.values.delete(k)}},listeners:{},addEventListener(k,v){this.listeners[k]=v},removeEventListener(k){delete this.listeners[k]}});
 const heading=element(),first=element(),second=element(),html=element();
 const media={matches:reduced,addEventListener(type,fn){this.change=fn}};
 let observer;
 class Observer{constructor(callback,options){this.callback=callback;this.options=options;this.observed=new Set();this.removed=[];observer=this}observe(target){this.observed.add(target)}unobserve(target){this.observed.delete(target);this.removed.push(target)}disconnect(){this.observed.clear();this.disconnected=true}fire(target){if(this.observed.has(target))this.callback([{target,isIntersecting:true}])}}
 const window={matchMedia:()=>media};if(supported)window.IntersectionObserver=Observer;
 const document={documentElement:html,querySelectorAll(selector){if(selector.startsWith('section h1'))return[heading,first,second];if(selector.startsWith('.application-grid,'))return[{children:[first,second]}];return[first,second]}};
 runInNewContext(code,{window,document,IntersectionObserver:Observer});
 return{heading,first,second,html,media,observer};
}
const f=fixture();
assert.ok(f.html.classList.values.has('motion-enabled'));
assert.equal(f.second.style.values.get('--reveal-delay'),'0.08s');
assert.equal(f.observer.options.threshold,0.08);
f.observer.fire(f.first);assert.ok(f.first.classList.values.has('is-revealed'));assert.equal(f.observer.removed.length,1);
f.observer.fire(f.first);assert.equal(f.observer.removed.length,1,'must reveal and unobserve once');
f.first.listeners.transitionend({target:f.first,propertyName:'opacity'});
assert.ok(f.first.classList.values.has('reveal-complete'));assert.ok(!f.first.style.values.has('--reveal-delay'));
f.media.change({matches:true});assert.ok(!f.html.classList.values.has('motion-enabled'));assert.ok(f.observer.disconnected);
for(const config of [[true,true],[false,false]]){const f=fixture(...config);assert.ok(!f.html.classList.values.has('motion-enabled'));assert.equal(f.observer,undefined)}
const css=readFileSync(new URL('../shablon1/motion.css',import.meta.url),'utf8');
for(const [,value]of css.matchAll(/transition:([^;}]+)/g))assert.ok(value.startsWith('none')||/^(transform|opacity)/.test(value),value);
assert.ok(css.includes('cubic-bezier(0.22,1,0.36,1)'));
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
assert.ok(!/transition:\s*(all|width|height|top|left|margin|padding|display|border|box-shadow|background)/.test(css));
console.log('PASS: one-shot reveal, stagger, observer unobserve, reduced motion, unsupported-browser fallback, composite-only transitions.');
