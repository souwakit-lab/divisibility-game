(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const empty = () => ({students:[],records:[]});
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const studentKey = s => s.className + '\u0000' + s.number;
  function changes(base, local) {
    const students = new Map(base.students.map(s => [s.id,s]));
    const records = new Map(base.records.map(r => [r.id,r]));
    const ids = new Set(local.students.map(s => s.id));
    const kept = new Set(local.records.map(r => r.id));
    const replace = base.students.some(s => !ids.has(s.id));
    return {
      replace,
      students:local.students.filter(s => replace || !same(s,students.get(s.id))),
      records:local.records.filter(r => replace || !same(r,records.get(r.id))),
      deletedRecords:replace ? [] : base.records.filter(r => !kept.has(r.id)).map(r => r.id)
    };
  }
  const hasChanges = p => p.replace || p.students.length || p.records.length || p.deletedRecords.length;
  function applyChanges(remote, patch, previousStudents=[]) {
    if (patch.replace) return {students:copy(patch.students),records:copy(patch.records)};
    const students = new Map(remote.students.map(s => [s.id,copy(s)]));
    const byNumber = new Map(remote.students.map(s => [studentKey(s),s.id]));
    const aliases = new Map(previousStudents.map(s => [s.id,byNumber.get(studentKey(s)) || s.id]));
    for (const s of patch.students) {
      const id = byNumber.get(studentKey(s)) || s.id;
      aliases.set(s.id,id);
      students.set(id,{...copy(s),id});
      byNumber.set(studentKey(s),id);
    }
    const records = new Map(remote.records.map(r => [r.id,copy(r)]));
    for (const r of patch.records) if (!records.has(r.id)) records.set(r.id,{...copy(r),studentId:aliases.get(r.studentId) || r.studentId});
    patch.deletedRecords.forEach(id => records.delete(id));
    return {students:[...students.values()],records:[...records.values()]};
  }
  class CloudSync {
    constructor(options) {
      Object.assign(this,options);
      this.base = null;
      this.pending = null;
      this.replaceRequested = null;
      this.busy = false;
      this.ready = false;
      this.blocked = false;
      this.delay = 2000;
      try { const stored=JSON.parse(this.storage.getItem(this.key)||'null'); if(stored){this.base=stored.base;this.pending=stored.pending;this.replaceRequested=stored.replaceRequested||null;} } catch(e) {}
    }
    save() { this.storage.setItem(this.key,JSON.stringify({base:this.base,pending:this.pending,replaceRequested:this.replaceRequested})); }
    markReplace() { this.replaceRequested=this.uuid();this.save();this.queue(); }
    async request(action,data={}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(),45000);
      try {
        const response = await this.fetch(this.url,{method:'POST',redirect:'follow',credentials:'omit',signal:controller.signal,
          headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
          body:new URLSearchParams({action,data:JSON.stringify({token:this.token(),...data})})});
        if(!response.ok) throw Error('Google 連線失敗（'+response.status+'），本機紀錄已保留。');
        let result;
        try { result=await response.json(); } catch(e) { throw Error('Google 後端尚未更新，請稍後再試。'); }
        if(!result.ok) { const error=Error(result.error||'Google 同步失敗。');error.code=result.code;throw error; }
        if(action!=='jinbangLogin' && (!result.snapshot || !Array.isArray(result.snapshot.students) || !Array.isArray(result.snapshot.records))) throw Error('Google 回傳的資料格式無效。');
        return result;
      } finally { clearTimeout(timer); }
    }
    async start(snapshot) {
      this.ready=true;
      if(this.pending) return this.sync();
      try { this.accept(snapshot); this.queue(); } catch(e) { this.fail(e); }
    }
    accept(snapshot) {
      const local=this.getState();
      const patch=this.replaceRequested ? {replace:true,students:local.students,records:local.records,deletedRecords:[]} : changes(this.base||empty(),local);
      if(this.base && this.base.epoch!==snapshot.epoch && hasChanges(patch)) {
        const error=Error('雲端已重設；本機有未同步紀錄，請匯出備份後載入雲端。');error.code='RESET';throw error;
      }
      if(patch.replace && this.base && this.base.revision!==snapshot.revision) {
        const error=Error('其他裝置剛更新分數，請先匯出備份並載入雲端再還原。');error.code='CONFLICT';throw error;
      }
      this.setState(applyChanges(snapshot,patch,this.base?.students||[]));
      this.base=copy(snapshot);this.save();
      this.status('已連接 Google 雲端 · 自動同步中','ok');
    }
    queue(delay=800) {
      clearTimeout(this.timer);
      if(!this.ready || this.blocked || !this.token()) return;
      this.timer=setTimeout(()=>this.sync(),delay);
    }
    dirty() { return !!this.pending || !!this.replaceRequested || !!(this.base && hasChanges(changes(this.base,this.getState()))); }
    async sync() {
      if(this.busy || !this.ready || this.blocked || !this.token()) return;
      this.busy=true;
      try {
        if(!this.base && !this.pending) {const result=await this.request('jinbangLoad');this.accept(result.snapshot);}
        if(!this.pending) {
          const local=this.getState();
          const patch=this.replaceRequested ? {replace:true,students:local.students,records:local.records,deletedRecords:[]} : changes(this.base,local);
          if(!hasChanges(patch)) return;
          this.pending={patch:copy({...patch,id:this.uuid(),epoch:this.base.epoch,revision:this.base.revision}),sent:copy(local),replaceRequest:this.replaceRequested};
          this.save();
        }
        this.status('正在保存到 Google…');
        const result=await this.request('jinbangSync',{patch:this.pending.patch});
        const remainder=changes(this.pending.sent,this.getState());
        this.setState(applyChanges(result.snapshot,remainder,this.pending.sent.students));
        this.base=copy(result.snapshot);
        if(this.pending.replaceRequest===this.replaceRequested) this.replaceRequested=null;
        this.pending=null;this.save();
        this.delay=2000;
        this.status('已保存到 Google '+new Date().toLocaleTimeString('zh-Hant',{hour12:false}),'ok');
      } catch(e) { this.fail(e); }
      finally { this.busy=false;if(!this.blocked && this.dirty()) this.queue(this.delay); }
    }
    fail(error) {
      if(['RESET','CONFLICT','INVALID','RATE_LIMIT'].includes(error.code)) this.blocked=true;
      this.status(error.message || '暫時離線，本機紀錄已保留，連線後會重試。','error');
      if(error.code==='AUTH') {this.blocked=true;this.onAuthExpired();}
      this.delay=Math.min(60000,this.delay*2);
    }
    async refresh(discard=false) {
      if(this.busy || !this.ready || !this.token() || (this.blocked&&!discard)) return;
      if(!discard && this.dirty()) {this.queue(0);return;}
      this.busy=true;
      try {
        const result=await this.request('jinbangLoad');
        if(discard) {this.setState(copy(result.snapshot));this.base=copy(result.snapshot);this.pending=null;this.replaceRequested=null;this.blocked=false;this.save();this.status('已載入最新 Google 資料','ok');}
        else this.accept(result.snapshot);
      } catch(e) {this.fail(e);} finally {this.busy=false;}
    }
    stop() { this.ready=false;clearTimeout(this.timer); }
  }
  const api={CloudSync,changes,hasChanges,applyChanges};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.JinbangCloud=api;
})(typeof window!=='undefined'?window:globalThis);
