const SPREADSHEET_ID = "1gyfVxwpAGriSzL8W-cq98Iq0s_xrPuScYrG_iT3bGEc";
const PLAYER_SHEET = "學生進度";
const ANSWER_SHEET = "作答紀錄";
const CLASS_SHEET = "班級狀態";
const ALLOWED_CLASSES = ["高一甲", "高一乙", "高一丙", "高一丁"];
const DASHBOARD_CACHE_SECONDS = 5;

function doGet(e) {
  const action = String(e.parameter.action || "");
  try {
    if (action === "loadPlayer") return jsonResponse(loadPlayer_(e.parameter.className, e.parameter.id));
    if (action === "getDashboardData") return jsonResponse(getCachedDashboardData_(e.parameter.className || ""));
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
