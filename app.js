const API_URL = window.DIVISIBILITY_CONFIG?.apiUrl || "";
const LOCAL_KEY = "divisibility-classroom-v1";

const studentDB = {
  "高一甲": { 1: "高斯", 2: "歐拉", 3: "牛頓", 4: "笛卡兒", 5: "費馬" },
  "高一乙": { 1: "畢達哥拉斯", 2: "歐幾里得", 3: "阿基米德", 4: "泰勒斯", 5: "希帕提婭" },
  "高一丙": { 1: "拉馬努金", 2: "萊布尼茲", 3: "黎曼", 4: "龐加萊", 5: "希爾伯特" },
  "高一丁": { 1: "伽羅瓦", 2: "阿貝爾", 3: "康托爾", 4: "諾特", 5: "圖靈" },
};

const degreeInfo = {
  1: { label: "程度一", rank: "規律新手", avatar: "player-lv1.png", maxExp: 120, damage: 35, hint: "留意個位數" },
  2: { label: "程度二", rank: "數位偵探", avatar: "player-lv4.png", maxExp: 180, damage: 50, hint: "把各位數字相加" },
  3: { label: "程度三", rank: "整除大師", avatar: "player-lv7.png", maxExp: 260, damage: 70, hint: "逐項使用四個判斷規則" },
};

const state = {
  player: null,
  bossHp: 10000,
  bossMaxHp: 10000,
  question: null,
  questionNumber: 0,
  questionStartedAt: 0,
  selections: {},
  pendingDamage: 0,
  pendingAnswers: [],
  answerLocked: false,
};

const $ = (id) => document.getElementById(id);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (items) => items[Math.floor(Math.random() * items.length)];

function init() {
  populateLogin();
  $("class-select").addEventListener("change", updateStudentPreview);
  $("id-select").addEventListener("change", updateStudentPreview);
  $("login-button").addEventListener("click", login);
  $("logout-button").addEventListener("click", () => location.reload());
  $("next-button").addEventListener("click", nextQuestion);
  $("continue-level").addEventListener("click", () => {
    $("level-overlay").classList.add("is-hidden");
    nextQuestion();
  });
  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => submitSingle(button.dataset.answer === "true"));
  });
  $("submit-multi").addEventListener("click", submitMulti);
  if (window.lucide) lucide.createIcons();
}

function populateLogin() {
  const classSelect = $("class-select");
  const idSelect = $("id-select");
  Object.keys(studentDB).forEach((className) => classSelect.add(new Option(className, className)));
  for (let id = 1; id <= 5; id += 1) idSelect.add(new Option(`${id} 號`, id));
  updateStudentPreview();
}

function updateStudentPreview() {
  const className = $("class-select").value;
  const id = $("id-select").value;
  $("student-name-display").textContent = studentDB[className]?.[id] || "請選擇班別與學號";
}

async function login() {
  const className = $("class-select").value;
  const id = $("id-select").value;
  const name = studentDB[className]?.[id];
  if (!name) return;

  const button = $("login-button");
  button.disabled = true;
  $("login-status").textContent = "正在讀取課堂進度...";
  state.player = {
    className,
    id: Number(id),
    name,
    level: 1,
    hp: 100,
    exp: 0,
    combo: 0,
    totalDamage: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    mistakes: 0,
  };

  try {
    const saved = API_URL ? await loadRemotePlayer(className, id) : loadLocalPlayer(className, id);
    if (saved?.player) Object.assign(state.player, normalizePlayer(saved.player));
    if (Number.isFinite(Number(saved?.bossHp))) state.bossHp = Number(saved.bossHp);
    if (Number.isFinite(Number(saved?.bossMaxHp))) state.bossMaxHp = Number(saved.bossMaxHp);
    $("player-identity").textContent = `${className} ${id} 號 ${name}`;
    $("login-screen").classList.add("is-hidden");
    $("game-screen").classList.remove("is-hidden");
    updateUI();
    nextQuestion();
    if (window.lucide) lucide.createIcons();
  } catch (error) {
    console.error(error);
    $("login-status").textContent = "暫時未能連接資料表，請稍後重試。";
    button.disabled = false;
  }
}

async function loadRemotePlayer(className, id) {
  const url = `${API_URL}?action=loadPlayer&className=${encodeURIComponent(className)}&id=${encodeURIComponent(id)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load player");
  return response.json();
}

function normalizePlayer(player) {
  return {
    level: Math.min(3, Math.max(1, Number(player.level) || 1)),
    hp: Math.max(0, Number(player.hp) || 100),
    exp: Math.max(0, Number(player.exp) || 0),
    combo: Math.max(0, Number(player.combo) || 0),
    totalDamage: Math.max(0, Number(player.totalDamage ?? player.damage) || 0),
    totalAnswers: Math.max(0, Number(player.totalAnswers ?? player.totalAns) || 0),
    correctAnswers: Math.max(0, Number(player.correctAnswers) || 0),
    mistakes: Math.max(0, Number(player.mistakes) || 0),
  };
}

function makeBalancedNumber(divisor) {
  const shouldDivide = Math.random() < 0.5;
  if (shouldDivide) return { number: divisor * randomInt(6, 499), shouldDivide };
  let number = randomInt(20, 4999);
  while (number % divisor === 0) number = randomInt(20, 4999);
  return { number, shouldDivide };
}

function generateQuestion(level) {
  if (level === 1) {
    const divisor = pick([2, 5, 10]);
    const generated = makeBalancedNumber(divisor);
    return { number: generated.number, divisors: [divisor], answers: { [divisor]: generated.shouldDivide } };
  }
  if (level === 2) {
    const generated = makeBalancedNumber(3);
    return { number: generated.number, divisors: [3], answers: { 3: generated.shouldDivide } };
  }
  const number = randomInt(20, 9999);
  const divisors = [2, 5, 10, 3];
  return { number, divisors, answers: Object.fromEntries(divisors.map((divisor) => [divisor, number % divisor === 0])) };
}

function nextQuestion() {
  const level = state.player.level;
  state.question = generateQuestion(level);
  state.questionNumber += 1;
  state.questionStartedAt = Date.now();
  state.selections = {};
  state.answerLocked = false;

  $("question-count").textContent = state.questionNumber;
  $("question-number").textContent = state.question.number;
  $("feedback").className = "feedback is-hidden";

  const isMulti = level === 3;
  $("single-answer").classList.toggle("is-hidden", isMulti);
  $("multi-answer").classList.toggle("is-hidden", !isMulti);
  document.querySelectorAll("[data-answer]").forEach((button) => { button.disabled = false; });

  if (isMulti) {
    $("question-prefix").textContent = "判斷數字";
    $("question-suffix").textContent = "是否能被以下各數整除";
    renderMultiAnswers();
  } else {
    const divisor = state.question.divisors[0];
    $("question-prefix").textContent = "這個數";
    $("question-suffix").textContent = `能被 ${divisor} 整除嗎？`;
  }
  updateUI();
}

function renderMultiAnswers() {
  const list = $("multi-answer-list");
  list.innerHTML = state.question.divisors.map((divisor) => `
    <div class="divisor-row">
      <strong>${divisor}</strong>
      <button class="divisor-choice" type="button" data-divisor="${divisor}" data-choice="true">能</button>
      <button class="divisor-choice" type="button" data-divisor="${divisor}" data-choice="false">不能</button>
    </div>
  `).join("");
  list.querySelectorAll(".divisor-choice").forEach((button) => {
    button.addEventListener("click", () => selectMulti(Number(button.dataset.divisor), button.dataset.choice === "true"));
  });
  $("submit-multi").disabled = true;
}

function selectMulti(divisor, choice) {
  if (state.answerLocked) return;
  state.selections[divisor] = choice;
  document.querySelectorAll(`[data-divisor="${divisor}"]`).forEach((button) => {
    button.classList.remove("selected-true", "selected-false");
    if ((button.dataset.choice === "true") === choice) button.classList.add(choice ? "selected-true" : "selected-false");
  });
  $("submit-multi").disabled = Object.keys(state.selections).length !== state.question.divisors.length;
}

function submitSingle(choice) {
  if (state.answerLocked) return;
  const divisor = state.question.divisors[0];
  state.selections = { [divisor]: choice };
  document.querySelectorAll("[data-answer]").forEach((button) => { button.disabled = true; });
  evaluateAnswer();
}

function submitMulti() {
  if (state.answerLocked || Object.keys(state.selections).length !== state.question.divisors.length) return;
  document.querySelectorAll(".divisor-choice").forEach((button) => { button.disabled = true; });
  $("submit-multi").disabled = true;
  evaluateAnswer();
}

function evaluateAnswer() {
  state.answerLocked = true;
  const question = state.question;
  const isCorrect = question.divisors.every((divisor) => state.selections[divisor] === question.answers[divisor]);
  const seconds = Math.round((Date.now() - state.questionStartedAt) / 100) / 10;
  const level = state.player.level;
  const info = degreeInfo[level];

  state.player.totalAnswers += 1;
  if (isCorrect) {
    state.player.correctAnswers += 1;
    state.player.combo += 1;
    state.player.mistakes = 0;
    state.player.totalDamage += info.damage;
    state.pendingDamage += info.damage;
    state.bossHp = Math.max(0, state.bossHp - info.damage);
    state.player.exp += 24 + level * 8 + Math.min(20, state.player.combo * 2);
  } else {
    state.player.combo = 0;
    state.player.mistakes += 1;
    state.player.hp = Math.max(0, state.player.hp - (10 + level * 5));
    if (state.player.hp === 0) state.player.hp = 100 + (level - 1) * 20;
  }

  state.pendingAnswers.push({
    typeReq: level,
    number: question.number,
    question: `${question.number} ÷ ${question.divisors.join("、")}`,
    divisors: question.divisors.join(","),
    selectedAnswer: formatAnswer(state.selections, question.divisors),
    correctAnswer: formatAnswer(question.answers, question.divisors),
    isCorrect,
    timeTaken: seconds,
    usedHint: false,
  });

  const leveledUp = applyLevelUp();
  showFeedback(isCorrect);
  updateUI();
  syncNow();
  if (leveledUp) {
    $("level-overlay-title").textContent = `進入${degreeInfo[state.player.level].label}`;
    setTimeout(() => $("level-overlay").classList.remove("is-hidden"), 650);
  }
}

function applyLevelUp() {
  const currentInfo = degreeInfo[state.player.level];
  if (state.player.level >= 3 || state.player.exp < currentInfo.maxExp) return false;
  state.player.exp -= currentInfo.maxExp;
  state.player.level += 1;
  state.player.hp = 100 + (state.player.level - 1) * 20;
  return true;
}

function formatAnswer(values, divisors) {
  return divisors.map((divisor) => `${divisor}:${values[divisor] ? "能" : "不能"}`).join("｜");
}

function showFeedback(isCorrect) {
  const feedback = $("feedback");
  feedback.className = `feedback ${isCorrect ? "correct" : "wrong"}`;
  $("feedback-icon").innerHTML = `<i data-lucide="${isCorrect ? "check" : "x"}"></i>`;
  $("feedback-title").textContent = isCorrect ? "判斷正確" : "再看一次規律";
  $("feedback-copy").textContent = buildExplanation(state.question);
  $("activity-text").textContent = isCorrect
    ? `命中！為全班削減 ${degreeInfo[state.player.level].damage} 點能量。`
    : `答案是：${formatAnswer(state.question.answers, state.question.divisors)}`;
  if (window.lucide) lucide.createIcons();
}

function buildExplanation(question) {
  return question.divisors.map((divisor) => {
    const result = question.answers[divisor] ? "能" : "不能";
    if (divisor === 2) return `個位數是 ${question.number % 10}，所以${result}被 2 整除。`;
    if (divisor === 5) return `個位數是 ${question.number % 10}，所以${result}被 5 整除。`;
    if (divisor === 10) return `個位數是 ${question.number % 10}，所以${result}被 10 整除。`;
    const digitSum = String(question.number).split("").reduce((sum, digit) => sum + Number(digit), 0);
    return `各位數字和是 ${digitSum}，所以${result}被 3 整除。`;
  }).join(" ");
}

function updateUI() {
  if (!state.player) return;
  const level = state.player.level;
  const info = degreeInfo[level];
  const maxHp = 100 + (level - 1) * 20;
  $("degree-label").textContent = info.label;
  $("degree-tag").textContent = info.label;
  $("level-number").textContent = level;
  $("player-rank").textContent = info.rank;
  $("player-avatar").src = info.avatar;
  $("question-instruction").textContent = level === 3 ? "完成四項整除判斷" : "判斷這個數能否整除";
  $("rule-hint").textContent = info.hint;
  $("hp-copy").textContent = `${state.player.hp} / ${maxHp}`;
  $("hp-bar").style.width = `${Math.min(100, (state.player.hp / maxHp) * 100)}%`;
  $("exp-copy").textContent = level === 3 ? `${state.player.exp} / ∞` : `${state.player.exp} / ${info.maxExp}`;
  $("exp-bar").style.width = level === 3 ? "100%" : `${Math.min(100, (state.player.exp / info.maxExp) * 100)}%`;
  $("combo-count").textContent = state.player.combo;
  $("boss-copy").textContent = `${Math.round(state.bossHp)} / ${state.bossMaxHp}`;
  $("boss-bar").style.width = `${Math.max(0, (state.bossHp / state.bossMaxHp) * 100)}%`;
}

async function syncNow() {
  const answers = state.pendingAnswers.splice(0);
  const addedDamage = state.pendingDamage;
  state.pendingDamage = 0;
  const payload = {
    className: state.player.className,
    id: state.player.id,
    name: state.player.name,
    level: state.player.level,
    hp: state.player.hp,
    exp: state.player.exp,
    combo: state.player.combo,
    totalDamage: state.player.totalDamage,
    totalAnswers: state.player.totalAnswers,
    correctAnswers: state.player.correctAnswers,
    mistakes: state.player.mistakes,
    addedDamage,
    answers,
  };

  if (!API_URL) {
    saveLocalPayload(payload);
    return;
  }
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(JSON.stringify(payload))}`,
    });
  } catch (error) {
    state.pendingDamage += addedDamage;
    state.pendingAnswers.unshift(...answers);
    console.error("Sync failed", error);
  }
}

function loadLocalDatabase() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { players: {}, answers: [], bossByClass: {} };
  } catch {
    return { players: {}, answers: [], bossByClass: {} };
  }
}

function loadLocalPlayer(className, id) {
  const database = loadLocalDatabase();
  const player = database.players[`${className}-${id}`] || null;
  return { player, bossHp: database.bossByClass[className] ?? 10000, bossMaxHp: 10000 };
}

function saveLocalPayload(payload) {
  const database = loadLocalDatabase();
  const key = `${payload.className}-${payload.id}`;
  database.players[key] = { ...payload, lastActive: new Date().toISOString() };
  database.answers.push(...payload.answers.map((answer) => ({ ...answer, className: payload.className, id: payload.id, name: payload.name, timestamp: new Date().toISOString() })));
  database.answers = database.answers.slice(-1000);
  database.bossByClass[payload.className] = Math.max(0, (database.bossByClass[payload.className] ?? 10000) - payload.addedDamage);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(database));
}

document.addEventListener("DOMContentLoaded", init);
