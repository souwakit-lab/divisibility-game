const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {CloudSync,changes,applyChanges} = require('../jinbang/cloud-sync.js');
const clone = value => JSON.parse(JSON.stringify(value));
const props={},cache={},rows=[];
const sheet={getLastRow:()=>rows.length,getMaxRows:()=>1000,getRange:(r,c,nr,nc)=>({
  getValues:()=>Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),
  setValues:values=>values.forEach((row,i)=>{rows[r-1+i]??=[];row.forEach((value,j)=>rows[r-1+i][c-1+j]=value);})
})};
const spreadsheet={getSheetByName:()=>sheet,insertSheet:()=>sheet};
const signed=bytes=>[...bytes].map(b=>b>127?b-256:b);
const context=vm.createContext({Date,console,SpreadsheetApp:{openById:()=>spreadsheet,flush:()=>{}},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})},
  CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})},
  Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},
    computeDigest:(alg,s)=>signed(crypto.createHash(alg).update(s).digest()),
    computeHmacSha256Signature:(s,key)=>signed(crypto.createHmac('sha256',key).update(s).digest()),
    base64EncodeWebSafe:value=>(typeof value==='string'?Buffer.from(value):Buffer.from(value.map(b=>(b+256)%256))).toString('base64url'),
    base64DecodeWebSafe:value=>[...Buffer.from(value,'base64url')],newBlob:value=>({getDataAsString:()=>Buffer.from(value).toString()})
  }
});
vm.runInContext(fs.readFileSync('apps-script/Jinbang.gs','utf8'),context);
const route=(action,data)=>clone(context.jinbangRoute_({parameter:{action,data:JSON.stringify(data)}}));
const s={id:'student-1',className:'SG1A',number:'01',name:'測試學生'};
const rec=id=>({id,studentId:s.id,delta:1,reason:'測試',time:'2026-11-04T02:00:00Z',batchId:'test'});
const initial={version:2,epoch:'epoch-1',revision:1,students:[s],records:[],deletedRecords:[],receipts:[],updatedAt:''};
const patch=(state,id,records=[])=>({id,epoch:state.epoch,revision:state.revision,students:[],records,deletedRecords:[],replace:false});
assert.equal(route('jinbangLoad',{}).code,'AUTH');
assert.equal(route('jinbangLogin',{password:'wrong'}).code,'AUTH');
props.JINBANG_PASSWORD_SHA256=crypto.createHash('sha256').update('test-only-password').digest('hex');
const login=route('jinbangLogin',{password:'test-only-password'});
assert.equal(login.ok,true);assert.equal(context.jinbangAuthorized_(login.token),true);
assert.equal(context.jinbangAuthorized_(login.token+'x'),false);
const expired=Buffer.from(JSON.stringify({expires:1})).toString('base64url');
assert.equal(context.jinbangAuthorized_(expired+'.'+crypto.createHmac('sha256',props.JINBANG_SESSION_SECRET).update(expired).digest('base64url')),false);
context.jinbangWrite_(clone(initial));
const request=(p)=>route('jinbangSync',{token:login.token,patch:p});
const a=request(patch(initial,'request-01',[rec('record-a')]));assert.equal(a.ok,true);
const b=request(patch(initial,'request-02',[rec('record-b')]));assert.equal(b.snapshot.records.length,2);
const duplicate=request(patch(initial,'request-01',[rec('record-a')]));assert.equal(duplicate.snapshot.records.length,2);
const revoke={...patch(b.snapshot,'request-03'),deletedRecords:['record-a']};assert.equal(request(revoke).snapshot.records.length,1);
assert.equal(request(patch(b.snapshot,'request-04',[rec('record-a')])).snapshot.records.length,1);
const invalid=request({...patch(b.snapshot,'request-05'),records:[{...rec('record-c'),delta:999}]});assert.equal(invalid.ok,false);
assert.equal(route('jinbangLoad',{token:login.token}).snapshot.records.length,1);
const conflict=request({...patch(initial,'request-06'),replace:true});assert.equal(conflict.code,'CONFLICT');
const current=route('jinbangLoad',{token:login.token}).snapshot;
const reset=request({...patch(current,'request-07'),replace:true,students:[s]});assert.equal(reset.ok,true);assert.notEqual(reset.snapshot.epoch,current.epoch);
assert.equal(request(patch(current,'request-08',[rec('record-old')])).code,'RESET');
const alias={...s,id:'student-duplicate'};
const imported=request({...patch(reset.snapshot,'request-09',[{...rec('record-import'),studentId:alias.id}]),students:[alias]});
assert.equal(imported.snapshot.students.length,1);assert.equal(imported.snapshot.records[0].studentId,s.id);
const encoded={...initial,records:[{...rec('record-unicode'),reason:'測試😀'.repeat(15000)}]};
context.jinbangWrite_(encoded);assert.deepEqual(clone(context.jinbangRead_()),encoded);
for(const row of rows.slice(1,Number(rows[0][2])+1)) assert.equal(/[\uD800-\uDBFF]$/.test(row[0]),false);
// Changes while a save is in flight must be rebased, not discarded.
async function engineTests(){
  let local={students:[s],records:[rec('record-inflight-1')]};let resolve;
  const memory=new Map();const storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
  const engine=new CloudSync({storage,key:'sync',getState:()=>local,setState:v=>local=v,uuid:()=>crypto.randomUUID(),token:()=>login.token,status:()=>{},onAuthExpired:()=>{}});
  engine.base=clone(initial);engine.ready=true;
  engine.request=()=>new Promise(r=>resolve=r);
  const saving=engine.sync();
  local.records.push(rec('record-inflight-2'));
  assert.equal(engine.pending.patch.records.length,1);
  resolve({ok:true,snapshot:{...initial,revision:2,records:[rec('record-inflight-1'),rec('record-other-browser')]}});
  await saving;engine.stop();
  assert.deepEqual(local.records.map(r=>r.id).sort(),['record-inflight-1','record-inflight-2','record-other-browser']);
  assert.equal(changes(engine.base,local).records[0].id,'record-inflight-2');
  // A reload retains both the unsent operation and its request ID after a lost response.
  engine.ready=true;engine.request=async()=>{throw Error('network disconnected');};await engine.sync();engine.stop();
  const pendingId=engine.pending.patch.id;
  const restarted=new CloudSync({storage,key:'sync'});assert.equal(restarted.pending.patch.id,pendingId);
  const merged=applyChanges({students:[s],records:[]},{replace:false,students:[],records:[{...rec('record-remap'),studentId:alias.id}],deletedRecords:[]},[alias]);
  assert.equal(merged.records[0].studentId,s.id);
  // Empty browser loads remote data without submitting a blank replacement.
  local={students:[],records:[]};engine.base=null;engine.pending=null;engine.ready=true;
  engine.accept({...initial,records:[rec('record-remote')]});engine.stop();assert.equal(local.records[0].id,'record-remote');assert.equal(engine.dirty(),false);
  // Restoring the same roster must still replace revoked records, not silently merge them away.
  local={students:[s],records:[rec('record-restored')]};engine.markReplace();engine.stop();
  assert.equal(engine.dirty(),true);assert.ok(new CloudSync({storage,key:'sync'}).replaceRequested);
  engine.ready=true;engine.request=async(action,data)=>{assert.equal(data.patch.replace,true);return {ok:true,snapshot:{...initial,epoch:'restored-epoch',revision:2,records:[rec('record-restored')]}};};
  await engine.sync();engine.stop();assert.equal(engine.replaceRequested,null);assert.equal(engine.dirty(),false);
}
engineTests().then(()=>console.log('PASS: authentication, session tampering/expiry, chunk storage, concurrent saves, retry deduplication, revocation, invalid writes, reset conflicts, import ID mapping, in-flight edits, reload recovery, empty-browser load')).catch(e=>{console.error(e);process.exitCode=1;});
