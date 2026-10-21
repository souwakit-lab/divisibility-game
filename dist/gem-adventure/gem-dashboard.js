const API_URL = window.DIVISIBILITY_CONFIG?.apiUrl || "";
const LOCAL_KEY = "gem-adventure-classroom-v1";
const GEMS = [
  {char:"石", name:"加法之光", color:"#5abde8"}, {char:"排", name:"減法之光", color:"#a991ff"}, {char:"灣", name:"奇數之光", color:"#50d4bc"},
  {char:"公", name:"倍增之光", color:"#f4b75d"}, {char:"立", name:"縮小之光", color:"#f38fae"}, {char:"學", name:"三倍之光", color:"#72a8f6"}, {char:"校", name:"正負魔法", color:"#afd978"},
];
const STUDENT_NAMES = {
  SG1A: ["歐陽周政","歐芷菱","蔡銀杰","陳俊希","陳炯文","陳宇恆","陳柏豪","卓莉珊","莊超穎","鍾欣澄","馮子軒","黃鈞亮","林立","李振豪","李梓琪","李沁穎","李宇杰","梁依靜","梁羽盈","盧佩辰","黃夢琪","趙家美","歐陽浩賢","陳家莉","歐承澔","張子茵","徐希瑜","邢嘉豪","楊昊宇","邱嘉成","郭添滿","王思淇","黃鈺裕","黃健樺"],
  SG1B: ["陳毅","曾蔚喬","鄭凱琳","陳思如","程家儀","張芯然","蔡朗然","董詩予","馮家宥","管梓皓","黎芷盈","劉德偉","李善婷","李雅琪","凌寶旋","吳靖怡","宋允曦","譚梓軒","譚詩敏","袁渟欣","曾凱龍","鄭家林","張昊臻","何家浩","陳梓峰","林灝晴","林文軒","梁王恩",null,"盧家豪","勞允睿","勞允堤","黃曉樂","王敬興"],
};
const STUDENTS = Object.fromEntries(Object.entries(STUDENT_NAMES).map(([className, names]) => [className, Object.fromEntries(names.map((name, index) => [index + 1, name]).filter(([, name]) => name))]));
const $ = (id) => document.getElementById(id); let latest = null;
function init() {
  Object.keys(STUDENTS).forEach((cls) => $("class-filter").add(new Option(cls, cls)));
  $("class-filter").addEventListener("change", refresh); $("reset-button").addEventListener("click", resetData); $("close-modal").addEventListener("click", closeModal); $("modal-backdrop").addEventListener("click", (e) => { if (e.target.id === "modal-backdrop") closeModal(); }); document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  refresh(); window.setInterval(refresh, 6000); document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
}
async function refresh() {
  try { const remote = API_URL ? await (await fetch(`${API_URL}?action=getGemDashboardData&className=${encodeURIComponent($("class-filter").value)}&t=${Date.now()}`)).json() : null; latest = remote?.gems ? remote : localData($("class-filter").value); render(latest); } catch (error) { console.error(error); latest = localData($("class-filter").value); render(latest); $("updated-at").textContent = "本機備援"; }
}
function localData(className) {
  let db; try { db = JSON.parse(localStorage.getItem(LOCAL_KEY)) || {players:{},attempts:[]}; } catch { db={players:{},attempts:[]}; }
  const players = Object.values(db.players || {}).filter((p) => !className || p.className === className).map((p) => ({...p, id:Number(p.id), unlocked:p.unlocked || []}));
  const attempts = (db.attempts || []).filter((a) => !className || a.className === className);
  return buildData(players, attempts);
}
function buildData(players, attempts) {
  const completedAt = new Map(); attempts.filter((a) => a.isCorrect).forEach((a) => { const key = `${a.className}-${a.id}`; const current = completedAt.get(key) || ""; if (a.timestamp > current) completedAt.set(key, a.timestamp); });
  players = players.map((p) => ({...p, lastCompletedAt: completedAt.get(`${p.className}-${p.id}`) || ""}));
  const gems = GEMS.map((gem, gemIndex) => { const correct = new Set(players.filter((p) => p.unlocked.includes(gemIndex)).map((p) => `${p.className}-${p.id}`)); const wrong = new Set(attempts.filter((a) => a.gemIndex === gemIndex && !a.isCorrect && !correct.has(`${a.className}-${a.id}`)).map((a) => `${a.className}-${a.id}`)); const pending = players.filter((p) => !correct.has(`${p.className}-${p.id}`) && !wrong.has(`${p.className}-${p.id}`)); return { ...gem, correct:[...correct].map((key) => players.find((p) => `${p.className}-${p.id}` === key)).filter(Boolean), wrong:[...wrong].map((key) => players.find((p) => `${p.className}-${p.id}` === key)).filter(Boolean), pending }; });
  return { players, attempts, gems };
}
function render(data) {
  $("stat-players").textContent = data.players.length; $("stat-gems").textContent = data.players.reduce((sum, player) => sum + player.unlocked.length, 0); $("updated-at").textContent = new Date().toLocaleTimeString("zh-Hant", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
  $("gem-grid").innerHTML = data.gems.map((g, i) => `<button class="gem-card" style="--gem:${GEMS[i].color}" data-gem="${i}" aria-label="「${GEMS[i].char}」${g.correct.length}人答對">${teacherGemSvg(GEMS[i], i)}<span class="gem-answer-count">${g.correct.length}人答對</span></button>`).join("");
  const ranking = [...data.players].sort((a, b) => b.unlocked.length - a.unlocked.length || String(a.lastCompletedAt || "9999").localeCompare(String(b.lastCompletedAt || "9999")) || String(a.name).localeCompare(String(b.name)));
  $("leaderboard").innerHTML = ranking.length ? ranking.map((p, i) => `<div class="leader-row"><span class="rank">${i + 1}</span><span class="name">${escapeHtml(p.name)}<small>${escapeHtml(p.className)} ${p.id}號</small></span><span class="score">${p.unlocked.length} 顆</span></div>`).join("") : '<div class="person">尚未有學生登入</div>';
  document.querySelectorAll("[data-gem]").forEach((button) => button.addEventListener("click", () => openModal(data.gems[Number(button.dataset.gem)])));
}
function teacherGemSvg(gem, index) {
  return `<svg class="teacher-gem-art" viewBox="0 0 120 135" aria-hidden="true"><defs><linearGradient id="teacher-gem-${index}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".27" stop-color="${gem.color}"/><stop offset="1" stop-color="#30294a"/></linearGradient></defs><path d="M60 4 L102 35 L92 90 L60 127 L28 90 L18 35 Z" fill="url(#teacher-gem-${index})" stroke="#ffe5ad" stroke-width="3"/><path d="M18 35 L60 52 L102 35 M60 52 L60 127 M60 4 L60 52 M28 90 L60 52 L92 90" stroke="#fff" stroke-opacity=".47" stroke-width="2" fill="none"/><text class="teacher-gem-char" x="60" y="84" text-anchor="middle">${gem.char}</text></svg>`;
}
function openModal(gem) { $("modal-content").innerHTML = `<h2>💎 「${gem.char}」</h2>${roster("已答對名單", gem.correct, "correct")}${roster("答錯名單", gem.wrong, "wrong")}${roster("未答對名單", gem.pending, "pending")}`; $("modal-backdrop").hidden = false; }
function roster(title, list, cls) { return `<div class="roster-section"><h3 class="${cls}">${title}（${list.length}）</h3><div class="roster-list">${list.length ? list.map((p) => `<div class="person">${escapeHtml(p.name)}<small>${escapeHtml(p.className)} ${p.id}號</small></div>`).join("") : '<div class="person">暫無學生</div>'}</div></div>`; }
function closeModal() { $("modal-backdrop").hidden = true; }
async function resetData() {
  const className = $("class-filter").value;
  const label = className || "全部班別";
  if (!window.confirm(`確定要重置${label}的七寶石數據嗎？此操作不能復原。`)) return;
  const button = $("reset-button"); button.disabled = true; button.textContent = "重置中…";
  try {
    if (API_URL) {
      const response = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}, body:`action=resetGem&data=${encodeURIComponent(JSON.stringify({className}))}` });
      const result = await response.json(); if (!result.ok) throw new Error(result.error || "remote reset failed");
    }
    resetLocalData(className); await refresh();
  } catch (error) { console.error(error); resetLocalData(className); await refresh(); $("updated-at").textContent = "已重置本機資料"; }
  button.disabled = false; button.textContent = "重置數據";
}
function resetLocalData(className) {
  if (!className) { localStorage.removeItem(LOCAL_KEY); return; }
  const db = (() => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {players:{},attempts:[]}; } catch { return {players:{},attempts:[]}; } })();
  Object.keys(db.players || {}).forEach((key) => { if (db.players[key].className === className) delete db.players[key]; });
  db.attempts = (db.attempts || []).filter((attempt) => attempt.className !== className); localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
}
function escapeHtml(value) { const el=document.createElement("span"); el.textContent=value; return el.innerHTML; }
document.addEventListener("DOMContentLoaded", init);
