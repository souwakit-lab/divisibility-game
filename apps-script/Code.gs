const SPREADSHEET_ID = "1gyfVxwpAGriSzL8W-cq98Iq0s_xrPuScYrG_iT3bGEc";
const PLAYER_SHEET = "學生進度";
const ANSWER_SHEET = "作答紀錄";
const CLASS_SHEET = "班級狀態";
const ALLOWED_CLASSES = ["高一甲", "高一乙", "高一丙", "高一丁"];
const DASHBOARD_CACHE_SECONDS = 5;
const RATIONAL_PLAYER_SHEET = "有理數學生進度";
const RATIONAL_ANSWER_SHEET = "有理數作答紀錄";
const RATIONAL_CLASS_SHEET = "有理數班級狀態";
const RATIONAL_BOSS_HP = 50000;
const RATIONAL_CLASSES = ["SG1A", "SG1B"];
const RATIONAL_MULDIV_PLAYER_SHEET = "有理數乘除學生進度";
const RATIONAL_MULDIV_ANSWER_SHEET = "有理數乘除作答紀錄";
const RATIONAL_MULDIV_CLASS_SHEET = "有理數乘除班級狀態";
const RATIONAL_MULDIV_BOSS_HP = 300000;
const RATIONAL_MIXED_PLAYER_SHEET = "有理數混合運算學生進度";
const RATIONAL_MIXED_ANSWER_SHEET = "有理數混合運算作答紀錄";
const RATIONAL_MIXED_CLASS_SHEET = "有理數混合運算班級狀態";
const RATIONAL_MIXED_BOSS_HP = 300000;
const GENERAL_TERM_PLAYER_SHEET = "通項公式學生進度";
const GENERAL_TERM_ANSWER_SHEET = "通項公式作答紀錄";
const GENERAL_TERM_CLASS_SHEET = "通項公式班級狀態";
const GENERAL_TERM_BOSS_HP = 300000;
const SIMPLIFY_PLAYER_SHEET = "化簡代數式學生進度";
const SIMPLIFY_ANSWER_SHEET = "化簡代數式作答紀錄";
const SIMPLIFY_CLASS_SHEET = "化簡代數式班級狀態";
const SIMPLIFY_BOSS_HP = 300000;
const NTH_TERM_PLAYER_SHEET = "通項公式訓練學生進度";
const NTH_TERM_ANSWER_SHEET = "通項公式訓練作答紀錄";
const NTH_TERM_CLASS_SHEET = "通項公式訓練班級狀態";
const NTH_TERM_BOSS_HP = 300000;
const GEM_PLAYER_SHEET = "七寶石學生進度";
const GEM_ANSWER_SHEET = "七寶石作答紀錄";
const GEM_CLASSES = ["SG1A", "SG1B"];

function doGet(e) {
  const action = String(e.parameter.action || "");
  try {
    if (action === "loadNthTermPlayer") return jsonResponse(loadNthTermPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getNthTermDashboardData") return jsonResponse(getCachedNthTermDashboardData_(e.parameter.className || ""));
    if (action === "getNthTermExportData") return jsonResponse(getNthTermExportData_(e.parameter.className || ""));
    if (action === "getNthTermStudentExportData") return jsonResponse(getNthTermStudentExportData_(e.parameter.className, e.parameter.id));
    if (action === "getNthTermSyncStatus") return jsonResponse({ ok:true, received:JSON.parse(PropertiesService.getScriptProperties().getProperty(nthTermReceiptKey_(e.parameter.className, e.parameter.id)) || "[]").includes(String(e.parameter.batchId || "")) });
    if (action === "loadGemPlayer") return jsonResponse(loadGemPlayer_(e.parameter.className, e.parameter.id, e.parameter.name));
    if (action === "getGemDashboardData") return jsonResponse(getGemDashboardData_(e.parameter.className || ""));
    if (action === "loadPlayer") return jsonResponse(loadPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getDashboardData") return jsonResponse(getCachedDashboardData_(e.parameter.className || ""));
    if (action === "loadRationalPlayer") return jsonResponse(loadRationalPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getRationalDashboardData") return jsonResponse(getCachedRationalDashboardData_(e.parameter.className || ""));
    if (action === "getRationalExportData") return jsonResponse(getRationalExportData_(e.parameter.className || ""));
    if (action === "loadRationalMulDivPlayer") return jsonResponse(loadRationalMulDivPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getRationalMulDivDashboardData") return jsonResponse(getCachedRationalMulDivDashboardData_(e.parameter.className || ""));
    if (action === "getRationalMulDivExportData") return jsonResponse(getRationalMulDivExportData_(e.parameter.className || ""));
    if (action === "getRationalMulDivStudentExportData") return jsonResponse(getRationalMulDivStudentExportData_(e.parameter.className, e.parameter.id));
    if (action === "loadRationalMixedPlayer") return jsonResponse(loadRationalMixedPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getRationalMixedDashboardData") return jsonResponse(getCachedRationalMixedDashboardData_(e.parameter.className || ""));
    if (action === "getRationalMixedExportData") return jsonResponse(getRationalMixedExportData_(e.parameter.className || ""));
    if (action === "getRationalMixedStudentExportData") return jsonResponse(getRationalMixedStudentExportData_(e.parameter.className, e.parameter.id));
    if (action === "loadGeneralTermPlayer") return jsonResponse(loadGeneralTermPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getGeneralTermDashboardData") return jsonResponse(getCachedGeneralTermDashboardData_(e.parameter.className || ""));
    if (action === "getGeneralTermExportData") return jsonResponse(getGeneralTermExportData_(e.parameter.className || ""));
    if (action === "getGeneralTermStudentExportData") return jsonResponse(getGeneralTermStudentExportData_(e.parameter.className, e.parameter.id));
    if (action === "loadSimplifyPlayer") return jsonResponse(loadSimplifyPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getSimplifyDashboardData") return jsonResponse(getCachedSimplifyDashboardData_(e.parameter.className || ""));
    if (action === "getSimplifyExportData") return jsonResponse(getSimplifyExportData_(e.parameter.className || ""));
    if (action === "getSimplifyStudentExportData") return jsonResponse(getSimplifyStudentExportData_(e.parameter.className, e.parameter.id));
    if (action === "getSimplifySyncStatus") {
      const key = simplifyReceiptKey_(e.parameter.className, e.parameter.id);
      return jsonResponse({ ok:true, received:JSON.parse(PropertiesService.getScriptProperties().getProperty(key) || "[]").includes(String(e.parameter.batchId || "")) });
    }
    return jsonResponse({ ok: true, service: "divisibility-classroom", version: 1 });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const payload = JSON.parse(e.parameter.data || "{}");
    const action = String(e.parameter.action || "");
    if (action === "resetNthTerm") {
      const className = String(payload.className || "");
      if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
      resetNthTermData_(ensureNthTermSheets_(spreadsheet_()), className); clearNthTermDashboardCache_(className);
      return jsonResponse({ ok:true });
    }
    if (action === "saveNthTerm") {
      validateRationalPayload_(payload);
      const receipts = PropertiesService.getScriptProperties(), key = nthTermReceiptKey_(payload.className, payload.id);
      const received = JSON.parse(receipts.getProperty(key) || "[]");
      if (payload.batchId && received.includes(payload.batchId)) return jsonResponse({ ok:true, duplicate:true });
      const sheets = ensureNthTermSheets_(spreadsheet_());
      saveNthTermPlayer_(sheets.player,payload); appendNthTermAnswers_(sheets.answer,payload);
      const correctAnswers = (Array.isArray(payload.answers) ? payload.answers.slice(0,10) : []).filter((answer) => answer.isCorrect).length;
      updateNthTermBoss_(sheets.classState,payload.className,correctAnswers * 45);
      SpreadsheetApp.flush(); clearNthTermDashboardCache_(payload.className);
      if (payload.batchId) receipts.setProperty(key,JSON.stringify([...received,payload.batchId].slice(-100)));
      return jsonResponse({ ok:true });
    }
    if (action === "resetGeneralTerm") {
      const className = String(payload.className || "");
      if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
      resetGeneralTermData_(ensureGeneralTermSheets_(spreadsheet_()), className);
      clearGeneralTermDashboardCache_(className);
      return jsonResponse({ ok: true });
    }
    if (action === "resetSimplify") {
      const className = String(payload.className || "");
      if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
      resetSimplifyData_(ensureSimplifySheets_(spreadsheet_()), className);
      clearSimplifyDashboardCache_(className);
      return jsonResponse({ ok: true });
    }
    if (action === "saveGeneralTerm") {
      validateRationalPayload_(payload);
      const sheets = ensureGeneralTermSheets_(spreadsheet_());
      saveGeneralTermPlayer_(sheets.player, payload);
      appendGeneralTermAnswers_(sheets.answer, payload);
      updateGeneralTermBoss_(sheets.classState, payload.className, Number(payload.addedDamage) || 0);
      SpreadsheetApp.flush();
      clearGeneralTermDashboardCache_(payload.className);
      return jsonResponse({ ok: true });
    }
    if (action === "saveSimplify") {
      validateRationalPayload_(payload);
      const receipts = PropertiesService.getScriptProperties();
      const receiptKey = simplifyReceiptKey_(payload.className, payload.id);
      const received = JSON.parse(receipts.getProperty(receiptKey) || "[]");
      if (payload.batchId && received.includes(String(payload.batchId))) return jsonResponse({ ok:true, duplicate:true });
      const sheets = ensureSimplifySheets_(spreadsheet_());
      const prior = dataRows_(sheets.player, 10).find((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
      if (payload.levelStats && (!prior || Number(payload.total || 0) >= Number(prior[5]))) receipts.setProperty(`simplify-stats:${payload.className}:${Number(payload.id)}`, JSON.stringify(payload.levelStats));
      saveSimplifyPlayer_(sheets.player, payload);
      appendSimplifyAnswers_(sheets.answer, payload);
      updateSimplifyBoss_(sheets.classState, payload.className, Number(payload.addedDamage) || 0);
      SpreadsheetApp.flush(); clearSimplifyDashboardCache_(payload.className);
      if (payload.batchId) receipts.setProperty(receiptKey, JSON.stringify([...received, String(payload.batchId)].slice(-100)));
      return jsonResponse({ ok: true });
    }
    if (action === "saveGem") {
      validateGemPayload_(payload);
      saveGemAttempt_(spreadsheet_(), payload);
      return jsonResponse({ ok: true });
    }
    if (action === "resetRationalMixed") {
      const className = String(payload.className || "");
      if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
      resetRationalMixedData_(ensureRationalMixedSheets_(spreadsheet_()), className);
      clearRationalMixedDashboardCache_(className);
      return jsonResponse({ ok: true });
    }
    if (action === "saveRationalMixed") {
      validateRationalPayload_(payload);
      const spreadsheet = spreadsheet_();
      const sheets = ensureRationalMixedSheets_(spreadsheet);
      saveRationalMixedPlayer_(sheets.player, payload);
      appendRationalMulDivAnswers_(sheets.answer, payload);
      updateRationalMixedBoss_(sheets.classState, payload.className, Number(payload.addedDamage) || 0);
      SpreadsheetApp.flush();
      clearRationalMixedDashboardCache_(payload.className);
      return jsonResponse({ ok: true });
    }
    if (action === "resetRationalMulDiv") {
      const className = String(payload.className || "");
      if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
      resetRationalMulDivData_(ensureRationalMulDivSheets_(spreadsheet_()), className);
      clearRationalMulDivDashboardCache_(className);
      return jsonResponse({ ok: true });
    }
    if (action === "saveRationalMulDiv") {
      validateRationalPayload_(payload);
      const spreadsheet = spreadsheet_();
      const sheets = ensureRationalMulDivSheets_(spreadsheet);
      saveRationalMulDivPlayer_(sheets.player, payload);
      appendRationalMulDivAnswers_(sheets.answer, payload);
      updateRationalMulDivBoss_(sheets.classState, payload.className, Number(payload.addedDamage) || 0);
      SpreadsheetApp.flush();
      clearRationalMulDivDashboardCache_(payload.className);
      return jsonResponse({ ok: true });
    }
    if (action === "resetRational") {
      const className = String(payload.className || "");
      if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
      resetRationalData_(ensureRationalSheets_(spreadsheet_()), className);
      clearRationalDashboardCache_(className);
      return jsonResponse({ ok: true });
    }
    if (action === "saveRational") {
      validateRationalPayload_(payload);
      const spreadsheet = spreadsheet_();
      const sheets = ensureRationalSheets_(spreadsheet);
      saveRationalPlayer_(sheets.player, payload);
      appendRationalAnswers_(sheets.answer, payload);
      updateRationalBoss_(sheets.classState, payload.className, Number(payload.addedDamage) || 0);
      SpreadsheetApp.flush();
      clearRationalDashboardCache_(payload.className);
      return jsonResponse({ ok: true });
    }
    validatePayload_(payload);
    const spreadsheet = spreadsheet_();
    savePlayer_(spreadsheet.getSheetByName(PLAYER_SHEET), payload);
    appendAnswers_(spreadsheet.getSheetByName(ANSWER_SHEET), payload);
    updateBoss_(spreadsheet.getSheetByName(CLASS_SHEET), payload.className, Number(payload.addedDamage) || 0);
    SpreadsheetApp.flush();
    clearDashboardCache_(payload.className);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function spreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function loadPlayer_(className, studentId) {
  const spreadsheet = spreadsheet_();
  const sheet = spreadsheet.getSheetByName(PLAYER_SHEET);
  const rows = dataRows_(sheet, 12);
  const id = Number(studentId);
  const row = rows.find((item) => item[0] === className && Number(item[1]) === id);
  const classState = getClassState_(spreadsheet.getSheetByName(CLASS_SHEET), className);
  return {
    player: row ? playerFromRow_(row) : null,
    bossHp: classState.bossHp,
    bossMaxHp: classState.bossMaxHp,
  };
}

function getDashboardData_(className) {
  const spreadsheet = spreadsheet_();
  const players = dataRows_(spreadsheet.getSheetByName(PLAYER_SHEET), 12)
    .filter((row) => !className || row[0] === className)
    .map(playerFromRow_);
  const states = dataRows_(spreadsheet.getSheetByName(CLASS_SHEET), 4)
    .filter((row) => !className || row[0] === className);
  return {
    players,
    bossHp: states.reduce((sum, row) => sum + (Number(row[1]) || 0), 0),
    bossMaxHp: states.reduce((sum, row) => sum + (Number(row[2]) || 10000), 0) || 10000,
  };
}

function getCachedDashboardData_(className) {
  const cache = CacheService.getScriptCache();
  const key = dashboardCacheKey_(className);
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const data = getDashboardData_(className);
  cache.put(key, JSON.stringify(data), DASHBOARD_CACHE_SECONDS);
  return data;
}

function clearDashboardCache_(className) {
  CacheService.getScriptCache().removeAll([dashboardCacheKey_(""), dashboardCacheKey_(className)]);
}

function dashboardCacheKey_(className) {
  return `dashboard:${encodeURIComponent(className || "all")}`;
}

function ensureRationalSheets_(spreadsheet) {
  let player = spreadsheet.getSheetByName(RATIONAL_PLAYER_SHEET);
  let answer = spreadsheet.getSheetByName(RATIONAL_ANSWER_SHEET);
  let classState = spreadsheet.getSheetByName(RATIONAL_CLASS_SHEET);
  if (!player) {
    player = spreadsheet.insertSheet(RATIONAL_PLAYER_SHEET);
    player.appendRow(["班別", "學號", "姓名", "程度", "經驗", "作答數", "答對數", "連勝", "連錯", "最後上線"]);
    player.setFrozenRows(1);
  }
  if (!answer) {
    answer = spreadsheet.insertSheet(RATIONAL_ANSWER_SHEET);
    answer.appendRow(["時間", "班別", "學號", "姓名", "程度", "題目", "學生答案", "正確答案", "是否正確"]);
    answer.setFrozenRows(1);
  }
  if (!classState) {
    classState = spreadsheet.insertSheet(RATIONAL_CLASS_SHEET);
    classState.appendRow(["班別", "首領能量", "能量上限", "最後更新"]);
    RATIONAL_CLASSES.forEach((className) => classState.appendRow([className, RATIONAL_BOSS_HP, RATIONAL_BOSS_HP, new Date()]));
    classState.setFrozenRows(1);
  }
  return { player, answer, classState };
}

function loadRationalPlayer_(className, studentId) {
  const sheets = ensureRationalSheets_(spreadsheet_());
  const id = Number(studentId);
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const classRow = dataRows_(sheets.classState, 4).find((item) => item[0] === className);
  const classState = rationalStateValues_(classRow);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: rationalLevelStats_(answerRows),
    bossHp: classState.bossHp,
    bossMaxHp: classState.bossMaxHp,
  };
}

function getRationalDashboardData_(className) {
  const sheets = ensureRationalSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const states = dataRows_(sheets.classState, 4)
    .filter((row) => !className || row[0] === className)
    .map(rationalStateValues_);
  const answerRows = dataRows_(sheets.answer, 9).filter((row) => !className || row[1] === className);
  const levelStats = rationalLevelStats_(answerRows);
  return {
    players,
    levelStats,
    bossHp: states.reduce((sum, state) => sum + state.bossHp, 0),
    bossMaxHp: states.reduce((sum, state) => sum + state.bossMaxHp, 0) || RATIONAL_BOSS_HP,
  };
}

function rationalLevelStats_(answerRows) {
  const levelStats = [1, 2, 3, 4].map((level) => ({ level, total: 0, correct: 0, streak: 0, accuracy: 0 }));
  answerRows.forEach((row) => {
    const level = clamp_(Number(row[4]) || 1, 1, 4);
    const stats = levelStats[level - 1];
    stats.total += 1;
    if (row[8] === "是") {
      stats.correct += 1;
      stats.streak += 1;
    } else {
      stats.streak = 0;
    }
  });
  levelStats.forEach((stats) => {
    stats.accuracy = stats.total ? stats.correct / stats.total : 0;
  });
  return levelStats;
}

function getCachedRationalDashboardData_(className) {
  const cache = CacheService.getScriptCache();
  const key = rationalDashboardCacheKey_(className);
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const data = getRationalDashboardData_(className);
  cache.put(key, JSON.stringify(data), DASHBOARD_CACHE_SECONDS);
  return data;
}

function getRationalExportData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureRationalSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const answers = dataRows_(sheets.answer, 9)
    .filter((row) => !className || row[1] === className)
    .map((row) => ({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
      className: row[1], id: Number(row[2]), name: row[3], level: Number(row[4]) || 1,
      question: row[5], studentAnswer: row[6], correctAnswer: row[7], isCorrect: row[8] === "是",
    }));
  return { players, answers };
}

function resetRationalData_(sheets, className) {
  rewriteRationalRows_(sheets.player, 10, (row) => className && row[0] !== className);
  rewriteRationalRows_(sheets.answer, 9, (row) => className && row[1] !== className);
  const states = dataRows_(sheets.classState, 4);
  states.forEach((row, index) => {
    if (!className || row[0] === className) {
      sheets.classState.getRange(index + 2, 2, 1, 3).setValues([[RATIONAL_BOSS_HP, RATIONAL_BOSS_HP, new Date()]]);
    }
  });
  SpreadsheetApp.flush();
}

function rewriteRationalRows_(sheet, columns, keepRow) {
  const rows = dataRows_(sheet, columns).filter(keepRow);
  const existingRows = Math.max(0, sheet.getLastRow() - 1);
  if (existingRows) sheet.getRange(2, 1, existingRows, columns).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, columns).setValues(rows);
}

function clearRationalDashboardCache_(className) {
  const keys = [rationalDashboardCacheKey_(""), rationalDashboardCacheKey_(className)];
  if (!className) RATIONAL_CLASSES.forEach((item) => keys.push(rationalDashboardCacheKey_(item)));
  CacheService.getScriptCache().removeAll(keys);
}

function rationalDashboardCacheKey_(className) {
  return `rational-dashboard:${encodeURIComponent(className || "all")}`;
}

function ensureRationalMulDivSheets_(spreadsheet) {
  let player = spreadsheet.getSheetByName(RATIONAL_MULDIV_PLAYER_SHEET);
  let answer = spreadsheet.getSheetByName(RATIONAL_MULDIV_ANSWER_SHEET);
  let classState = spreadsheet.getSheetByName(RATIONAL_MULDIV_CLASS_SHEET);
  if (!player) {
    player = spreadsheet.insertSheet(RATIONAL_MULDIV_PLAYER_SHEET);
    player.appendRow(["班別", "學號", "姓名", "程度", "經驗", "作答數", "答對數", "連勝", "連錯", "最後上線"]);
    player.setFrozenRows(1);
  }
  if (!answer) {
    answer = spreadsheet.insertSheet(RATIONAL_MULDIV_ANSWER_SHEET);
    answer.appendRow(["時間", "班別", "學號", "姓名", "程度", "題目", "學生答案", "正確答案", "是否正確"]);
    answer.setFrozenRows(1);
  }
  if (!classState) {
    classState = spreadsheet.insertSheet(RATIONAL_MULDIV_CLASS_SHEET);
    classState.appendRow(["班別", "首領能量", "能量上限", "最後更新"]);
    RATIONAL_CLASSES.forEach((className) => classState.appendRow([className, RATIONAL_MULDIV_BOSS_HP, RATIONAL_MULDIV_BOSS_HP, new Date()]));
    classState.setFrozenRows(1);
  }
  return { player, answer, classState };
}

function loadRationalMulDivPlayer_(className, studentId) {
  const sheets = ensureRationalMulDivSheets_(spreadsheet_());
  const id = Number(studentId);
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const classRow = dataRows_(sheets.classState, 4).find((item) => item[0] === className);
  const classState = rationalMulDivStateValues_(classRow);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: rationalLevelStats_(answerRows),
    bossHp: classState.bossHp,
    bossMaxHp: classState.bossMaxHp,
  };
}

function getRationalMulDivDashboardData_(className) {
  const sheets = ensureRationalMulDivSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const states = dataRows_(sheets.classState, 4)
    .filter((row) => !className || row[0] === className)
    .map(rationalMulDivStateValues_);
  const answerRows = dataRows_(sheets.answer, 9).filter((row) => !className || row[1] === className);
  return {
    players,
    levelStats: rationalLevelStats_(answerRows),
    bossHp: states.reduce((sum, state) => sum + state.bossHp, 0),
    bossMaxHp: states.reduce((sum, state) => sum + state.bossMaxHp, 0) || RATIONAL_MULDIV_BOSS_HP,
  };
}

function getCachedRationalMulDivDashboardData_(className) {
  const cache = CacheService.getScriptCache();
  const key = rationalMulDivDashboardCacheKey_(className);
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const data = getRationalMulDivDashboardData_(className);
  cache.put(key, JSON.stringify(data), DASHBOARD_CACHE_SECONDS);
  return data;
}

function getRationalMulDivExportData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureRationalMulDivSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const answers = dataRows_(sheets.answer, 9)
    .filter((row) => !className || row[1] === className)
    .map((row) => ({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
      className: row[1], id: Number(row[2]), name: row[3], level: Number(row[4]) || 1,
      question: row[5], studentAnswer: row[6], correctAnswer: row[7], isCorrect: row[8] === "是",
    }));
  return { players, answers };
}

function getRationalMulDivStudentExportData_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const id = Number(studentId);
  if (!Number.isInteger(id) || id < 1 || id > 34 || (className === "SG1B" && id === 29)) throw new Error("Invalid student id");
  const sheets = ensureRationalMulDivSheets_(spreadsheet_());
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const wrongAnswers = answerRows.filter((item) => item[8] !== "是").map((item) => ({
    timestamp: item[0] instanceof Date ? item[0].toISOString() : String(item[0] || ""),
    level: Number(item[4]) || 1,
    question: item[5], studentAnswer: item[6], correctAnswer: item[7],
  }));
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: rationalLevelStats_(answerRows),
    wrongAnswers,
  };
}

function resetRationalMulDivData_(sheets, className) {
  rewriteRationalRows_(sheets.player, 10, (row) => className && row[0] !== className);
  rewriteRationalRows_(sheets.answer, 9, (row) => className && row[1] !== className);
  const states = dataRows_(sheets.classState, 4);
  states.forEach((row, index) => {
    if (!className || row[0] === className) {
      sheets.classState.getRange(index + 2, 2, 1, 3).setValues([[RATIONAL_MULDIV_BOSS_HP, RATIONAL_MULDIV_BOSS_HP, new Date()]]);
    }
  });
  SpreadsheetApp.flush();
}

function updateRationalMulDivBoss_(sheet, className, damage) {
  const rows = dataRows_(sheet, 4);
  const index = rows.findIndex((row) => row[0] === className);
  if (index < 0) return;
  const state = rationalMulDivStateValues_(rows[index]);
  sheet.getRange(index + 2, 2, 1, 3).setValues([[Math.max(0, state.bossHp - clamp_(damage, 0, 100)), state.bossMaxHp, new Date()]]);
}

function rationalMulDivStateValues_(row) {
  if (!row) return { bossHp: RATIONAL_MULDIV_BOSS_HP, bossMaxHp: RATIONAL_MULDIV_BOSS_HP };
  const previousMax = Math.max(1, Number(row[2]) || RATIONAL_MULDIV_BOSS_HP);
  const rawHp = Number(row[1]);
  const previousHp = Math.max(0, Math.min(previousMax, Number.isFinite(rawHp) ? rawHp : previousMax));
  const damageDealt = previousMax - previousHp;
  return {
    bossHp: Math.max(0, RATIONAL_MULDIV_BOSS_HP - damageDealt),
    bossMaxHp: RATIONAL_MULDIV_BOSS_HP,
  };
}

function clearRationalMulDivDashboardCache_(className) {
  const keys = [rationalMulDivDashboardCacheKey_(""), rationalMulDivDashboardCacheKey_(className)];
  if (!className) RATIONAL_CLASSES.forEach((item) => keys.push(rationalMulDivDashboardCacheKey_(item)));
  CacheService.getScriptCache().removeAll(keys);
}

function rationalMulDivDashboardCacheKey_(className) {
  return `rational-muldiv-dashboard:${encodeURIComponent(className || "all")}`;
}

function ensureRationalMixedSheets_(spreadsheet) {
  let player = spreadsheet.getSheetByName(RATIONAL_MIXED_PLAYER_SHEET);
  let answer = spreadsheet.getSheetByName(RATIONAL_MIXED_ANSWER_SHEET);
  let classState = spreadsheet.getSheetByName(RATIONAL_MIXED_CLASS_SHEET);
  if (!player) {
    player = spreadsheet.insertSheet(RATIONAL_MIXED_PLAYER_SHEET);
    player.appendRow(["班別", "學號", "姓名", "程度", "經驗", "作答數", "答對數", "連勝", "連錯", "最後上線"]);
    player.setFrozenRows(1);
  }
  if (!answer) {
    answer = spreadsheet.insertSheet(RATIONAL_MIXED_ANSWER_SHEET);
    answer.appendRow(["時間", "班別", "學號", "姓名", "程度", "題目", "學生答案", "正確答案", "是否正確"]);
    answer.setFrozenRows(1);
  }
  if (!classState) {
    classState = spreadsheet.insertSheet(RATIONAL_MIXED_CLASS_SHEET);
    classState.appendRow(["班別", "首領能量", "能量上限", "最後更新"]);
    RATIONAL_CLASSES.forEach((className) => classState.appendRow([className, RATIONAL_MIXED_BOSS_HP, RATIONAL_MIXED_BOSS_HP, new Date()]));
    classState.setFrozenRows(1);
  }
  return { player, answer, classState };
}

function loadRationalMixedPlayer_(className, studentId) {
  const sheets = ensureRationalMixedSheets_(spreadsheet_());
  const id = Number(studentId);
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const classRow = dataRows_(sheets.classState, 4).find((item) => item[0] === className);
  const classState = rationalMixedStateValues_(classRow);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: rationalLevelStats_(answerRows),
    bossHp: classState.bossHp,
    bossMaxHp: classState.bossMaxHp,
  };
}

function getRationalMixedDashboardData_(className) {
  const sheets = ensureRationalMixedSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const states = dataRows_(sheets.classState, 4)
    .filter((row) => !className || row[0] === className)
    .map(rationalMixedStateValues_);
  const answerRows = dataRows_(sheets.answer, 9).filter((row) => !className || row[1] === className);
  return {
    players,
    levelStats: rationalLevelStats_(answerRows),
    bossHp: states.reduce((sum, state) => sum + state.bossHp, 0),
    bossMaxHp: states.reduce((sum, state) => sum + state.bossMaxHp, 0) || RATIONAL_MIXED_BOSS_HP,
  };
}

function getCachedRationalMixedDashboardData_(className) {
  const cache = CacheService.getScriptCache();
  const key = rationalMixedDashboardCacheKey_(className);
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const data = getRationalMixedDashboardData_(className);
  cache.put(key, JSON.stringify(data), DASHBOARD_CACHE_SECONDS);
  return data;
}

function getRationalMixedExportData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureRationalMixedSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const answers = dataRows_(sheets.answer, 9)
    .filter((row) => !className || row[1] === className)
    .map((row) => ({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
      className: row[1], id: Number(row[2]), name: row[3], level: Number(row[4]) || 1,
      question: row[5], studentAnswer: row[6], correctAnswer: row[7], isCorrect: row[8] === "是",
    }));
  return { players, answers };
}

function getRationalMixedStudentExportData_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const id = Number(studentId);
  if (!Number.isInteger(id) || id < 1 || id > 34 || (className === "SG1B" && id === 29)) throw new Error("Invalid student id");
  const sheets = ensureRationalMixedSheets_(spreadsheet_());
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const wrongAnswers = answerRows.filter((item) => item[8] !== "是").map((item) => ({
    timestamp: item[0] instanceof Date ? item[0].toISOString() : String(item[0] || ""),
    level: Number(item[4]) || 1,
    question: item[5], studentAnswer: item[6], correctAnswer: item[7],
  }));
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: rationalLevelStats_(answerRows),
    wrongAnswers,
  };
}

function resetRationalMixedData_(sheets, className) {
  rewriteRationalRows_(sheets.player, 10, (row) => className && row[0] !== className);
  rewriteRationalRows_(sheets.answer, 9, (row) => className && row[1] !== className);
  const states = dataRows_(sheets.classState, 4);
  states.forEach((row, index) => {
    if (!className || row[0] === className) {
      sheets.classState.getRange(index + 2, 2, 1, 3).setValues([[RATIONAL_MIXED_BOSS_HP, RATIONAL_MIXED_BOSS_HP, new Date()]]);
    }
  });
  SpreadsheetApp.flush();
}

function updateRationalMixedBoss_(sheet, className, damage) {
  const rows = dataRows_(sheet, 4);
  const index = rows.findIndex((row) => row[0] === className);
  if (index < 0) return;
  const state = rationalMixedStateValues_(rows[index]);
  sheet.getRange(index + 2, 2, 1, 3).setValues([[Math.max(0, state.bossHp - clamp_(damage, 0, 100)), state.bossMaxHp, new Date()]]);
}

function rationalMixedStateValues_(row) {
  if (!row) return { bossHp: RATIONAL_MIXED_BOSS_HP, bossMaxHp: RATIONAL_MIXED_BOSS_HP };
  const previousMax = Math.max(1, Number(row[2]) || RATIONAL_MIXED_BOSS_HP);
  const rawHp = Number(row[1]);
  const previousHp = Math.max(0, Math.min(previousMax, Number.isFinite(rawHp) ? rawHp : previousMax));
  const damageDealt = previousMax - previousHp;
  return { bossHp: Math.max(0, RATIONAL_MIXED_BOSS_HP - damageDealt), bossMaxHp: RATIONAL_MIXED_BOSS_HP };
}

function clearRationalMixedDashboardCache_(className) {
  const keys = [rationalMixedDashboardCacheKey_(""), rationalMixedDashboardCacheKey_(className)];
  if (!className) RATIONAL_CLASSES.forEach((item) => keys.push(rationalMixedDashboardCacheKey_(item)));
  CacheService.getScriptCache().removeAll(keys);
}

function rationalMixedDashboardCacheKey_(className) {
  return `rational-mixed-dashboard:${encodeURIComponent(className || "all")}`;
}

function ensureGeneralTermSheets_(spreadsheet) {
  let player = spreadsheet.getSheetByName(GENERAL_TERM_PLAYER_SHEET);
  let answer = spreadsheet.getSheetByName(GENERAL_TERM_ANSWER_SHEET);
  let classState = spreadsheet.getSheetByName(GENERAL_TERM_CLASS_SHEET);
  if (!player) {
    player = spreadsheet.insertSheet(GENERAL_TERM_PLAYER_SHEET);
    player.appendRow(["班別", "學號", "姓名", "程度", "經驗", "作答數", "答對數", "連勝", "連錯", "最後上線"]);
    player.setFrozenRows(1);
  }
  if (!answer) {
    answer = spreadsheet.insertSheet(GENERAL_TERM_ANSWER_SHEET);
    answer.appendRow(["時間", "班別", "學號", "姓名", "程度", "題目", "學生答案", "正確答案", "是否正確"]);
    answer.setFrozenRows(1);
  }
  if (!classState) {
    classState = spreadsheet.insertSheet(GENERAL_TERM_CLASS_SHEET);
    classState.appendRow(["班別", "首領能量", "能量上限", "最後更新"]);
    RATIONAL_CLASSES.forEach((className) => classState.appendRow([className, GENERAL_TERM_BOSS_HP, GENERAL_TERM_BOSS_HP, new Date()]));
    classState.setFrozenRows(1);
  }
  return { player, answer, classState };
}

function loadGeneralTermPlayer_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureGeneralTermSheets_(spreadsheet_());
  const id = Number(studentId);
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const classRow = dataRows_(sheets.classState, 4).find((item) => item[0] === className);
  const state = generalTermStateValues_(classRow);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: generalTermLevelStats_(answerRows),
    bossHp: state.bossHp,
    bossMaxHp: state.bossMaxHp,
  };
}

function getGeneralTermDashboardData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureGeneralTermSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const states = dataRows_(sheets.classState, 4)
    .filter((row) => !className || row[0] === className)
    .map(generalTermStateValues_);
  const answerRows = dataRows_(sheets.answer, 9).filter((row) => !className || row[1] === className);
  return {
    players,
    levelStats: generalTermLevelStats_(answerRows),
    bossHp: states.reduce((sum, state) => sum + state.bossHp, 0),
    bossMaxHp: states.reduce((sum, state) => sum + state.bossMaxHp, 0) || GENERAL_TERM_BOSS_HP,
  };
}

function getCachedGeneralTermDashboardData_(className) {
  const cache = CacheService.getScriptCache();
  const key = generalTermDashboardCacheKey_(className);
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const data = getGeneralTermDashboardData_(className);
  cache.put(key, JSON.stringify(data), DASHBOARD_CACHE_SECONDS);
  return data;
}

function getGeneralTermExportData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureGeneralTermSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const answers = dataRows_(sheets.answer, 9)
    .filter((row) => !className || row[1] === className)
    .map(generalTermAnswerFromRow_);
  return { players, answers };
}

function getGeneralTermStudentExportData_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const id = Number(studentId);
  if (!Number.isInteger(id) || id < 1 || id > 34 || (className === "SG1B" && id === 29)) throw new Error("Invalid student id");
  const sheets = ensureGeneralTermSheets_(spreadsheet_());
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: generalTermLevelStats_(answerRows),
    wrongAnswers: answerRows.filter((item) => item[8] !== "是").map((item) => ({
      timestamp:item[0] instanceof Date ? item[0].toISOString() : String(item[0] || ""),
      level:Number(item[4]) || 1, question:item[5], studentAnswer:item[6], correctAnswer:item[7],
    })),
  };
}

function generalTermLevelStats_(answerRows) {
  const stats = [1,2,3,4,5,6].map((level) => ({ level, total:0, correct:0, streak:0, accuracy:0 }));
  answerRows.forEach((row) => {
    const item = stats[clamp_(Number(row[4]) || 1, 1, 6) - 1];
    item.total += 1;
    if (row[8] === "是") { item.correct += 1; item.streak += 1; }
    else item.streak = 0;
  });
  stats.forEach((item) => { item.accuracy = item.total ? item.correct / item.total : 0; });
  return stats;
}

function generalTermAnswerFromRow_(row) {
  return {
    timestamp:row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
    className:row[1], id:Number(row[2]), name:row[3], level:Number(row[4]) || 1,
    question:row[5], studentAnswer:row[6], correctAnswer:row[7], isCorrect:row[8] === "是",
  };
}

function saveGeneralTermPlayer_(sheet, payload) {
  const rows = dataRows_(sheet, 10);
  const rowIndex = rows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  const values = [[
    safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(payload.level) || 1, 1, 6), clamp_(Number(payload.xp) || 0, 0, 500),
    clamp_(Number(payload.total) || 0, 0, 1000000), clamp_(Number(payload.correct) || 0, 0, 1000000),
    clamp_(Number(payload.streak) || 0, 0, 100000), clamp_(Number(payload.mistakes) || 0, 0, 1000), new Date(),
  ]];
  if (rowIndex >= 0) sheet.getRange(rowIndex + 2, 1, 1, 10).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues(values);
}

function appendGeneralTermAnswers_(sheet, payload) {
  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 10) : [];
  if (!answers.length) return;
  const rows = answers.map((answer) => [
    new Date(), safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(answer.level) || 1, 1, 6), safeText_(answer.question, 240),
    safeText_(answer.studentAnswer, 80), safeText_(answer.correctAnswer, 80), answer.isCorrect ? "是" : "否",
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
}

function updateGeneralTermBoss_(sheet, className, damage) {
  const rows = dataRows_(sheet, 4);
  const index = rows.findIndex((row) => row[0] === className);
  if (index < 0) return;
  const state = generalTermStateValues_(rows[index]);
  sheet.getRange(index + 2, 2, 1, 3).setValues([[Math.max(0, state.bossHp - clamp_(damage, 0, 100)), state.bossMaxHp, new Date()]]);
}

function generalTermStateValues_(row) {
  if (!row) return { bossHp:GENERAL_TERM_BOSS_HP, bossMaxHp:GENERAL_TERM_BOSS_HP };
  const previousMax = Math.max(1, Number(row[2]) || GENERAL_TERM_BOSS_HP);
  const previousHp = Math.max(0, Math.min(previousMax, Number.isFinite(Number(row[1])) ? Number(row[1]) : previousMax));
  return { bossHp:Math.max(0, GENERAL_TERM_BOSS_HP - (previousMax - previousHp)), bossMaxHp:GENERAL_TERM_BOSS_HP };
}

function resetGeneralTermData_(sheets, className) {
  rewriteRationalRows_(sheets.player, 10, (row) => className && row[0] !== className);
  rewriteRationalRows_(sheets.answer, 9, (row) => className && row[1] !== className);
  dataRows_(sheets.classState, 4).forEach((row, index) => {
    if (!className || row[0] === className) sheets.classState.getRange(index + 2, 2, 1, 3).setValues([[GENERAL_TERM_BOSS_HP, GENERAL_TERM_BOSS_HP, new Date()]]);
  });
  SpreadsheetApp.flush();
}

function clearGeneralTermDashboardCache_(className) {
  const keys = [generalTermDashboardCacheKey_(""), generalTermDashboardCacheKey_(className)];
  if (!className) RATIONAL_CLASSES.forEach((item) => keys.push(generalTermDashboardCacheKey_(item)));
  CacheService.getScriptCache().removeAll(keys);
}

function generalTermDashboardCacheKey_(className) {
  return `general-term-dashboard:${encodeURIComponent(className || "all")}`;
}

function saveRationalMixedPlayer_(sheet, payload) {
  const rows = dataRows_(sheet, 10);
  const rowIndex = rows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  const level = clamp_(Number(payload.level) || 1, 1, 4);
  const maxXp = level === 1 ? 800 : 500;
  const values = [[
    safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    level, clamp_(Number(payload.xp) || 0, 0, maxXp),
    clamp_(Number(payload.total) || 0, 0, 1000000), clamp_(Number(payload.correct) || 0, 0, 1000000),
    clamp_(Number(payload.streak) || 0, 0, 100000), clamp_(Number(payload.mistakes) || 0, 0, 1000), new Date(),
  ]];
  if (rowIndex >= 0) sheet.getRange(rowIndex + 2, 1, 1, 10).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues(values);
}

function saveRationalMulDivPlayer_(sheet, payload) {
  const rows = dataRows_(sheet, 10);
  const rowIndex = rows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  const level = clamp_(Number(payload.level) || 1, 1, 4);
  const maxXp = level === 1 ? 1500 : 500;
  const values = [[
    safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    level, clamp_(Number(payload.xp) || 0, 0, maxXp),
    clamp_(Number(payload.total) || 0, 0, 1000000), clamp_(Number(payload.correct) || 0, 0, 1000000),
    clamp_(Number(payload.streak) || 0, 0, 100000), clamp_(Number(payload.mistakes) || 0, 0, 1000), new Date(),
  ]];
  if (rowIndex >= 0) sheet.getRange(rowIndex + 2, 1, 1, 10).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues(values);
}

function appendRationalMulDivAnswers_(sheet, payload) {
  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 10) : [];
  if (!answers.length) return;
  const rows = answers.map((answer) => [
    new Date(), safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(answer.level) || 1, 1, 4), safeText_(answer.question, 240),
    safeText_(answer.studentAnswer, 80), safeText_(answer.correctAnswer, 80), answer.isCorrect ? "是" : "否",
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
}

function saveRationalPlayer_(sheet, payload) {
  const rows = dataRows_(sheet, 10);
  const rowIndex = rows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  const values = [[
    safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(payload.level) || 1, 1, 4), clamp_(Number(payload.xp) || 0, 0, 500),
    clamp_(Number(payload.total) || 0, 0, 1000000), clamp_(Number(payload.correct) || 0, 0, 1000000),
    clamp_(Number(payload.streak) || 0, 0, 100000), clamp_(Number(payload.mistakes) || 0, 0, 1000), new Date(),
  ]];
  if (rowIndex >= 0) sheet.getRange(rowIndex + 2, 1, 1, 10).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues(values);
}

function appendRationalAnswers_(sheet, payload) {
  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 10) : [];
  if (!answers.length) return;
  const rows = answers.map((answer) => [
    new Date(), safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(answer.level) || 1, 1, 4), safeText_(answer.question, 180),
    safeText_(answer.studentAnswer, 80), safeText_(answer.correctAnswer, 80), answer.isCorrect ? "是" : "否",
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
}

function updateRationalBoss_(sheet, className, damage) {
  const rows = dataRows_(sheet, 4);
  const index = rows.findIndex((row) => row[0] === className);
  if (index < 0) return;
  const state = rationalStateValues_(rows[index]);
  sheet.getRange(index + 2, 2, 1, 3).setValues([[Math.max(0, state.bossHp - clamp_(damage, 0, 100)), state.bossMaxHp, new Date()]]);
}

function rationalStateValues_(row) {
  if (!row) return { bossHp: RATIONAL_BOSS_HP, bossMaxHp: RATIONAL_BOSS_HP };
  const previousMax = Math.max(1, Number(row[2]) || RATIONAL_BOSS_HP);
  const rawHp = Number(row[1]);
  const previousHp = Math.max(0, Math.min(previousMax, Number.isFinite(rawHp) ? rawHp : previousMax));
  const damageDealt = previousMax - previousHp;
  return {
    bossHp: Math.max(0, RATIONAL_BOSS_HP - damageDealt),
    bossMaxHp: RATIONAL_BOSS_HP,
  };
}

function rationalPlayerFromRow_(row) {
  const total = Number(row[5]) || 0;
  const correct = Number(row[6]) || 0;
  return {
    className: row[0], id: Number(row[1]), name: row[2], level: Number(row[3]) || 1,
    xp: Number(row[4]) || 0, total, correct, streak: Number(row[7]) || 0,
    mistakes: Number(row[8]) || 0, accuracy: total ? correct / total : 0,
  };
}

function validateRationalPayload_(payload) {
  if (!RATIONAL_CLASSES.includes(payload.className)) throw new Error("Invalid class");
  const id = Number(payload.id);
  if (!Number.isInteger(id) || id < 1 || id > 34 || (payload.className === "SG1B" && id === 29)) throw new Error("Invalid student id");
  if (!payload.name || String(payload.name).length > 30) throw new Error("Invalid player name");
}

function savePlayer_(sheet, payload) {
  const rows = dataRows_(sheet, 12);
  const rowIndex = rows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  const values = [[
    safeText_(payload.className, 12),
    Number(payload.id),
    safeText_(payload.name, 30),
    clamp_(Number(payload.level) || 1, 1, 3),
    Math.max(0, Number(payload.hp) || 0),
    Math.max(0, Number(payload.exp) || 0),
    Math.max(0, Number(payload.combo) || 0),
    clamp_(Number(payload.totalDamage) || 0, 0, 10000000),
    clamp_(Number(payload.totalAnswers) || 0, 0, 1000000),
    clamp_(Number(payload.correctAnswers) || 0, 0, 1000000),
    clamp_(Number(payload.mistakes) || 0, 0, 1000),
    new Date(),
  ]];
  if (rowIndex >= 0) sheet.getRange(rowIndex + 2, 1, 1, 12).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 12).setValues(values);
}

function appendAnswers_(sheet, payload) {
  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 10) : [];
  if (!answers.length) return;
  const rows = answers.map((answer) => [
    new Date(),
    safeText_(payload.className, 12),
    Number(payload.id),
    safeText_(payload.name, 30),
    Number(answer.typeReq) || Number(payload.level) || 1,
    Number(answer.number) || "",
    safeText_(answer.divisors, 40),
    safeText_(answer.selectedAnswer, 160),
    safeText_(answer.correctAnswer, 160),
    answer.isCorrect ? "是" : "否",
    Number(answer.timeTaken) || 0,
    answer.usedHint ? "有" : "無",
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
}

function updateBoss_(sheet, className, damage) {
  const rows = dataRows_(sheet, 4);
  let index = rows.findIndex((row) => row[0] === className);
  if (index < 0) {
    sheet.appendRow([className, 10000, 10000, new Date()]);
    return;
  }
  const row = index + 2;
  const current = Number(rows[index][1]) || 10000;
  const maximum = Number(rows[index][2]) || 10000;
  const safeDamage = clamp_(damage, 0, 1000);
  sheet.getRange(row, 2, 1, 3).setValues([[Math.max(0, current - safeDamage), maximum, new Date()]]);
}

function getClassState_(sheet, className) {
  const rows = dataRows_(sheet, 4);
  const row = rows.find((item) => item[0] === className);
  return { bossHp: Number(row && row[1]) || 10000, bossMaxHp: Number(row && row[2]) || 10000 };
}

function resetClass_(className) {
  if (!className) throw new Error("Missing className");
  const spreadsheet = spreadsheet_();
  deleteMatchingRows_(spreadsheet.getSheetByName(PLAYER_SHEET), 1, className);
  deleteMatchingRows_(spreadsheet.getSheetByName(ANSWER_SHEET), 2, className);
  const classSheet = spreadsheet.getSheetByName(CLASS_SHEET);
  const rows = dataRows_(classSheet, 4);
  const index = rows.findIndex((row) => row[0] === className);
  if (index >= 0) classSheet.getRange(index + 2, 2, 1, 3).setValues([[10000, 10000, new Date()]]);
  return { ok: true, className };
}

function deleteMatchingRows_(sheet, column, value) {
  for (let row = sheet.getLastRow(); row >= 2; row -= 1) {
    if (sheet.getRange(row, column).getValue() === value) sheet.deleteRow(row);
  }
}

function dataRows_(sheet, columns) {
  const lastRow = sheet.getLastRow();
  return lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, columns).getValues();
}

function playerFromRow_(row) {
  const totalAnswers = Number(row[8]) || 0;
  const correctAnswers = Number(row[9]) || 0;
  return {
    className: row[0], id: Number(row[1]), name: row[2], level: Number(row[3]) || 1,
    hp: Number(row[4]) || 0, exp: Number(row[5]) || 0, combo: Number(row[6]) || 0,
    totalDamage: Number(row[7]) || 0, damage: Number(row[7]) || 0,
    totalAnswers, totalAns: totalAnswers, correctAnswers,
    acc: totalAnswers ? correctAnswers / totalAnswers : 0,
    mistakes: Number(row[10]) || 0,
  };
}

function validatePayload_(payload) {
  if (!ALLOWED_CLASSES.includes(payload.className)) throw new Error("Invalid class");
  const id = Number(payload.id);
  if (!Number.isInteger(id) || id < 1 || id > 5) throw new Error("Invalid student id");
  if (!payload.name || String(payload.name).length > 30) throw new Error("Invalid player name");
}

function safeText_(value, maxLength) {
  let text = String(value || "").slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function clamp_(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ensureGemSheets_(spreadsheet) {
  let player = spreadsheet.getSheetByName(GEM_PLAYER_SHEET);
  let answer = spreadsheet.getSheetByName(GEM_ANSWER_SHEET);
  if (!player) { player = spreadsheet.insertSheet(GEM_PLAYER_SHEET); player.appendRow(["班別", "學號", "姓名", "已答對寶石", "最後上線"]); player.setFrozenRows(1); }
  if (!answer) { answer = spreadsheet.insertSheet(GEM_ANSWER_SHEET); answer.appendRow(["時間", "班別", "學號", "姓名", "寶石編號", "是否答對", "作答識別碼"]); answer.setFrozenRows(1); }
  return { player, answer };
}

function validateGemPayload_(payload) {
  if (!GEM_CLASSES.includes(String(payload.className))) throw new Error("Invalid class");
  const id = Number(payload.id);
  if (!Number.isInteger(id) || id < 1 || id > 5) throw new Error("Invalid student id");
  if (!payload.name || String(payload.name).length > 30) throw new Error("Invalid player name");
  const gemIndex = Number(payload.gemIndex);
  if (!Number.isInteger(gemIndex) || gemIndex < 0 || gemIndex > 6) throw new Error("Invalid gem");
  if (!payload.attemptId || String(payload.attemptId).length > 120) throw new Error("Invalid attempt");
}

function loadGemPlayer_(className, studentId, name) {
  if (!GEM_CLASSES.includes(String(className))) throw new Error("Invalid class");
  const sheets = ensureGemSheets_(spreadsheet_());
  const id = Number(studentId);
  let row = dataRows_(sheets.player, 5).find((item) => item[0] === className && Number(item[1]) === id);
  if (!row && name) { sheets.player.appendRow([className, id, safeText_(name, 30), "[]", new Date()]); row = [className, id, safeText_(name, 30), "[]", new Date()]; }
  return { progress: { unlocked: row ? gemUnlocked_(row[3]) : [] }, player: row ? { className: row[0], id:Number(row[1]), name:row[2] } : null };
}

function getGemDashboardData_(className) {
  if (className && !GEM_CLASSES.includes(String(className))) throw new Error("Invalid class");
  const sheets = ensureGemSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 5).filter((row) => !className || row[0] === className).map((row) => ({ className:row[0], id:Number(row[1]), name:row[2], unlocked:gemUnlocked_(row[3]) }));
  const attempts = dataRows_(sheets.answer, 7).filter((row) => !className || row[1] === className).map((row) => ({ timestamp:row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""), className:row[1], id:Number(row[2]), name:row[3], gemIndex:Number(row[4]), isCorrect:row[5] === "是", attemptId:row[6] }));
  const completedAt = {};
  attempts.filter((item) => item.isCorrect).forEach((item) => { const key = `${item.className}-${item.id}`; if (!completedAt[key] || item.timestamp > completedAt[key]) completedAt[key] = item.timestamp; });
  players.forEach((player) => { player.lastCompletedAt = completedAt[`${player.className}-${player.id}`] || ""; });
  return { players, attempts, gems:gemDashboardGems_(players, attempts) };
}

function gemDashboardGems_(players, attempts) {
  const names = ["石","排","灣","公","立","學","校"], titles = ["加法之光","減法之光","奇數之光","倍增之光","縮小之光","三倍之光","正負魔法"];
  return names.map((char, gemIndex) => {
    const correctKeys = new Set(players.filter((p) => p.unlocked.includes(gemIndex)).map((p) => `${p.className}-${p.id}`));
    const wrongKeys = new Set(attempts.filter((a) => a.gemIndex === gemIndex && !a.isCorrect).map((a) => `${a.className}-${a.id}`));
    correctKeys.forEach((key) => wrongKeys.delete(key));
    const pending = players.filter((p) => !correctKeys.has(`${p.className}-${p.id}`) && !wrongKeys.has(`${p.className}-${p.id}`));
    return { char, name:titles[gemIndex], correct:players.filter((p) => correctKeys.has(`${p.className}-${p.id}`)), wrong:players.filter((p) => wrongKeys.has(`${p.className}-${p.id}`)), pending };
  });
}

function gemUnlocked_(value) {
  try { const list = JSON.parse(String(value || "[]")); return Array.isArray(list) ? list.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : []; } catch (error) { return []; }
}

function saveGemAttempt_(spreadsheet, payload) {
  const sheets = ensureGemSheets_(spreadsheet);
  const attemptRows = dataRows_(sheets.answer, 7);
  if (attemptRows.some((row) => String(row[6]) === String(payload.attemptId))) return;
  const playerRows = dataRows_(sheets.player, 5);
  const index = playerRows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  const unlocked = index >= 0 ? gemUnlocked_(playerRows[index][3]) : [];
  if (payload.isCorrect && !unlocked.includes(Number(payload.gemIndex))) unlocked.push(Number(payload.gemIndex));
  const playerValues = [[safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30), JSON.stringify(unlocked.sort((a, b) => a - b)), new Date()]];
  if (index >= 0) sheets.player.getRange(index + 2, 1, 1, 5).setValues(playerValues); else sheets.player.getRange(sheets.player.getLastRow() + 1, 1, 1, 5).setValues(playerValues);
  sheets.answer.getRange(sheets.answer.getLastRow() + 1, 1, 1, 7).setValues([[new Date(), safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30), Number(payload.gemIndex), payload.isCorrect ? "是" : "否", safeText_(payload.attemptId, 120)]]);
  SpreadsheetApp.flush();
}

function ensureSimplifySheets_(spreadsheet) {
  let player = spreadsheet.getSheetByName(SIMPLIFY_PLAYER_SHEET);
  let answer = spreadsheet.getSheetByName(SIMPLIFY_ANSWER_SHEET);
  let classState = spreadsheet.getSheetByName(SIMPLIFY_CLASS_SHEET);
  if (!player) {
    player = spreadsheet.insertSheet(SIMPLIFY_PLAYER_SHEET);
    player.appendRow(["班別", "學號", "姓名", "程度", "經驗", "作答數", "答對數", "連勝", "連錯", "最後上線"]);
    player.setFrozenRows(1);
  }
  if (!answer) {
    answer = spreadsheet.insertSheet(SIMPLIFY_ANSWER_SHEET);
    answer.appendRow(["時間", "班別", "學號", "姓名", "程度", "題目", "學生答案", "正確答案", "是否正確"]);
    answer.setFrozenRows(1);
  }
  if (!classState) {
    classState = spreadsheet.insertSheet(SIMPLIFY_CLASS_SHEET);
    classState.appendRow(["班別", "首領能量", "能量上限", "最後更新"]);
    RATIONAL_CLASSES.forEach((className) => classState.appendRow([className, SIMPLIFY_BOSS_HP, SIMPLIFY_BOSS_HP, new Date()]));
    classState.setFrozenRows(1);
  }
  return { player, answer, classState };
}

function simplifyReceiptKey_(className, id) {
  if (!RATIONAL_CLASSES.includes(className) || !Number.isInteger(Number(id)) || Number(id) < 1 || Number(id) > 34 || (className === "SG1B" && Number(id) === 29)) throw new Error("Invalid student");
  return `simplify-receipts:${className}:${Number(id)}`;
}

function loadSimplifyPlayer_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureSimplifySheets_(spreadsheet_());
  const id = Number(studentId);
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const classRow = dataRows_(sheets.classState, 4).find((item) => item[0] === className);
  const state = simplifyStateValues_(classRow);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: simplifyLevelStats_(answerRows),
    bossHp: state.bossHp,
    bossMaxHp: state.bossMaxHp,
  };
}

function getSimplifyDashboardData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureSimplifySheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const states = dataRows_(sheets.classState, 4)
    .filter((row) => !className || row[0] === className)
    .map(simplifyStateValues_);
  const answerRows = dataRows_(sheets.answer, 9).filter((row) => !className || row[1] === className);
  return {
    players,
    levelStats: [1,2,3,4,5,6].map((level) => {
      const result = { level, total:0, correct:0, accuracy:0 };
      players.forEach((player) => {
        const stats = simplifyStudentStats_(player.className, player.id, answerRows.filter((row) => row[1] === player.className && Number(row[2]) === player.id));
        result.total += stats[level - 1].total; result.correct += stats[level - 1].correct;
      });
      result.accuracy = result.total ? result.correct / result.total : 0; return result;
    }),
    bossHp: states.reduce((sum, state) => sum + state.bossHp, 0),
    bossMaxHp: states.reduce((sum, state) => sum + state.bossMaxHp, 0) || SIMPLIFY_BOSS_HP,
  };
}

function getCachedSimplifyDashboardData_(className) {
  const cache = CacheService.getScriptCache();
  const key = simplifyDashboardCacheKey_(className);
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const data = getSimplifyDashboardData_(className);
  cache.put(key, JSON.stringify(data), DASHBOARD_CACHE_SECONDS);
  return data;
}

function getSimplifyExportData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureSimplifySheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const answers = dataRows_(sheets.answer, 9)
    .filter((row) => !className || row[1] === className)
    .map(simplifyAnswerFromRow_);
  return { players, answers };
}

function getSimplifyStudentExportData_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const id = Number(studentId);
  if (!Number.isInteger(id) || id < 1 || id > 34 || (className === "SG1B" && id === 29)) throw new Error("Invalid student id");
  const sheets = ensureSimplifySheets_(spreadsheet_());
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: simplifyStudentStats_(className, id, answerRows),
    wrongAnswers: answerRows.filter((item) => item[8] !== "是").map((item) => ({
      timestamp:item[0] instanceof Date ? item[0].toISOString() : String(item[0] || ""),
      level:Number(item[4]) || 1, question:item[5], studentAnswer:item[6], correctAnswer:item[7],
    })),
  };
}

function simplifyStudentStats_(className, id, answerRows) {
  const saved = JSON.parse(PropertiesService.getScriptProperties().getProperty(`simplify-stats:${className}:${Number(id)}`) || "{}");
  return simplifyLevelStats_(answerRows).map((stats) => {
    const baseline = saved[stats.level];
    if (baseline && Number(baseline.total) > stats.total) return { level:stats.level, total:Number(baseline.total), correct:Number(baseline.correct) || 0, streak:Number(baseline.streak) || 0, accuracy:Number(baseline.correct || 0) / Number(baseline.total) };
    return stats;
  });
}

function simplifyLevelStats_(answerRows) {
  const stats = [1,2,3,4,5,6].map((level) => ({ level, total:0, correct:0, streak:0, accuracy:0 }));
  answerRows.forEach((row) => {
    const item = stats[clamp_(Number(row[4]) || 1, 1, 6) - 1];
    item.total += 1;
    if (row[8] === "是") { item.correct += 1; item.streak += 1; }
    else item.streak = 0;
  });
  stats.forEach((item) => { item.accuracy = item.total ? item.correct / item.total : 0; });
  return stats;
}

function simplifyAnswerFromRow_(row) {
  return {
    timestamp:row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
    className:row[1], id:Number(row[2]), name:row[3], level:Number(row[4]) || 1,
    question:row[5], studentAnswer:row[6], correctAnswer:row[7], isCorrect:row[8] === "是",
  };
}

function saveSimplifyPlayer_(sheet, payload) {
  const rows = dataRows_(sheet, 10);
  const rowIndex = rows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  if (rowIndex >= 0 && Number(rows[rowIndex][5]) > Number(payload.total || 0)) return;
  const values = [[
    safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(payload.level) || 1, 1, 6), clamp_(Number(payload.xp) || 0, 0, 500),
    clamp_(Number(payload.total) || 0, 0, 1000000), clamp_(Number(payload.correct) || 0, 0, 1000000),
    clamp_(Number(payload.streak) || 0, 0, 100000), clamp_(Number(payload.mistakes) || 0, 0, 1000), new Date(),
  ]];
  if (rowIndex >= 0) sheet.getRange(rowIndex + 2, 1, 1, 10).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues(values);
}

function appendSimplifyAnswers_(sheet, payload) {
  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 10) : [];
  if (!answers.length) return;
  const rows = answers.map((answer) => [
    new Date(), safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(answer.level) || 1, 1, 6), safeText_(answer.question, 240),
    safeText_(answer.studentAnswer, 80), safeText_(answer.correctAnswer, 80), answer.isCorrect ? "是" : "否",
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
}

function updateSimplifyBoss_(sheet, className, damage) {
  const rows = dataRows_(sheet, 4);
  const index = rows.findIndex((row) => row[0] === className);
  if (index < 0) return;
  const state = simplifyStateValues_(rows[index]);
  sheet.getRange(index + 2, 2, 1, 3).setValues([[Math.max(0, state.bossHp - clamp_(damage, 0, 100)), state.bossMaxHp, new Date()]]);
}

function simplifyStateValues_(row) {
  if (!row) return { bossHp:SIMPLIFY_BOSS_HP, bossMaxHp:SIMPLIFY_BOSS_HP };
  const previousMax = Math.max(1, Number(row[2]) || SIMPLIFY_BOSS_HP);
  const previousHp = Math.max(0, Math.min(previousMax, Number.isFinite(Number(row[1])) ? Number(row[1]) : previousMax));
  return { bossHp:Math.max(0, SIMPLIFY_BOSS_HP - (previousMax - previousHp)), bossMaxHp:SIMPLIFY_BOSS_HP };
}

function resetSimplifyData_(sheets, className) {
  const properties = PropertiesService.getScriptProperties();
  Object.keys(properties.getProperties()).filter((key) => key.startsWith("simplify-stats:") && (!className || key.startsWith(`simplify-stats:${className}:`))).forEach((key) => properties.deleteProperty(key));
  rewriteRationalRows_(sheets.player, 10, (row) => className && row[0] !== className);
  rewriteRationalRows_(sheets.answer, 9, (row) => className && row[1] !== className);
  dataRows_(sheets.classState, 4).forEach((row, index) => {
    if (!className || row[0] === className) sheets.classState.getRange(index + 2, 2, 1, 3).setValues([[SIMPLIFY_BOSS_HP, SIMPLIFY_BOSS_HP, new Date()]]);
  });
  SpreadsheetApp.flush();
}

function clearSimplifyDashboardCache_(className) {
  const keys = [simplifyDashboardCacheKey_(""), simplifyDashboardCacheKey_(className)];
  if (!className) RATIONAL_CLASSES.forEach((item) => keys.push(simplifyDashboardCacheKey_(item)));
  CacheService.getScriptCache().removeAll(keys);
}

function simplifyDashboardCacheKey_(className) {
  return `simplify-dashboard:${encodeURIComponent(className || "all")}`;
}

function ensureNthTermSheets_(spreadsheet) {
  let player = spreadsheet.getSheetByName(NTH_TERM_PLAYER_SHEET);
  let answer = spreadsheet.getSheetByName(NTH_TERM_ANSWER_SHEET);
  let classState = spreadsheet.getSheetByName(NTH_TERM_CLASS_SHEET);
  if (!player) {
    player = spreadsheet.insertSheet(NTH_TERM_PLAYER_SHEET);
    player.appendRow(["班別", "學號", "姓名", "程度", "經驗", "作答數", "答對數", "連勝", "連錯", "最後上線"]);
    player.setFrozenRows(1);
  }
  if (!answer) {
    answer = spreadsheet.insertSheet(NTH_TERM_ANSWER_SHEET);
    answer.appendRow(["時間", "班別", "學號", "姓名", "程度", "題目", "學生答案", "正確答案", "是否正確"]);
    answer.setFrozenRows(1);
  }
  if (!classState) {
    classState = spreadsheet.insertSheet(NTH_TERM_CLASS_SHEET);
    classState.appendRow(["班別", "首領能量", "能量上限", "最後更新"]);
    RATIONAL_CLASSES.forEach((className) => classState.appendRow([className, NTH_TERM_BOSS_HP, NTH_TERM_BOSS_HP, new Date()]));
    classState.setFrozenRows(1);
  }
  return { player, answer, classState };
}

function nthTermReceiptKey_(className, id) {
  if (!RATIONAL_CLASSES.includes(className) || !Number.isInteger(Number(id)) || Number(id) < 1 || Number(id) > 34 || (className === "SG1B" && Number(id) === 29)) throw new Error("Invalid student");
  return `nth-term-receipts:${className}:${Number(id)}`;
}

function loadNthTermPlayer_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureNthTermSheets_(spreadsheet_());
  const id = Number(studentId);
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  const classRow = dataRows_(sheets.classState, 4).find((item) => item[0] === className);
  const state = nthTermStateValues_(classRow);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: nthTermLevelStats_(answerRows),
    bossHp: state.bossHp,
    bossMaxHp: state.bossMaxHp,
  };
}

function getNthTermDashboardData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureNthTermSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const states = dataRows_(sheets.classState, 4)
    .filter((row) => !className || row[0] === className)
    .map(nthTermStateValues_);
  const answerRows = dataRows_(sheets.answer, 9).filter((row) => !className || row[1] === className);
  return {
    players,
    levelStats: [1,2,3,4,5].map((level) => {
      const result = { level, total:0, correct:0, accuracy:0 };
      players.forEach((player) => {
        const stats = nthTermStudentStats_(player.className, player.id, answerRows.filter((row) => row[1] === player.className && Number(row[2]) === player.id));
        result.total += stats[level - 1].total; result.correct += stats[level - 1].correct;
      });
      result.accuracy = result.total ? result.correct / result.total : 0; return result;
    }),
    bossHp: states.reduce((sum, state) => sum + state.bossHp, 0),
    bossMaxHp: states.reduce((sum, state) => sum + state.bossMaxHp, 0) || NTH_TERM_BOSS_HP,
  };
}

function getCachedNthTermDashboardData_(className) {
  const cache = CacheService.getScriptCache();
  const key = nthTermDashboardCacheKey_(className);
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const data = getNthTermDashboardData_(className);
  cache.put(key, JSON.stringify(data), DASHBOARD_CACHE_SECONDS);
  return data;
}

function getNthTermExportData_(className) {
  if (className && !RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const sheets = ensureNthTermSheets_(spreadsheet_());
  const players = dataRows_(sheets.player, 10)
    .filter((row) => !className || row[0] === className)
    .map(rationalPlayerFromRow_);
  const answers = dataRows_(sheets.answer, 9)
    .filter((row) => !className || row[1] === className)
    .map(nthTermAnswerFromRow_);
  return { players, answers };
}

function getNthTermStudentExportData_(className, studentId) {
  if (!RATIONAL_CLASSES.includes(className)) throw new Error("Invalid class");
  const id = Number(studentId);
  if (!Number.isInteger(id) || id < 1 || id > 34 || (className === "SG1B" && id === 29)) throw new Error("Invalid student id");
  const sheets = ensureNthTermSheets_(spreadsheet_());
  const row = dataRows_(sheets.player, 10).find((item) => item[0] === className && Number(item[1]) === id);
  const answerRows = dataRows_(sheets.answer, 9).filter((item) => item[1] === className && Number(item[2]) === id);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
    levelStats: nthTermStudentStats_(className, id, answerRows),
    wrongAnswers: answerRows.filter((item) => item[8] !== "是").map((item) => ({
      timestamp:item[0] instanceof Date ? item[0].toISOString() : String(item[0] || ""),
      level:Number(item[4]) || 1, question:item[5], studentAnswer:item[6], correctAnswer:item[7],
    })),
  };
}

function nthTermStudentStats_(className, id, answerRows) {
  const saved = JSON.parse(PropertiesService.getScriptProperties().getProperty(`nth-term-stats:${className}:${Number(id)}`) || "{}");
  return nthTermLevelStats_(answerRows).map((stats) => {
    const baseline = saved[stats.level];
    if (baseline && Number(baseline.total) > stats.total) return { level:stats.level, total:Number(baseline.total), correct:Number(baseline.correct) || 0, streak:Number(baseline.streak) || 0, accuracy:Number(baseline.correct || 0) / Number(baseline.total) };
    return stats;
  });
}

function nthTermLevelStats_(answerRows) {
  const stats = [1,2,3,4,5].map((level) => ({ level, total:0, correct:0, streak:0, accuracy:0 }));
  answerRows.forEach((row) => {
    const item = stats[clamp_(Number(row[4]) || 1, 1, 5) - 1];
    item.total += 1;
    if (row[8] === "是") { item.correct += 1; item.streak += 1; }
    else item.streak = 0;
  });
  stats.forEach((item) => { item.accuracy = item.total ? item.correct / item.total : 0; });
  return stats;
}

function nthTermAnswerFromRow_(row) {
  return {
    timestamp:row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
    className:row[1], id:Number(row[2]), name:row[3], level:Number(row[4]) || 1,
    question:row[5], studentAnswer:row[6], correctAnswer:row[7], isCorrect:row[8] === "是",
  };
}

function saveNthTermPlayer_(sheet, payload) {
  const rows = dataRows_(sheet, 10);
  const rowIndex = rows.findIndex((row) => row[0] === payload.className && Number(row[1]) === Number(payload.id));
  if (rowIndex >= 0 && Number(rows[rowIndex][5]) > Number(payload.total || 0)) return;
  const values = [[
    safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(payload.level) || 1, 1, 5), clamp_(Number(payload.xp) || 0, 0, 500),
    clamp_(Number(payload.total) || 0, 0, 1000000), clamp_(Number(payload.correct) || 0, 0, 1000000),
    clamp_(Number(payload.streak) || 0, 0, 100000), clamp_(Number(payload.mistakes) || 0, 0, 1000), new Date(),
  ]];
  if (rowIndex >= 0) sheet.getRange(rowIndex + 2, 1, 1, 10).setValues(values);
  else sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues(values);
}

function appendNthTermAnswers_(sheet, payload) {
  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 10) : [];
  if (!answers.length) return;
  const rows = answers.map((answer) => [
    new Date(), safeText_(payload.className, 12), Number(payload.id), safeText_(payload.name, 30),
    clamp_(Number(answer.level) || 1, 1, 5), safeText_(answer.question, 240),
    safeText_(answer.studentAnswer, 80), safeText_(answer.correctAnswer, 80), answer.isCorrect ? "是" : "否",
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
}

function updateNthTermBoss_(sheet, className, damage) {
  const rows = dataRows_(sheet, 4);
  const index = rows.findIndex((row) => row[0] === className);
  if (index < 0) return;
  const state = nthTermStateValues_(rows[index]);
  sheet.getRange(index + 2, 2, 1, 3).setValues([[Math.max(0, state.bossHp - clamp_(damage, 0, 450)), state.bossMaxHp, new Date()]]);
}

function nthTermStateValues_(row) {
  if (!row) return { bossHp:NTH_TERM_BOSS_HP, bossMaxHp:NTH_TERM_BOSS_HP };
  const previousMax = Math.max(1, Number(row[2]) || NTH_TERM_BOSS_HP);
  const previousHp = Math.max(0, Math.min(previousMax, Number.isFinite(Number(row[1])) ? Number(row[1]) : previousMax));
  return { bossHp:Math.max(0, NTH_TERM_BOSS_HP - (previousMax - previousHp)), bossMaxHp:NTH_TERM_BOSS_HP };
}

function resetNthTermData_(sheets, className) {
  const properties = PropertiesService.getScriptProperties();
  Object.keys(properties.getProperties()).filter((key) => key.startsWith("nth-term-stats:") && (!className || key.startsWith(`nth-term-stats:${className}:`))).forEach((key) => properties.deleteProperty(key));
  rewriteRationalRows_(sheets.player, 10, (row) => className && row[0] !== className);
  rewriteRationalRows_(sheets.answer, 9, (row) => className && row[1] !== className);
  dataRows_(sheets.classState, 4).forEach((row, index) => {
    if (!className || row[0] === className) sheets.classState.getRange(index + 2, 2, 1, 3).setValues([[NTH_TERM_BOSS_HP, NTH_TERM_BOSS_HP, new Date()]]);
  });
  SpreadsheetApp.flush();
}

function clearNthTermDashboardCache_(className) {
  const keys = [nthTermDashboardCacheKey_(""), nthTermDashboardCacheKey_(className)];
  if (!className) RATIONAL_CLASSES.forEach((item) => keys.push(nthTermDashboardCacheKey_(item)));
  CacheService.getScriptCache().removeAll(keys);
}

function nthTermDashboardCacheKey_(className) {
  return `nth-term-dashboard:${encodeURIComponent(className || "all")}`;
}
