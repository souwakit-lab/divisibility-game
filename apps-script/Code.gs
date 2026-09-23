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

function doGet(e) {
  const action = String(e.parameter.action || "");
  try {
    if (action === "loadPlayer") return jsonResponse(loadPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getDashboardData") return jsonResponse(getCachedDashboardData_(e.parameter.className || ""));
    if (action === "loadRationalPlayer") return jsonResponse(loadRationalPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getRationalDashboardData") return jsonResponse(getCachedRationalDashboardData_(e.parameter.className || ""));
    if (action === "getRationalExportData") return jsonResponse(getRationalExportData_(e.parameter.className || ""));
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
  const classRow = dataRows_(sheets.classState, 4).find((item) => item[0] === className);
  const classState = rationalStateValues_(classRow);
  return {
    player: row ? rationalPlayerFromRow_(row) : null,
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
  const levelStats = [1, 2, 3, 4].map((level) => ({ level, total: 0, correct: 0, accuracy: 0 }));
  answerRows.forEach((row) => {
    const level = clamp_(Number(row[4]) || 1, 1, 4);
    const stats = levelStats[level - 1];
    stats.total += 1;
    if (row[8] === "是") stats.correct += 1;
  });
  levelStats.forEach((stats) => {
    stats.accuracy = stats.total ? stats.correct / stats.total : 0;
  });
  return {
    players,
    levelStats,
    bossHp: states.reduce((sum, state) => sum + state.bossHp, 0),
    bossMaxHp: states.reduce((sum, state) => sum + state.bossMaxHp, 0) || RATIONAL_BOSS_HP,
  };
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
