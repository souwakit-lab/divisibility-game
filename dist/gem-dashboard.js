const API_URL = window.DIVISIBILITY_CONFIG?.apiUrl || "";
const LOCAL_KEY = "gem-adventure-classroom-v1";
const GEMS = [
  {char:"石", name:"加法之光", color:"#5abde8"}, {char:"排", name:"減法之光", color:"#a991ff"}, {char:"灣", name:"奇數之光", color:"#50d4bc"},
  {char:"公", name:"倍增之光", color:"#f4b75d"}, {char:"立", name:"縮小之光", color:"#f38fae"}, {char:"學", name:"三倍之光", color:"#72a8f6"}, {char:"校", name:"正負魔法", color:"#afd978"},
];
const STUDENTS = Object.fromEntries(["SG1A","SG1B"].map((className) => [className, Object.fromEntries(Array.from({length:34}, (_, index) => index + 1).filter((id) => !(className === "SG1B" && id === 29)).map((id) => [id, `${className} ${id}號`]))]));
const $ = (id) => document.getElementById(id); let latest = null;
function init() {
  Object.keys(STUDENTS).forEach((cls) => $("class-filter").add(new Option(cls, cls)));
  $("class-filter").addEventListener("change", refresh); $("fullscreen-button").addEventListener("click", () => document.documentElement.requestFullscreen?.()); $("close-modal").addEventListener("click", closeModal); $("modal-backdrop").addEventListener("click", (e) => { if (e.target.id === "modal-backdrop") closeModal(); });
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
  $("stat-players").textContent = data.players.length; $("stat-correct").textContent = data.gems.reduce((sum, g) => sum + g.correct.length, 0); $("stat-attempts").textContent = data.attempts.length; $("updated-at").textContent = new Date().toLocaleTimeString("zh-Hant", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
  $("gem-grid").innerHTML = data.gems.map((g, i) => `<article class="gem-card" style="--gem:${g.color}"><span class="gem-icon">💎</span><span class="count">${g.correct.length} / ${data.players.length}</span><h2>「${g.char}」${g.name}</h2><div class="bars"><div class="bar correct"><span>答對</span><strong>${g.correct.length}</strong></div><div class="bar wrong"><span>答錯</span><strong>${g.wrong.length}</strong></div><div class="bar pending"><span>未答對</span><strong>${g.pending.length}</strong></div></div><button data-gem="${i}">查看三類名單</button></article>`).join("");
  const ranking = [...data.players].sort((a, b) => b.unlocked.length - a.unlocked.length || String(a.lastCompletedAt || "9999").localeCompare(String(b.lastCompletedAt || "9999")) || String(a.name).localeCompare(String(b.name)));
  $("leaderboard").innerHTML = ranking.length ? ranking.map((p, i) => `<div class="leader-row"><span class="rank">${i + 1}</span><span class="name">${escapeHtml(p.name)}<small>${escapeHtml(p.className)} ${p.id}號</small></span><span class="score">${p.unlocked.length} 顆</span></div>`).join("") : '<div class="person">尚未有學生登入</div>';
  document.querySelectorAll("[data-gem]").forEach((button) => button.addEventListener("click", () => openModal(data.gems[Number(button.dataset.gem)])));
}
function openModal(gem) { $("modal-content").innerHTML = `<h2>💎 「${gem.char}」${gem.name}</h2><p>答對後會自動離開答錯名單。</p>${roster("已答對名單", gem.correct, "correct")}${roster("答錯名單", gem.wrong, "wrong")}${roster("未答對名單", gem.pending, "pending")}`; $("modal-backdrop").hidden = false; }
function roster(title, list, cls) { return `<div class="roster-section"><h3 class="${cls}">${title}（${list.length}）</h3><div class="roster-list">${list.length ? list.map((p) => `<div class="person">${escapeHtml(p.name)}<small>${escapeHtml(p.className)} ${p.id}號</small></div>`).join("") : '<div class="person">暫無學生</div>'}</div></div>`; }
function closeModal() { $("modal-backdrop").hidden = true; }
function escapeHtml(value) { const el=document.createElement("span"); el.textContent=value; return el.innerHTML; }
document.addEventListener("DOMContentLoaded", init);
