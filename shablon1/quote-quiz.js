const quiz=document.querySelector('#quote-quiz');
if(quiz){
  const panels=[...quiz.querySelectorAll('[data-quiz-step]')];
  const back=quiz.querySelector('#quiz-back');
  const next=quiz.querySelector('#quiz-next');
  const send=quiz.querySelector('#quiz-send');
  let step=0;
  function render(focus=false){
    panels.forEach((panel,index)=>{panel.hidden=index!==step;});
    back.hidden=step===0;
    next.hidden=step===4;
    send.hidden=step!==4;
    next.disabled=step<4&&!panels[step].querySelector('input:checked');
    quiz.querySelector('#quiz-step').textContent=`Шаг ${step+1} из 5`;
    quiz.querySelector('#quiz-progress').style.transform=`scaleX(${(step+1)/5})`;
    document.querySelectorAll('[data-quiz-summary]').forEach(item=>{
      item.textContent=quiz.querySelector(`input[name="quiz-${item.dataset.quizSummary}"]:checked`)?.value||'Не выбрано';
    });
    if(focus)panels[step].querySelector('legend').focus({preventScroll:true});
  }
  quiz.addEventListener('change',()=>render());
  quiz.addEventListener('submit',event=>event.preventDefault());
  next.addEventListener('click',()=>{if(step<4&&panels[step].querySelector('input:checked')){step++;render(true);}});
  back.addEventListener('click',()=>{if(step>0){step--;render(true);}});
  render();
}
