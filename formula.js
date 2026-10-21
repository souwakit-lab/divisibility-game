const STORAGE_KEY = 'formula-lab-v1';
const LEVELS = [
  { title:'公式偵測', guide:'表示兩個或以上變數之間關係的等式，稱為公式。', prompt:'判斷下面的內容是代數式還是公式。' },
  { title:'單變數代入', guide:'把已知數值代入字母的位置；遇到負數時要保留括號。', prompt:'將數值代入公式，求出未知量。' },
  { title:'雙變數代入', guide:'先找出公式中的每個字母，再逐一代入已知數值。', prompt:'把兩個已知數值代入公式，求出結果。' },
  { title:'進階代入', guide:'先處理括號和分式，再依照乘除先於加減的次序計算。', prompt:'注意負數、括號和分式，完成代入。' },
  { title:'生活公式', guide:'先找出題目提供的數值，再代入題目給出的公式。', prompt:'閱讀情境，利用公式求出答案。' },
  { title:'圖形公式', guide:'先觀察圖形的邊長關係，寫出公式，再代入數值。', prompt:'先選出正確公式，再計算圖形的周界。' },
];
const state = { level:0, questionIndex:0, correct:0, streak:0, wrongStreak:0, total:0, selected:null, question:null, stats:Array.from({length:6},()=>({correct:0,attempts:0,unlocked:false})) };
const $ = (id) => document.getElementById(id);
const LEVEL_NAMES = ['公式','單變數','雙變數','進階','生活','圖形'];
const pick = (a) => a[Math.floor(Math.random()*a.length)];
function load(){const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(saved) Object.assign(state,saved); state.stats[0].unlocked=true;}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify({level:state.level,questionIndex:state.questionIndex,correct:state.correct,streak:state.streak,wrongStreak:state.wrongStreak,total:state.total,stats:state.stats}));}
function numberQuestion(level){
  if(level===1){
    const templates=[{formula:'A = 4b',value:'b = 6',answer:24,hint:'把 b 的 6 放進 4b。'},{formula:'A = 4b',value:'b = −6',answer:-24,hint:'負數代入時可寫成 4(−6)。'},{formula:'P = x² + 3',value:'x = 4',answer:19,hint:'先計算 4²，再加 3。'},{formula:'q = a/2 + 5',value:'a = 8',answer:9,hint:'先把 a 除以 2，再加 5。'}]; return pick(templates);}
  if(level===2){const t=pick([{formula:'s = 2u + 3v',values:'u = 4，v = 5',answer:23,hint:'分別計算 2(4) 和 3(5)，再相加。'},{formula:'T = 5a − 2b',values:'a = 3，b = 2',answer:11,hint:'先計算 5(3) 和 2(2)。'},{formula:'F = 3m + n',values:'m = 6，n = 4',answer:22,hint:'把兩個數字分別放回 m 和 n。'}]); return t;}
  const t=pick([{formula:'f = (u − v)/2',values:'u = −3，v = −9',answer:3,hint:'先計算括號內的 −3 − (−9)。'},{formula:'T = a/2 + 3b',values:'a = 8，b = −2',answer:-2,hint:'先算 8/2，再算 3(−2)。'},{formula:'q = 2(x + y) − 1',values:'x = −2，y = 5',answer:5,hint:'先計算括號內的 −2 + 5。'}]); return t;
}
function makeQuestion(){
  const l=state.level;
  if(l===0){const items=[['3x + 2','代數式'],['P = 2(a + b)','公式'],['7m − 4','代數式'],['A = lw','公式'],['x²/3 + 1','代數式']]; const item=pick(items); return {kind:'choice',display:item[0],choices:['代數式','公式'],answer:item[1],hint:'公式通常有等號，並表示變數之間的關係。'};}
  if(l<=3){const q=numberQuestion(l); return {kind:'number',...q};}
  if(l===4){const items=[{context:'售賣 n 個禮盒的利潤可用公式 P = 80n − 1500 計算。求售出 42 個禮盒的利潤。',formula:'P = 80n − 1500',values:'n = 42',answer:1860,hint:'把 42 代入 n：80(42) − 1500。',unit:'$'},{context:'電視機售貨員的月薪可用公式 S = 6500 + 350m 計算。若售出 40 部，求月薪。',formula:'S = 6500 + 350m',values:'m = 40',answer:20500,hint:'把 40 代入 m：6500 + 350(40)。',unit:'$'}]; return {kind:'word',...pick(items)};}
  const items=[{context:'長方形的長為 a cm、闊為 b cm。周界 P = 2(a + b)。若 a = 6，b = 8，求 P。',choices:['P = a + b','P = 2(a + b)','P = ab'],answerFormula:'P = 2(a + b)',answer:28,hint:'長方形周界是兩條長和兩條闊的總和。',unit:'cm'},{context:'菱形每邊長為 b cm，周界為 P。若 b = 4，求 P。',choices:['P = 2b','P = 3b','P = 4b'],answerFormula:'P = 4b',answer:16,hint:'菱形有四條相等的邊。',unit:'cm'}]; return {kind:'shape',...pick(items)};
}
function renderTabs(){const box=$('level-tabs'); box.innerHTML=''; LEVELS.forEach((item,i)=>{const b=document.createElement('button'); b.className='level-tab'; b.disabled=!state.stats[i].unlocked; b.classList.toggle('is-active',i===state.level); b.classList.toggle('is-complete',state.stats[i].correct>=3); b.innerHTML=`第 ${i+1} 關<small>${LEVEL_NAMES[i]}</small>`; b.addEventListener('click',()=>{state.level=i;state.questionIndex=0;state.correct=0;state.selected=null;renderQuestion();}); box.append(b);}); $('unlocked-copy').textContent=`${state.stats.filter(x=>x.unlocked).length} / 6`;}
function renderQuestion(){state.question=makeQuestion(); state.selected=null; const l=state.level; const info=LEVELS[l]; $('level-copy').textContent=`第 ${l+1} 關・${info.title}`; $('level-kicker').textContent=`第 ${l+1} 關`; $('question-title').textContent=info.title; $('question-number').textContent=`第 ${state.questionIndex+1} / 5 題`; $('question-prompt').textContent=state.question.kind==='word'||state.question.kind==='shape'?info.prompt:info.prompt; $('guide-title').textContent=l===0?'公式是甚麼？':info.title; $('guide-text').textContent=info.guide; $('hint-text').textContent=''; $('feedback').textContent=''; $('feedback').className='feedback';
  const q=state.question; $('question-content').innerHTML=q.kind==='word'||q.kind==='shape'?`<div class="context-display">${q.context}</div>`:`<div class="math-display">${q.display||q.formula}</div>${q.values?`<div class="substitution-line">${q.values}</div>`:''}`;
  const area=$('answer-area'); if(q.kind==='choice'){area.innerHTML=`<div class="choice-grid">${q.choices.map(x=>`<button type="button" class="choice-button" data-value="${x}">${x}</button>`).join('')}</div>`; area.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectChoice(b,q.answer)));}
  else if(q.kind==='shape'){area.innerHTML=`<div class="answer-stack"><div class="choice-grid">${q.choices.map(x=>`<button type="button" class="formula-choice" data-value="${x}">${x}</button>`).join('')}</div><input class="answer-input" id="answer-input" type="number" step="any" placeholder="周界數值" aria-label="周界數值" required></div>`; area.querySelectorAll('.formula-choice').forEach(b=>b.addEventListener('click',()=>selectChoice(b,q.answerFormula)));}
  else {area.innerHTML=`<div class="answer-stack"><div class="substitution-line">請輸入答案${q.unit?'（'+q.unit+'）':''}</div><input class="answer-input" id="answer-input" type="number" step="any" aria-label="答案" required></div>`;}
  renderTabs(); updateStats();}
function selectChoice(button,answer){state.selected=answer; button.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('is-selected')); button.classList.add('is-selected');}
function updateStats(){$('score-copy').textContent=`本次得分 ${state.total}`;$('level-score').textContent=`${state.stats[state.level].correct} / ${state.stats[state.level].attempts}`;$('streak-copy').textContent=state.streak;}
function submit(){const q=state.question; let isCorrect=false; if(q.kind==='choice') isCorrect=state.selected===q.answer; else if(q.kind==='shape') isCorrect=state.selected===q.answerFormula && Number($('answer-input').value)===q.answer; else isCorrect=Number($('answer-input').value)===q.answer; state.stats[state.level].attempts+=1; state.correct+=isCorrect?1:0; const protectionWasActive=state.wrongStreak>=3; if(isCorrect){state.total+=1;state.streak+=1;state.wrongStreak=0;}else{state.streak=0;state.wrongStreak+=1;if(state.wrongStreak<=3)state.total=Math.max(0,state.total-1);} const feedback=$('feedback'); feedback.textContent=isCorrect?(protectionWasActive?'答對了！連錯保護已解除，扣分規則恢復。':'答對了！代入步驟正確。'):(state.wrongStreak>=3?'連錯 3 題，保護機制啟動：再答錯不會扣分，直至答對 1 題。':'再檢查一次字母位置、括號和運算次序。'); feedback.className=`feedback ${isCorrect?'good':'bad'}`; updateStats(); save(); if(isCorrect&&state.correct>=3&&state.level<5&&!state.stats[state.level+1].unlocked){state.stats[state.level+1].unlocked=true; setTimeout(()=>showUnlock(state.level+1),500);} if(isCorrect){setTimeout(()=>{if(state.questionIndex<4){state.questionIndex+=1;renderQuestion();}else{state.questionIndex=0;renderQuestion();}},850);}}
function showUnlock(next){$('complete-title').textContent=`第 ${next+1} 關已解鎖！`; $('complete-text').textContent=`你已完成「${LEVELS[state.level].title}」，下一步可以挑戰「${LEVELS[next].title}」。`; $('complete-dialog').showModal(); renderTabs(); save();}
$('answer-form').addEventListener('submit',e=>{e.preventDefault();submit();}); $('hint-button').addEventListener('click',()=>{$('hint-text').textContent=`提示：${state.question.hint}`;}); $('continue-button').addEventListener('click',()=>{$('complete-dialog').close();state.level=Math.min(5,state.level+1);state.questionIndex=0;state.correct=0;renderQuestion();}); $('reset-button').addEventListener('click',()=>{localStorage.removeItem(STORAGE_KEY);location.reload();});
load();renderQuestion();
