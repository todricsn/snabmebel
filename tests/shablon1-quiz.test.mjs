import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../shablon1/quote-quiz.js',import.meta.url),'utf8');
const node=()=>({hidden:false,disabled:false,textContent:'',style:{},handlers:{},addEventListener(k,fn){this.handlers[k]=fn;}});
const back=node(),next=node(),send=node(),label=node(),progress=node();
const panels=Array.from({length:5},()=>({...node(),answer:null,focused:false,querySelector(selector){return selector==='legend'?{focus:()=>this.focused=true}:this.answer;}}));
const summaries=Array.from({length:4},(_,i)=>({...node(),dataset:{quizSummary:String(i)}}));
const quiz={...node(),querySelectorAll:()=>panels,querySelector(selector){const ids={'#quiz-back':back,'#quiz-next':next,'#quiz-send':send,'#quiz-step':label,'#quiz-progress':progress};return ids[selector]||panels[Number(selector.match(/quiz-(\d)/)?.[1])]?.answer;}};
const document={querySelector:()=>quiz,querySelectorAll:()=>summaries};
runInNewContext(code,{document});
assert.equal(next.disabled,true);assert.equal(back.hidden,true);
next.handlers.click();assert.equal(label.textContent,'Шаг 1 из 5');
for(let i=0;i<4;i++){
 panels[i].answer={value:'Выбор '+i};quiz.handlers.change();
 assert.equal(next.disabled,false);assert.equal(summaries[i].textContent,'Выбор '+i);
 next.handlers.click();assert.equal(panels[i+1].hidden,false);assert.equal(panels[i+1].focused,true);
}
assert.equal(send.hidden,false);assert.equal(next.hidden,true);assert.equal(progress.style.transform,'scaleX(1)');
back.handlers.click();assert.equal(panels[3].answer.value,'Выбор 3');assert.equal(send.hidden,true);
next.handlers.click();assert.equal(send.hidden,false);
let prevented=false;quiz.handlers.submit({preventDefault(){prevented=true}});assert.equal(prevented,true);
assert.equal(send.handlers.click,undefined,'submission must remain inert');
runInNewContext(code,{document:{querySelector:()=>null}});
console.log('PASS: quiz selection guard, all steps, summary, back navigation, focus, inert form and non-homepage fallback.');
