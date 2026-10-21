const CHESTS = {
  c1: { name: '寶箱 1', sequence: [4, 7, 10, 13], answer: 16, operation: '加', number: 3, hint: ['先比較 4 和 7，再比較 7 和 10。', '每一項都比前一項多 3。'] },
  c2: { name: '寶箱 2', sequence: [23, 19, 15, 11], answer: 7, operation: '減', number: 4, hint: ['先比較 23 和 19。', '每一項都比前一項少 4。'] },
  c3: { name: '寶箱 3', sequence: [3, 6, 12, 24], answer: 48, operation: '乘', number: 2, hint: ['由 3 變成 6，用了甚麼運算？', '每一項都是前一項的 2 倍。'] },
  c4: { name: '終點寶箱', sequence: [81, 27, 9, 3], answer: 1, operation: '除', number: 3, hint: ['由 81 變成 27，是除以多少？', '每一項都是前一項除以 3。'] }
};

const map = document.querySelector('#map');
const player = document.querySelector('#player');
const marker = document.querySelector('#move-marker');
const dialog = document.querySelector('#chest-dialog');
const form = document.querySelector('#answer-form');
const toast = document.querySelector('#toast');
let activeChest = null;
let hintStep = 0;
let position = { x: 8, y: 76 };
let target = { ...position };
let opened = new Set(JSON.parse(localStorage.getItem('sequence-treasure-opened') || '[]'));

function setPlayer() { player.style.left = `calc(${position.x}% - 24px)`; player.style.top = `calc(${position.y}% - 31px)`; }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2100); }
function chestPosition(id) { const node = document.querySelector(`[data-chest="${id}"]`); return { x: node.offsetLeft / map.clientWidth * 100 + 3, y: node.offsetTop / map.clientHeight * 100 + 4 }; }
function distanceTo(id) { const p = chestPosition(id); return Math.hypot(position.x - p.x, position.y - p.y); }
function redrawProgress() {
  document.querySelector('#opened-count').textContent = opened.size;
  document.querySelector('#record-empty').hidden = opened.size > 0;
  document.querySelectorAll('.chest').forEach(node => node.classList.toggle('is-open', opened.has(node.dataset.chest)));
  const list = document.querySelector('#record-list');
  list.innerHTML = '';
  [...opened].forEach(id => { const c = CHESTS[id]; const item = document.createElement('li'); item.textContent = `${c.name}：每次${c.operation}${c.number}，下一項是 ${c.answer}`; list.append(item); });
}
function moveTo(x, y) { target.x = Math.max(4, Math.min(91, x)); target.y = Math.max(7, Math.min(88, y)); marker.style.left = `${target.x}%`; marker.style.top = `${target.y}%`; marker.classList.add('show'); clearTimeout(moveTo.timer); moveTo.timer = setTimeout(() => marker.classList.remove('show'), 550); }
function animate() { position.x += (target.x - position.x) * .12; position.y += (target.y - position.y) * .12; setPlayer(); requestAnimationFrame(animate); }
function openChest(id) {
  if (opened.has(id)) { showToast('這個寶箱已經開啟了。'); return; }
  if (distanceTo(id) > 14) { showToast('先走近寶箱，再點擊它。'); moveTo(chestPosition(id).x - 6, chestPosition(id).y + 7); return; }
  activeChest = id; hintStep = 0; const chest = CHESTS[id];
  document.querySelector('#dialog-number').textContent = chest.name;
  document.querySelector('#dialog-title').textContent = '寶箱密碼';
  const sequence = document.querySelector('#sequence'); sequence.innerHTML = '';
  chest.sequence.forEach(n => { const term = document.createElement('span'); term.className = 'term'; term.textContent = n; sequence.append(term); });
  const ellipsis = document.createElement('span'); ellipsis.className = 'term term-ellipsis'; ellipsis.textContent = '?'; sequence.append(ellipsis);
  form.reset(); document.querySelector('#hint-text').textContent = ''; document.querySelector('#answer-feedback').textContent = ''; document.querySelector('#answer-feedback').className = 'answer-feedback';
  dialog.showModal(); setTimeout(() => document.querySelector('#next-term').focus(), 50);
}

map.addEventListener('click', event => { if (event.target.closest('.chest')) return; const rect = map.getBoundingClientRect(); moveTo((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100); map.focus(); });
document.querySelectorAll('.chest').forEach(node => node.addEventListener('click', () => openChest(node.dataset.chest)));
window.addEventListener('keydown', event => {
  if (dialog.open || ['INPUT','SELECT'].includes(document.activeElement.tagName)) return;
  const key = event.key.toLowerCase(); const moves = { arrowup:[0,-7],w:[0,-7],arrowdown:[0,7],s:[0,7],arrowleft:[-7,0],a:[-7,0],arrowright:[7,0],d:[7,0] };
  if (moves[key]) { event.preventDefault(); moveTo(target.x + moves[key][0], target.y + moves[key][1]); map.focus(); }
});
document.querySelector('#hint-button').addEventListener('click', () => { const text = CHESTS[activeChest].hint[Math.min(hintStep, 1)]; document.querySelector('#hint-text').textContent = `提示：${text}`; hintStep += 1; });
form.addEventListener('submit', event => {
  event.preventDefault(); const chest = CHESTS[activeChest]; const next = Number(document.querySelector('#next-term').value); const operation = document.querySelector('#operation').value; const number = Number(document.querySelector('#rule-number').value); const feedback = document.querySelector('#answer-feedback');
  if (next !== chest.answer) { feedback.textContent = '再看一看相鄰兩項的變化，然後再試一次。'; feedback.className = 'answer-feedback bad'; return; }
  if (operation !== chest.operation || number !== chest.number) { feedback.textContent = '下一項正確。請再把每次的規律填完整。'; feedback.className = 'answer-feedback bad'; return; }
  opened.add(activeChest); localStorage.setItem('sequence-treasure-opened', JSON.stringify([...opened])); redrawProgress(); feedback.textContent = '答對了！寶箱已開啟。'; feedback.className = 'answer-feedback good';
  setTimeout(() => { dialog.close(); if (opened.size === 4) showToast('四個寶箱都開啟了！準備進入下一關。'); else showToast('寶箱已開啟，繼續尋找下一個吧！'); }, 850);
});
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#reset-game').addEventListener('click', () => { opened = new Set(); localStorage.removeItem('sequence-treasure-opened'); redrawProgress(); showToast('探險紀錄已重新開始。'); });
setPlayer(); redrawProgress(); animate();
