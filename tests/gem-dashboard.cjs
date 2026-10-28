const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map(), requests = [], timers = new Map(); let timer = 0;
const element = id => { if (!elements.has(id)) elements.set(id,{value:'',textContent:'',innerHTML:'',hidden:true}); return elements.get(id); };
const ctx = vm.createContext({
  console:{error:()=>{}}, AbortController, Date,
  document:{hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener:()=>{},createElement:()=>({set textContent(v){this.innerHTML=v;}})},
  window:{DIVISIBILITY_CONFIG:{apiUrl:'https://example.test'}},
  localStorage:{getItem:()=>null},
  setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id),
  fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve:data=>resolve({json:async()=>data}),reject})),
});
vm.runInContext(fs.readFileSync('gem-adventure/gem-dashboard.js','utf8'),ctx);
const summary = count => ({players:[],gems:Array.from({length:7},()=>({correctCount:count}))});
(async()=>{
  const first = ctx.refresh(); element('class-filter').value='SG1B';
  const second = ctx.refresh(); assert.equal(requests[0].options.signal.aborted,true);
  requests[1].resolve(summary(2)); await second;
  requests[0].resolve(summary(1)); await first;
  assert.match(element('gem-grid').innerHTML,/2人答對/);
  assert.equal(timers.size,1);
  const modal = ctx.openModal(0); ctx.closeModal();
  requests[2].resolve({correct:[],wrong:[],pending:[]}); await modal;
  assert.equal(element('modal-backdrop').hidden,true);
  const failed = ctx.refresh(); requests[3].reject(new Error('offline')); await failed;
  assert.match(element('gem-grid').innerHTML,/2人答對/);
  assert.match(element('updated-at').textContent,/保留上次數據/);
  console.log('PASS: no stale class overwrite, aborted old requests, single refresh timer, modal stays closed, last cloud data preserved offline');
})().catch(error=>{console.error(error);process.exitCode=1;});
