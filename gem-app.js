const API_URL = window.DIVISIBILITY_CONFIG?.apiUrl || "";
const LOCAL_KEY = "gem-adventure-classroom-v1";
const GAME_KEY = "seven_school_gems_math_doc_v4";
const STUDENT_NAMES = {
  SG1A: ["歐陽周政","歐芷菱","蔡銀杰","陳俊希","陳炯文","陳宇恆","陳柏豪","卓莉珊","莊超穎","鍾欣澄","馮子軒","黃鈞亮","林立","李振豪","李梓琪","李沁穎","李宇杰","梁依靜","梁羽盈","盧佩辰","黃夢琪","趙家美","歐陽浩賢","陳家莉","歐承澔","張子茵","徐希瑜","邢嘉豪","楊昊宇","邱嘉成","郭添滿","王思淇","黃鈺裕","黃健樺"],
  SG1B: ["陳毅","曾蔚喬","鄭凱琳","陳思如","程家儀","張芯然","蔡朗然","董詩予","馮家宥","管梓皓","黎芷盈","劉德偉","李善婷","李雅琪","凌寶旋","吳靖怡","宋允曦","譚梓軒","譚詩敏","袁渟欣","曾凱龍","鄭家林","張昊臻","何家浩","陳梓峰","林灝晴","林文軒","梁王恩",null,"盧家豪","勞允睿","勞允堤","黃曉樂","王敬興"],
};
const STUDENTS = Object.fromEntries(Object.entries(STUDENT_NAMES).map(([className, names]) => [className, Object.fromEntries(names.map((name, index) => [index + 1, name]).filter(([, name]) => name))]));
const $ = (id) => document.getElementById(id);
let current = null;

function init() {
  Object.keys(STUDENTS).forEach((cls) => $("class-select").add(new Option(cls, cls)));
  $("class-select").addEventListener("change", updatePreview);
  $("id-select").addEventListener("change", updatePreview);
  $("login-button").addEventListener("click", login);
  $("logout-button").addEventListener("click", () => location.reload());
  $("game-iframe").addEventListener("load", attachGameListener);
  updatePreview();
}
function updatePreview() {
  const cls = $("class-select").value, previous = Number($("id-select").value) || 1;
  $("id-select").innerHTML = "";
  Object.keys(STUDENTS[cls] || {}).forEach((id) => $("id-select").add(new Option(`${id} 號`, id)));
  if (STUDENTS[cls]?.[previous]) $("id-select").value = String(previous);
  const id = Number($("id-select").value);
  $("student-preview").textContent = STUDENTS[cls]?.[id] ? `${cls} · ${id} 號 · ${STUDENTS[cls][id]}` : "請選擇班別與學號";
}
async function login() {
  const className = $("class-select").value, id = Number($("id-select").value), name = STUDENTS[className]?.[id];
  if (!name) return;
  const button = $("login-button"); button.disabled = true; $("login-status").textContent = "正在讀取你的寶石進度…";
  try {
    const remote = API_URL ? await fetchJson(`${API_URL}?action=loadGemPlayer&className=${encodeURIComponent(className)}&id=${id}&name=${encodeURIComponent(name)}`) : null;
    const loaded = remote?.progress ? remote : loadLocal(className, id, name);
    const unlocked = Array.isArray(loaded?.progress?.unlocked) ? loaded.progress.unlocked : [];
    current = { className, id, name, unlocked };
    localStorage.setItem(GAME_KEY, JSON.stringify(unlocked));
    $("identity").textContent = `${className} ${id} 號｜${name}`;
    $("login-card").hidden = true; $("game-frame").hidden = false;
    $("game-iframe").contentWindow.location.reload();
  } catch (error) {
    console.error(error); $("login-status").textContent = "資料連線失敗，請稍後再試。"; button.disabled = false;
  }
}
function attachGameListener() {
  const frame = $("game-iframe"), doc = frame.contentDocument;
  if (!doc) return;
  const reset = doc.getElementById("reset"); if (reset) reset.hidden = true;
  doc.addEventListener("click", (event) => {
    const button = event.target.closest?.("#verify");
    if (!button || button.textContent.includes("返回")) return;
    window.setTimeout(() => {
      if (!current) return;
      const note = doc.querySelector("#note .note");
      if (!note) return;
      const title = doc.querySelector("#pTitle")?.textContent || "";
      const gemChar = (title.match(/[石排灣公立學校]/) || [""])[0];
      const gemIndex = ["石","排","灣","公","立","學","校"].indexOf(gemChar);
      if (gemIndex < 0) return;
      const isCorrect = note.classList.contains("good");
      const attemptId = `${current.className}-${current.id}-${gemIndex}-${Date.now()}`;
      sendAttempt({ attemptId, className: current.className, id: current.id, name: current.name, gemIndex, isCorrect });
    }, 60);
  }, true);
}
async function sendAttempt(payload) {
  if (!API_URL) saveLocalAttempt(payload);
  try {
    if (API_URL) { const response = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}, body:`action=saveGem&data=${encodeURIComponent(JSON.stringify(payload))}` }); const result = await response.json(); if (!result.ok) throw new Error(result.error || "remote save failed"); }
  } catch (error) { console.warn("資料尚未送出，已保留本機紀錄", error); saveLocalAttempt(payload); }
}
async function fetchJson(url) { const response = await fetch(url, { cache:"no-store" }); if (!response.ok) throw new Error("request failed"); return response.json(); }
function emptyDb() { return { players:{}, attempts:[] }; }
function readDb() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || emptyDb(); } catch { return emptyDb(); } }
function loadLocal(className, id, name) {
  const db = readDb(), key = `${className}-${id}`;
  const player = db.players[key] || { className, id, name, unlocked:[] };
  db.players[key] = player; localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
  return { progress: { unlocked: player?.unlocked || [] } };
}
function saveLocalAttempt(payload) {
  const db = readDb(), key = `${payload.className}-${payload.id}`;
  const player = db.players[key] || { className:payload.className, id:payload.id, name:payload.name, unlocked:[] };
  if (payload.isCorrect && !player.unlocked.includes(payload.gemIndex)) player.unlocked.push(payload.gemIndex);
  if (!db.attempts.some((item) => item.attemptId === payload.attemptId)) db.attempts.push({...payload, timestamp:new Date().toISOString()});
  db.players[key] = player; localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
}
document.addEventListener("DOMContentLoaded", init);
