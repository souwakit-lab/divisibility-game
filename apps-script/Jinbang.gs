// 金榜學堂：獨立命名空間，只使用「金榜學堂資料」工作表。
// 在原有 doPost(e) 的 try 區塊最前方加入：
// if (String(e.parameter.action || '').startsWith('jinbang')) return jsonResponse(jinbangRoute_(e));
function jinbangRoute_(e) {
  try {
    const action = String(e.parameter.action || '');
    const input = JSON.parse(e.parameter.data || '{}');
    if (action === 'jinbangLogin') {
      const cache = CacheService.getScriptCache();
      const failures = Number(cache.get('jinbang-login-failures') || 0);
      if (failures >= 30) return {ok:false,code:'RATE_LIMIT',error:'登入嘗試過多，請十分鐘後再試。'};
      const expected = PropertiesService.getScriptProperties().getProperty('JINBANG_PASSWORD_SHA256') || 'f4c05f3b344fdb78cb00286deb76e8b072c92fd66cbf828c0602984201373784';
      const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input.password || ''), Utilities.Charset.UTF_8).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
      if (hash !== expected) {
        cache.put('jinbang-login-failures', String(failures + 1), 600);
        return {ok:false,code:'AUTH',error:'密碼不正確。'};
      }
      cache.remove('jinbang-login-failures');
      const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const body = Utilities.base64EncodeWebSafe(JSON.stringify({expires:expires,nonce:Utilities.getUuid()}));
      const signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, jinbangSecret_()));
      return {ok:true,token:body + '.' + signature,expires:expires,snapshot:jinbangPublic_(jinbangRead_())};
    }
    if (!jinbangAuthorized_(input.token)) return {ok:false,code:'AUTH',error:'登入已過期，請重新登入。'};
    const stored = jinbangRead_();
    if (action === 'jinbangLoad') return {ok:true,snapshot:jinbangPublic_(stored)};
    if (action !== 'jinbangSync') throw new Error('不支援的金榜操作。');
    const patch = input.patch || {};
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(String(patch.id || ''))) throw new Error('同步識別碼無效。');
    if (stored.receipts.includes(patch.id)) return {ok:true,snapshot:jinbangPublic_(stored)};
    if (patch.epoch !== stored.epoch) return {ok:false,code:'RESET',error:'雲端資料已被重設，請先匯出本機備份，再按「載入雲端」。'};
    if (patch.replace && Number(patch.revision) !== stored.revision) return {ok:false,code:'CONFLICT',error:'其他裝置剛更新分數，請先載入雲端再重設或還原。'};
    const next = jinbangMerge_(stored, patch);
    next.revision = stored.revision + 1;
    next.updatedAt = new Date().toISOString();
    next.receipts = stored.receipts.concat([patch.id]).slice(-200);
    jinbangWrite_(next);
    return {ok:true,snapshot:jinbangPublic_(next)};
  } catch (error) {
    return {ok:false,code:'INVALID',error:String(error.message || error)};
  }
}

function jinbangSecret_() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty('JINBANG_SESSION_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('JINBANG_SESSION_SECRET', secret);
  }
  return secret;
}

function jinbangAuthorized_(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return false;
    const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], jinbangSecret_()));
    if (expected.length !== parts[1].length) return false;
    let difference = 0;
    for (let i=0;i<expected.length;i++) difference |= expected.charCodeAt(i) ^ parts[1].charCodeAt(i);
    const session = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    return difference === 0 && session.expires > Date.now();
  } catch (error) { return false; }
}

function jinbangSheet_() {
  const spreadsheet = SpreadsheetApp.openById('1gyfVxwpAGriSzL8W-cq98Iq0s_xrPuScYrG_iT3bGEc');
  return spreadsheet.getSheetByName('金榜學堂資料') || spreadsheet.insertSheet('金榜學堂資料');
}

function jinbangRead_() {
  const sheet = jinbangSheet_();
  if (!sheet.getLastRow()) {
    const initial = {version:2,epoch:Utilities.getUuid(),revision:0,updatedAt:'',students:[],records:[],deletedRecords:[],receipts:[]};
    jinbangWrite_(initial);
    return initial;
  }
  const header = sheet.getRange(1,1,1,3).getValues()[0];
  if (header[0] !== 'jinbang-v2' || !Number.isInteger(Number(header[2])) || Number(header[2]) < 1) throw new Error('金榜雲端資料格式無效，請保留資料表並聯絡管理員。');
  const parts = sheet.getRange(2,1,Number(header[2]),1).getValues().map(row => {
    if (!String(row[0]).startsWith('json:')) throw new Error('金榜雲端資料不完整。');
    return String(row[0]).slice(5);
  });
  return JSON.parse(parts.join(''));
}

function jinbangWrite_(snapshot) {
  const text = JSON.stringify(snapshot);
  if (text.length > 8000000) throw new Error('資料過大，請先匯出備份並分學年保存。');
  const chunks = [];
  for (let i=0;i<text.length;) {
    let end = Math.min(i + 40000,text.length);
    const last = text.charCodeAt(end - 1);
    if (end < text.length && last >= 0xD800 && last <= 0xDBFF) end--;
    chunks.push(['json:' + text.slice(i,end),'','']);
    i = end;
  }
  const rows = [['jinbang-v2',snapshot.revision,chunks.length]].concat(chunks);
  const sheet = jinbangSheet_();
  if (sheet.getMaxRows() < rows.length) sheet.insertRowsAfter(sheet.getMaxRows(), rows.length - sheet.getMaxRows());
  // A single range write commits the revision and all chunks together; old trailing rows are ignored.
  sheet.getRange(1,1,rows.length,3).setValues(rows);
  SpreadsheetApp.flush();
}

function jinbangPublic_(snapshot) {
  return {version:2,epoch:snapshot.epoch,revision:snapshot.revision,updatedAt:snapshot.updatedAt,students:snapshot.students,records:snapshot.records};
}

function jinbangMerge_(stored, patch) {
  const next = JSON.parse(JSON.stringify(stored));
  const students = Array.isArray(patch.students) ? patch.students : [];
  const records = Array.isArray(patch.records) ? patch.records : [];
  const removed = Array.isArray(patch.deletedRecords) ? patch.deletedRecords : [];
  if (students.length > 2000 || records.length > 50000 || removed.length > 50000) throw new Error('單次同步資料過多。');
  const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
  if (patch.replace) {
    next.epoch = Utilities.getUuid();
    next.students = [];
    next.records = [];
    next.deletedRecords = [];
  }
  const byId = new Map(next.students.map(s => [s.id,s]));
  const byNumber = new Map(next.students.map(s => [s.className + '\u0000' + s.number,s.id]));
  const aliases = new Map();
  for (const student of students) {
    if (!validId(student.id) || !student.name || String(student.name).length > 70 || !student.className || String(student.className).length > 80 || !student.number || String(student.number).length > 30) throw new Error('學生資料格式無效。');
    const value = {id:student.id,className:String(student.className),number:String(student.number),name:String(student.name)};
    const key = value.className + '\u0000' + value.number;
    const oldId = byNumber.get(key);
    if (oldId && oldId !== value.id) { aliases.set(value.id,oldId); value.id = oldId; }
    const previous = byId.get(value.id);
    if (previous) byNumber.delete(previous.className + '\u0000' + previous.number);
    byId.set(value.id,value);
    byNumber.set(key,value.id);
  }
  const deleted = new Set(next.deletedRecords);
  for (const id of removed) { if (!validId(id)) throw new Error('撤銷紀錄格式無效。'); deleted.add(id); }
  const byRecord = new Map(next.records.map(r => [r.id,r]));
  for (const record of records) {
    const studentId = aliases.get(record.studentId) || record.studentId;
    if (!validId(record.id) || !byId.has(studentId) || !Number.isSafeInteger(record.delta) || record.delta === 0 || Math.abs(record.delta) > 100 || !Number.isFinite(Date.parse(record.time))) throw new Error('積分紀錄格式無效。');
    if (!byRecord.has(record.id) && !deleted.has(record.id)) byRecord.set(record.id,{id:record.id,studentId:studentId,delta:record.delta,reason:String(record.reason || '').slice(0,200),time:String(record.time),batchId:String(record.batchId || '').slice(0,100)});
  }
  next.students = Array.from(byId.values());
  next.records = Array.from(byRecord.values()).filter(r => !deleted.has(r.id));
  next.deletedRecords = Array.from(deleted);
  return next;
}
