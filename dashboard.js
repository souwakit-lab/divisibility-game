const API_URL = window.DIVISIBILITY_CONFIG?.apiUrl || "";
const LOCAL_KEY = "divisibility-classroom-v1";

let accuracyChart;
let refreshTimer;
let refreshInFlight = false;
let refreshPending = false;
const REFRESH_INTERVAL_MS = 8000;
const $ = (id) => document.getElementById(id);

function initDashboard() {
  initChart();
  initQrCode();
  $("class-filter").addEventListener("change", refreshData);
  $("fullscreen-button").addEventListener("click", toggleFullscreen);
  $("reset-button").addEventListener("click", openResetDialog);
  if (API_URL) $("reset-button").hidden = true;
  $("confirm-reset").addEventListener("click", () => {
    setTimeout(resetClassData, 0);
  });
  if (window.lucide) lucide.createIcons();
  refreshData();
  startRefreshTimer();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.clearInterval(refreshTimer);
    else {
      refreshData();
      startRefreshTimer();
    }
  });
}

function startRefreshTimer() {
  window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(refreshData, REFRESH_INTERVAL_MS);
}

function initChart() {
  if (!window.Chart) return;
  accuracyChart = new Chart($("accuracy-chart"), {
    type: "doughnut",
    data: {
      labels: ["答對", "答錯"],
      datasets: [{ data: [0, 0], backgroundColor: ["#20c886", "#e64b67"], borderWidth: 0, hoverOffset: 3 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      animation: { duration: 450 },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#c5d0e0", boxWidth: 12, padding: 16, font: { family: "Noto Sans TC", size: 11, weight: "700" } },
        },
      },
    },
  });
}

function initQrCode() {
  const studentUrl = window.DIVISIBILITY_CONFIG?.studentUrl || new URL("index.html", location.href).href;
  $("student-link").href = studentUrl;
  if (window.QRCode) {
    new QRCode($("join-qr"), {
      text: studentUrl,
      width: 180,
      height: 180,
      colorDark: "#101827",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }
}

async function refreshData() {
  if (refreshInFlight) {
    refreshPending = true;
    return;
  }
  refreshInFlight = true;
  const className = $("class-filter").value;
  try {
    const data = API_URL ? await fetchRemoteData(className) : loadLocalData(className);
    renderDashboard(data);
  } catch (error) {
    console.error(error);
    $("updated-at").textContent = "資料連線中斷";
  } finally {
    refreshInFlight = false;
    if (refreshPending) {
      refreshPending = false;
      refreshData();
    }
  }
}

async function fetchRemoteData(className) {
  const response = await fetch(`${API_URL}?action=getDashboardData&className=${encodeURIComponent(className)}&t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load dashboard data");
  return response.json();
}

function loadLocalData(className) {
  let database = { players: {}, answers: [], bossByClass: {} };
  try { database = JSON.parse(localStorage.getItem(LOCAL_KEY)) || database; } catch { /* demo data remains empty */ }
  const players = Object.values(database.players).filter((player) => !className || player.className === className).map(normalizeDashboardPlayer);
  const selectedClasses = className ? [className] : ["高一甲", "高一乙", "高一丙", "高一丁"];
  const bossMaxHp = selectedClasses.length * 10000;
  const bossHp = selectedClasses.reduce((sum, cls) => sum + (database.bossByClass[cls] ?? 10000), 0);
  return { players, bossHp, bossMaxHp };
}

function normalizeDashboardPlayer(player) {
  const totalAnswers = Number(player.totalAnswers ?? player.totalAns) || 0;
  const correctAnswers = Number(player.correctAnswers) || Math.round((Number(player.acc) || 0) * totalAnswers);
  return {
    name: player.name || "未命名",
    className: player.className || "",
    id: Number(player.id) || 0,
    level: Number(player.level) || 1,
    damage: Number(player.totalDamage ?? player.damage) || 0,
    combo: Number(player.combo) || 0,
    totalAnswers,
    correctAnswers,
    acc: totalAnswers ? correctAnswers / totalAnswers : 0,
    mistakes: Number(player.mistakes) || 0,
  };
}

function renderDashboard(data) {
  const players = (data.players || []).map(normalizeDashboardPlayer);
  const totalAnswers = players.reduce((sum, player) => sum + player.totalAnswers, 0);
  const totalCorrect = players.reduce((sum, player) => sum + player.correctAnswers, 0);
  const totalWrong = Math.max(0, totalAnswers - totalCorrect);
  const bossMaxHp = Number(data.bossMaxHp) || 10000;
  const bossHp = Math.max(0, Number(data.bossHp) || 0);

  $("dashboard-boss-hp").textContent = Math.round(bossHp).toLocaleString("zh-Hant");
  $("dashboard-boss-hp").nextElementSibling.textContent = `/ ${bossMaxHp.toLocaleString("zh-Hant")}`;
  $("dashboard-boss-bar").style.width = `${Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100))}%`;
  $("stat-players").textContent = players.length;
  $("stat-answers").textContent = totalAnswers.toLocaleString("zh-Hant");
  $("stat-accuracy").textContent = totalAnswers ? `${Math.round((totalCorrect / totalAnswers) * 100)}%` : "--";
  $("updated-at").textContent = `更新 ${new Date().toLocaleTimeString("zh-Hant", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;

  if (accuracyChart) {
    accuracyChart.data.datasets[0].data = totalAnswers ? [totalCorrect, totalWrong] : [1, 0];
    accuracyChart.data.datasets[0].backgroundColor = totalAnswers ? ["#20c886", "#e64b67"] : ["#42506a", "#42506a"];
    accuracyChart.update();
  }

  renderRanking("damage-list", [...players].sort((a, b) => b.damage - a.damage), (player) => player.damage.toLocaleString("zh-Hant"));
  renderRanking("combo-list", [...players].sort((a, b) => b.combo - a.combo), (player) => player.combo);
  renderRanking("accuracy-list", players.filter((player) => player.totalAnswers >= 3).sort((a, b) => b.acc - a.acc || b.totalAnswers - a.totalAnswers), (player) => `${Math.round(player.acc * 100)}%`);
  renderWarnings(players);
}

function renderRanking(id, players, valueFormatter) {
  const list = $(id);
  const top = players.slice(0, 8);
  if (!top.length) {
    list.innerHTML = '<li class="empty-row">尚未有學生數據</li>';
    return;
  }
  list.innerHTML = top.map((player, index) => `
    <li>
      <span class="rank">${index + 1}</span>
      <span class="name">${escapeHtml(player.name)} <small>Lv.${player.level}</small></span>
      <span class="value">${valueFormatter(player)}</span>
    </li>
  `).join("");
}

function renderWarnings(players) {
  const warnings = players.filter((player) => player.mistakes >= 3 || (player.totalAnswers >= 5 && player.acc < 0.6));
  $("warning-list").innerHTML = warnings.length ? warnings.map((player) => {
    const reason = player.mistakes >= 3 ? `連續答錯 ${player.mistakes} 題` : `正確率 ${Math.round(player.acc * 100)}%`;
    return `<div class="warning-item"><strong>${escapeHtml(player.name)}</strong>${reason}</div>`;
  }).join("") : '<div class="warning-clear">目前沒有需要支援的學生</div>';
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function openResetDialog() {
  const className = $("class-filter").value;
  if (!className) {
    alert("請先選擇一個班別，再重置紀錄。");
    return;
  }
  $("reset-dialog-copy").textContent = `此操作會清除「${className}」的學生進度和作答紀錄。`;
  $("reset-dialog").showModal();
}

async function resetClassData() {
  const className = $("class-filter").value;
  if (!className) return;
  if (!API_URL) {
    let database;
    try { database = JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch { database = null; }
    if (database) {
      Object.keys(database.players || {}).forEach((key) => {
        if (database.players[key].className === className) delete database.players[key];
      });
      database.answers = (database.answers || []).filter((answer) => answer.className !== className);
      database.bossByClass[className] = 10000;
      localStorage.setItem(LOCAL_KEY, JSON.stringify(database));
    }
  }
  refreshData();
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
}

document.addEventListener("DOMContentLoaded", initDashboard);
