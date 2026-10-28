const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let reads = 0, writes = 0, flushes = 0, locks = 0;
class Sheet {
  constructor(header) { this.rows = header.length ? [header] : []; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows[0].length; }
  appendRow(row) { this.rows.push(row); }
  setFrozenRows() {}
  getRange(r, c, nr, nc) {
    return {
      getValues: () => { reads++; return Array.from({length:nr}, (_,i) => Array.from({length:nc}, (_,j) => this.rows[r-1+i]?.[c-1+j] ?? '')); },
      setValues: values => { writes++; values.forEach((row,i) => { this.rows[r-1+i] ||= []; row.forEach((value,j) => this.rows[r-1+i][c-1+j] = value); }); },
      clearContent: () => { this.rows.splice(r-1, nr); },
    };
  }
  deleteRow(row) { this.rows.splice(row-1, 1); }
}
const sheets = {}, props = {};
const spreadsheet = {getSheetByName: name => sheets[name], insertSheet: name => sheets[name] = new Sheet([])};
const ctx = vm.createContext({Date, console, SpreadsheetApp:{openById:()=>spreadsheet,flush:()=>flushes++}, PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})}, LockService:{getScriptLock:()=>({waitLock:()=>locks++,releaseLock:()=>{}})}});
vm.runInContext(fs.readFileSync('apps-script/Code.gs','utf8'),ctx);
const attempt = (id, gemIndex, isCorrect, timestamp) => ({className:'SG1A',id:1,name:'Test',gemIndex,isCorrect,timestamp,attemptId:id});
const a = attempt('a',0,false,'2026-01-01T00:00:01Z');
const b = attempt('b',0,true,'2026-01-01T00:00:02Z');
const c = attempt('c',1,true,'2026-01-01T00:00:03Z');
ctx.saveGemBatch_(spreadsheet,[a,b,c,b]);
assert.equal(writes,2); assert.equal(flushes,1);
assert.equal(sheets['七寶石作答紀錄'].rows.length,4);
assert.equal(sheets['七寶石學生進度'].rows[1][3],'[0,1]');
ctx.saveGemBatch_(spreadsheet,[a,b,c]); assert.equal(writes,2);
ctx.saveGemBatch_(spreadsheet,[attempt('repeat',0,true,'2026-01-01T00:10:00Z')]);
let data = ctx.getGemSummary_('SG1A');
assert.equal(data.players[0].lastCompletedAt,'2026-01-01T00:00:03.000Z');
assert.equal(data.gems[0].correctCount,1); assert.equal(data.attempts,undefined);
assert.equal(ctx.getGemRoster_('SG1A',0).wrong.length,0);
assert.equal(ctx.getGemSummary_('SG1B').players.length,0);
ctx.loadGemPlayer_('SG1A',1,'Test'); assert.equal(locks,0);
const before = writes;
assert.throws(()=>ctx.saveGemBatch_(spreadsheet,[attempt('valid',2,true,'2026-01-01T00:11:00Z'),attempt('invalid',2,true,'bad')]));
assert.equal(writes,before);
ctx.resetGemData_(spreadsheet,'SG1A');
ctx.saveGemBatch_(spreadsheet,[a,b,c]);
assert.equal(ctx.getGemSummary_('SG1A').players.length,0);
console.log('PASS: batch writes, idempotency, original completion time, wrong-list removal, class filter, lock-free reads, invalid batch atomicity, reset protection');
