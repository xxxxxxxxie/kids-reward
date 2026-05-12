// 常量配置
const EMOJIS = ['🏃','💪','📚','🧮','📖','🎨','🎵','🌙','🥗','🦷','🌿','🧩','🚴','🏊','🎯','⭐','🏋️','🌈','🦋','🧠','💡','🌟'];

const THEMES = [
  { name: '橙色', cls: 'theme-orange', bg: '#FFF3E0', accent: '#E65100' },
  { name: '蓝色', cls: 'theme-blue', bg: '#E3F2FD', accent: '#1565C0' },
  { name: '绿色', cls: 'theme-green', bg: '#E8F5E9', accent: '#2E7D32' },
  { name: '紫色', cls: 'theme-purple', bg: '#F3E5F5', accent: '#6A1B9A' },
  { name: '粉色', cls: 'theme-pink', bg: '#FCE4EC', accent: '#AD1457' },
  { name: '青色', cls: 'theme-teal', bg: '#E0F2F1', accent: '#00695C' },
];

// 全局状态
let cards = JSON.parse(localStorage.getItem('kidsCards') || '[]');
let totalScore = parseInt(localStorage.getItem('kidsScore') || '0');
let history = JSON.parse(localStorage.getItem('kidsHistory') || '[]');
let selectedEmoji = EMOJIS[0];
let selectedTheme = THEMES[0].cls;

// 初始化示例数据
if (!cards.length) {
  cards = [
    { id: 1, emoji: '🏃', name: '晨跑锻炼', points: 15, theme: 'theme-orange' },
    { id: 2, emoji: '📚', name: '阅读30分', points: 10, theme: 'theme-blue' },
    { id: 3, emoji: '🌙', name: '自主入睡', points: 20, theme: 'theme-purple' },
    { id: 4, emoji: '🧮', name: '数学练习', points: 12, theme: 'theme-green' },
    { id: 5, emoji: '🦷', name: '刷牙洗脸', points: 8, theme: 'theme-pink' },
    { id: 6, emoji: '🎨', name: '画画创作', points: 10, theme: 'theme-teal' },
  ];
  save();
}

// 保存数据到 localStorage
function save() {
  localStorage.setItem('kidsCards', JSON.stringify(cards));
  localStorage.setItem('kidsScore', totalScore);
  localStorage.setItem('kidsHistory', JSON.stringify(history));
}

// 更新日期显示
const d = new Date();
document.getElementById('headerDate').textContent = `${d.getMonth() + 1}月${d.getDate()}日`;

// 更新总分显示（带动画）
function updateScore() {
  const el = document.getElementById('totalScore');
  el.style.transform = 'scale(1.2)';
  el.textContent = totalScore;
  setTimeout(() => el.style.transform = 'scale(1)', 200);
}

// 渲染卡片
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  
  cards.forEach(card => {
    const div = document.createElement('div');
    div.className = `reward-card ${card.theme}`;
    div.draggable = true;
    div.dataset.id = card.id;
    div.innerHTML = `
      <span class="card-emoji">${card.emoji}</span>
      <div class="card-name">${card.name}</div>
      <div class="card-points">+${card.points} 分</div>
      <div class="card-delete" onclick="deleteCard(${card.id}, event)">✕</div>
    `;
    
    div.addEventListener('dragstart', onDragStart);
    div.addEventListener('touchstart', onTouchStart, { passive: false });
    
    grid.appendChild(div);
  });
}

// 渲染历史记录
function renderHistory() {
  const list = document.getElementById('historyList');
  const items = history.slice().reverse().slice(0, 10);
  
  if (!items.length) {
    list.innerHTML = '<div style="text-align:center;color:#ccc;padding:20px;font-size:14px">暂无记录</div>';
    return;
  }
  
  list.innerHTML = items.map(h => `
    <div class="history-item">
      <div class="hist-icon ${h.type === 'add' ? 'hist-add' : 'hist-sub'}">${h.emoji || '📝'}</div>
      <div class="hist-info">
        <div class="hist-desc">${h.desc}</div>
        <div class="hist-time">${h.time}</div>
      </div>
      <div class="hist-score ${h.type === 'add' ? 'plus' : 'minus'}">${h.type === 'add' ? '+' : '-'}${h.points}</div>
    </div>
  `).join('');
}

// 拖拽功能 - 桌面端
let dragCardId = null;

function onDragStart(e) {
  dragCardId = parseInt(e.currentTarget.dataset.id);
  e.currentTarget.classList.add('dragging');
  setTimeout(() => e.currentTarget.classList.remove('dragging'), 0);
}

const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (dragCardId) addPoints(dragCardId);
  dragCardId = null;
});

// 触摸拖拽 - 移动端
let touchCard = null;
let touchClone = null;

function onTouchStart(e) {
  const card = e.currentTarget;
  const id = parseInt(card.dataset.id);
  const touch = e.touches[0];
  
  touchCard = card;
  touchClone = card.cloneNode(true);
  touchClone.style.cssText = `
    position: fixed;
    top: ${touch.clientY - 40}px;
    left: ${touch.clientX - 60}px;
    width: 140px;
    opacity: 0.88;
    transform: scale(1.08) rotate(-3deg);
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  `;
  document.body.appendChild(touchClone);
  
  function onMove(ev) {
    const t = ev.touches[0];
    touchClone.style.top = t.clientY - 40 + 'px';
    touchClone.style.left = t.clientX - 60 + 'px';
    
    const zone = dropZone.getBoundingClientRect();
    if (t.clientX > zone.left && t.clientX < zone.right && 
        t.clientY > zone.top && t.clientY < zone.bottom) {
      dropZone.classList.add('dragover');
    } else {
      dropZone.classList.remove('dragover');
    }
  }
  
  function onEnd(ev) {
    if (touchClone) touchClone.remove();
    touchClone = null;
    
    const t = ev.changedTouches[0];
    const zone = dropZone.getBoundingClientRect();
    dropZone.classList.remove('dragover');
    
    if (t.clientX > zone.left && t.clientX < zone.right && 
        t.clientY > zone.top && t.clientY < zone.bottom) {
      addPoints(id);
    }
    
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  }
  
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  e.preventDefault();
}

// 添加积分
function addPoints(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  
  totalScore += card.points;
  updateScore();
  
  const now = new Date();
  history.push({
    type: 'add',
    emoji: card.emoji,
    desc: card.name,
    points: card.points,
    time: `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  });
  
  save();
  renderHistory();
  spawnStars(card.points);
  
  // 卡片添加动画
  const cardEl = document.querySelector(`[data-id="${cardId}"]`);
  if (cardEl) cardEl.classList.add('added');
  setTimeout(() => cardEl && cardEl.classList.remove('added'), 600);
}

// 生成星星特效
function spawnStars(pts) {
  const zone = dropZone.getBoundingClientRect();
  const cx = zone.left + zone.width / 2;
  const cy = zone.top + zone.height / 2;
  const count = Math.min(6 + Math.floor(pts / 5), 12);
  const emojis = ['⭐','✨','🌟','💫','🎉','🎊'];
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const s = document.createElement('div');
      s.className = 'star';
      s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', (Math.sin(angle) * dist - 60) + 'px');
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }, i * 60);
  }
}

// 删除卡片
function deleteCard(id, e) {
  e.stopPropagation();
  cards = cards.filter(c => c.id !== id);
  save();
  renderCards();
}

// 模态框控制
function openAddModal() {
  selectedEmoji = EMOJIS[0];
  selectedTheme = THEMES[0].cls;
  document.getElementById('cardName').value = '';
  document.getElementById('cardPoints').value = 10;
  renderEmojiGrid();
  renderThemeGrid();
  document.getElementById('addModal').classList.add('show');
}

function openDeductModal() {
  document.getElementById('deductPoints').value = 10;
  document.getElementById('deductReason').value = '';
  document.getElementById('deductModal').classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// 渲染表情选择器
function renderEmojiGrid() {
  document.getElementById('emojiGrid').innerHTML = EMOJIS.map(e => `
    <div class="emoji-opt ${e === selectedEmoji ? 'selected' : ''}" onclick="selectEmoji('${e}')">${e}</div>
  `).join('');
}

// 渲染主题选择器
function renderThemeGrid() {
  document.getElementById('themeGrid').innerHTML = THEMES.map(t => `
    <div class="theme-opt ${t.cls === selectedTheme ? 'selected' : ''}" 
         style="background:${t.bg};color:${t.accent}" 
         onclick="selectTheme('${t.cls}')">${t.name}</div>
  `).join('');
}

function selectEmoji(e) {
  selectedEmoji = e;
  renderEmojiGrid();
}

function selectTheme(t) {
  selectedTheme = t;
  renderThemeGrid();
}

// 分值调整
function adjustPoints(d) {
  const el = document.getElementById('cardPoints');
  el.value = Math.max(1, Math.min(999, parseInt(el.value || 10) + d));
}

function adjustDeduct(d) {
  const el = document.getElementById('deductPoints');
  el.value = Math.max(1, parseInt(el.value || 10) + d);
}

// 确认添加卡片
function confirmAddCard() {
  const name = document.getElementById('cardName').value.trim();
  const pts = parseInt(document.getElementById('cardPoints').value) || 10;
  
  if (!name) {
    document.getElementById('cardName').focus();
    return;
  }
  
  cards.push({
    id: Date.now(),
    emoji: selectedEmoji,
    name,
    points: pts,
    theme: selectedTheme
  });
  
  save();
  renderCards();
  closeModal('addModal');
}

// 确认扣除积分
function confirmDeduct() {
  const pts = parseInt(document.getElementById('deductPoints').value) || 10;
  const reason = document.getElementById('deductReason').value.trim();
  
  if (!reason) {
    document.getElementById('deductReason').focus();
    return;
  }
  
  if (pts > totalScore) {
    document.getElementById('deductPoints').style.borderColor = '#F44336';
    return;
  }
  
  totalScore = Math.max(0, totalScore - pts);
  updateScore();
  
  const now = new Date();
  history.push({
    type: 'sub',
    emoji: '🎁',
    desc: `兑换：${reason}`,
    points: pts,
    time: `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  });
  
  save();
  renderHistory();
  closeModal('deductModal');
}

// 点击模态框外部关闭
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('show');
  });
});

// 初始化
updateScore();
renderCards();
renderHistory();
