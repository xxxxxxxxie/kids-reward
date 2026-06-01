const EMOJIS = ['🏃','💪','📚','🧮','📖','🎨','🎵','🌙','🥗','🦷','🌿','🧩','🚴','🏊','🎯','⭐','🏋️','🌈','🦋','🧠','💡','🌟'];
const THEMES = [
  { name:'橙色', cls:'theme-orange', bg:'#FFF3E0', accent:'#E65100' },
  { name:'蓝色', cls:'theme-blue',   bg:'#E3F2FD', accent:'#1565C0' },
  { name:'绿色', cls:'theme-green',  bg:'#E8F5E9', accent:'#2E7D32' },
  { name:'紫色', cls:'theme-purple', bg:'#F3E5F5', accent:'#6A1B9A' },
  { name:'粉色', cls:'theme-pink',   bg:'#FCE4EC', accent:'#AD1457' },
  { name:'青色', cls:'theme-teal',   bg:'#E0F2F1', accent:'#00695C' },
];

let cards      = JSON.parse(localStorage.getItem('kidsCards')   || '[]');
let totalScore = parseInt(localStorage.getItem('kidsScore')     || '0');
let history    = JSON.parse(localStorage.getItem('kidsHistory') || '[]');
let selectedEmoji = EMOJIS[0];
let selectedTheme = THEMES[0].cls;
let selectedForDelete = new Set(); // 编辑模式选中的卡片id集合

if (!cards.length) {
  cards = [
    { id:1, emoji:'🏃', name:'晨跑锻炼', points:15, theme:'theme-orange' },
    { id:2, emoji:'📚', name:'阅读30分', points:10, theme:'theme-blue'   },
    { id:3, emoji:'🌙', name:'自主入睡', points:20, theme:'theme-purple' },
    { id:4, emoji:'🧮', name:'数学练习', points:12, theme:'theme-green'  },
    { id:5, emoji:'🦷', name:'刷牙洗脸', points:8,  theme:'theme-pink'   },
    { id:6, emoji:'🎨', name:'画画创作', points:10, theme:'theme-teal'   },
  ];
  save();
}

function save() {
  localStorage.setItem('kidsCards',   JSON.stringify(cards));
  localStorage.setItem('kidsScore',   totalScore);
  localStorage.setItem('kidsHistory', JSON.stringify(history));
}

// 日期
const _d = new Date();
document.getElementById('headerDate').textContent = `${_d.getMonth()+1}月${_d.getDate()}日`;

// 总分动画
function updateScore() {
  const el = document.getElementById('totalScore');
  el.style.transform = 'scale(1.25)';
  el.textContent = totalScore;
  setTimeout(() => el.style.transform = 'scale(1)', 220);
}

// ===== 主界面卡片（横向滚动，无删除按钮）=====
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
    `;
    div.addEventListener('dragstart', onDragStart);
    div.addEventListener('touchstart', onTouchStart, { passive: false });
    grid.appendChild(div);
  });

  // 超过4张显示滑动轨道
  const bar = document.getElementById('cardsScrollBar');
  if (bar) {
    bar.style.display = cards.length > 4 ? 'block' : 'none';
    if (cards.length > 4) initScrollTrack();
  }
}

// ===== 编辑弹窗：多选卡片 =====
function openEditModal() {
  selectedForDelete.clear();
  renderEditCards();
  updateDeleteBtn();
  document.getElementById('editModal').classList.add('show');
}

function renderEditCards() {
  const grid = document.getElementById('editCardsGrid');
  grid.innerHTML = '';

  if (!cards.length) {
    grid.innerHTML = '<div class="edit-empty">还没有卡片，先去新建一张吧 🎉</div>';
    return;
  }

  cards.forEach(card => {
    const div = document.createElement('div');
    div.className = `edit-card ${card.theme}${selectedForDelete.has(card.id) ? ' selected' : ''}`;
    div.dataset.id = card.id;
    div.innerHTML = `
      <div class="edit-card-check">✓</div>
      <span class="edit-card-emoji">${card.emoji}</span>
      <div class="edit-card-name">${card.name}</div>
      <div class="edit-card-pts">+${card.points} 分</div>
    `;
    div.addEventListener('click', () => toggleCardSelect(card.id));

    // 长按全选
    let longTimer = null;
    div.addEventListener('touchstart', () => {
      longTimer = setTimeout(() => {
        selectAll();
        if (navigator.vibrate) navigator.vibrate(40);
      }, 600);
    }, { passive: true });
    div.addEventListener('touchend',  () => clearTimeout(longTimer));
    div.addEventListener('touchmove', () => clearTimeout(longTimer));

    grid.appendChild(div);
  });
}

function toggleCardSelect(id) {
  if (selectedForDelete.has(id)) {
    selectedForDelete.delete(id);
  } else {
    selectedForDelete.add(id);
  }
  // 更新单张卡片选中态
  const el = document.querySelector(`.edit-card[data-id="${id}"]`);
  if (el) el.classList.toggle('selected', selectedForDelete.has(id));
  updateDeleteBtn();
}

function selectAll() {
  cards.forEach(c => selectedForDelete.add(c.id));
  renderEditCards();
  updateDeleteBtn();
}

function updateDeleteBtn() {
  const btn  = document.getElementById('deleteSelectedBtn');
  const hint = document.getElementById('editHint');
  const count = selectedForDelete.size;

  if (count === 0) {
    btn.disabled = true;
    btn.textContent = '🗑️ 删除';
    hint.textContent = '点击卡片可多选，长按可全选';
    hint.classList.remove('active');
  } else {
    btn.disabled = false;
    btn.textContent = `🗑️ 删除（${count}张）`;
    hint.textContent = `已选中 ${count} 张卡片`;
    hint.classList.add('active');
  }
}

function confirmDeleteSelected() {
  if (!selectedForDelete.size) return;
  const count = selectedForDelete.size;
  // 二次确认
  if (!confirm(`确认删除选中的 ${count} 张卡片？删除后无法恢复。`)) return;
  cards = cards.filter(c => !selectedForDelete.has(c.id));
  selectedForDelete.clear();
  save();
  renderCards();
  renderEditCards();
  updateDeleteBtn();
}

// ===== 滑动轨道联动 =====
function initScrollTrack() {
  const track = document.getElementById('scrollTrack');
  const thumb = document.getElementById('scrollThumb');
  const wrap  = document.getElementById('cardsScrollWrap');
  if (!track || !thumb || !wrap) return;

  function updateThumb() {
    const scrollRatio = wrap.scrollLeft / (wrap.scrollWidth - wrap.clientWidth || 1);
    const trackW = track.clientWidth - 8;
    const thumbW = Math.max(48, trackW * (wrap.clientWidth / wrap.scrollWidth));
    const thumbX = 4 + scrollRatio * (trackW - thumbW);
    thumb.style.width = thumbW + 'px';
    thumb.style.left  = thumbX + 'px';
  }
  wrap.addEventListener('scroll', updateThumb, { passive: true });
  updateThumb();

  function onThumbDrag(startX, startScroll) {
    const trackW = track.clientWidth - 8;
    const thumbW = thumb.clientWidth;
    const maxThumbX = trackW - thumbW;
    const maxScroll = wrap.scrollWidth - wrap.clientWidth;
    function onMove(e) {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      wrap.scrollLeft = Math.max(0, Math.min(maxScroll, startScroll + ((cx - startX) / maxThumbX) * maxScroll));
      updateThumb();
    }
    function onEnd() {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onEnd);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onEnd);
    }
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend',  onEnd);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onEnd);
  }
  thumb.addEventListener('touchstart', e => { e.stopPropagation(); onThumbDrag(e.touches[0].clientX, wrap.scrollLeft); }, { passive: true });
  thumb.addEventListener('mousedown',  e => { e.stopPropagation(); onThumbDrag(e.clientX, wrap.scrollLeft); });
  track.addEventListener('click', e => {
    if (e.target === thumb) return;
    const rect = track.getBoundingClientRect();
    wrap.scrollLeft = ((e.clientX - rect.left) / rect.width) * (wrap.scrollWidth - wrap.clientWidth);
    updateThumb();
  });
}

// ===== 拖拽 - 桌面 =====
let dragCardId = null;
function onDragStart(e) {
  dragCardId = parseInt(e.currentTarget.dataset.id);
  e.currentTarget.classList.add('dragging');
  setTimeout(() => e.currentTarget.classList.remove('dragging'), 0);
}
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('dragover');
  if (dragCardId) addPoints(dragCardId);
  dragCardId = null;
});

// ===== 触摸拖拽 - 手机 =====
let touchClone = null;
function onTouchStart(e) {
  if (e.target.closest('.modal-overlay')) return;
  const card = e.currentTarget;
  const id   = parseInt(card.dataset.id);
  const touch = e.touches[0];
  const rect  = card.getBoundingClientRect();
  const offsetX = touch.clientX - rect.left;
  const offsetY = touch.clientY - rect.top;

  let cloneTimer = setTimeout(() => {
    touchClone = card.cloneNode(true);
    touchClone.style.cssText = `
      position:fixed; top:${rect.top}px; left:${rect.left}px;
      width:${rect.width}px; opacity:0.85;
      transform:scale(1.08) rotate(-2deg); pointer-events:none;
      z-index:9999; box-shadow:0 16px 40px rgba(0,0,0,0.25); transition:none;
    `;
    document.body.appendChild(touchClone);
  }, 50);

  function onMove(ev) {
    ev.preventDefault();
    const t = ev.touches[0];
    if (touchClone) {
      touchClone.style.left = (t.clientX - offsetX) + 'px';
      touchClone.style.top  = (t.clientY - offsetY) + 'px';
    }
    const z = dropZone.getBoundingClientRect();
    dropZone.classList.toggle('dragover',
      t.clientX > z.left && t.clientX < z.right && t.clientY > z.top && t.clientY < z.bottom);
  }
  function onEnd(ev) {
    clearTimeout(cloneTimer);
    if (touchClone) { touchClone.remove(); touchClone = null; }
    const t = ev.changedTouches[0];
    const z = dropZone.getBoundingClientRect();
    dropZone.classList.remove('dragover');
    if (t.clientX > z.left && t.clientX < z.right && t.clientY > z.top && t.clientY < z.bottom) addPoints(id);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend',  onEnd);
  }
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend',  onEnd);
  e.preventDefault();
}

// ===== 加分 =====
function addPoints(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  totalScore += card.points;
  updateScore();
  const now = new Date();
  history.push({
    type:'add', emoji:card.emoji, desc:card.name, points:card.points,
    time:`${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`
  });
  save(); renderHistory(); spawnStars(card.points);
  const el = document.querySelector(`[data-id="${cardId}"]`);
  if (el) { el.classList.add('added'); setTimeout(() => el.classList.remove('added'), 600); }
}

// ===== 星星特效 =====
function spawnStars(pts) {
  const zone = dropZone.getBoundingClientRect();
  const cx = zone.left + zone.width / 2;
  const cy = zone.top  + zone.height / 2;
  const count = Math.min(6 + Math.floor(pts / 5), 12);
  ['⭐','✨','🌟','💫','🎉','🎊'].forEach((e, i) => {
    if (i >= count) return;
    setTimeout(() => {
      const s = document.createElement('div');
      s.className = 'star'; s.textContent = e;
      const angle = Math.random() * Math.PI * 2;
      const dist  = 60 + Math.random() * 80;
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', (Math.sin(angle) * dist - 60) + 'px');
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }, i * 60);
  });
  // 补充随机星星
  for (let i = 6; i < count; i++) {
    setTimeout(() => {
      const s = document.createElement('div');
      s.className = 'star';
      s.textContent = ['⭐','✨','🌟','💫','🎉','🎊'][Math.floor(Math.random()*6)];
      const angle = Math.random() * Math.PI * 2;
      const dist  = 60 + Math.random() * 80;
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', (Math.sin(angle) * dist - 60) + 'px');
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }, i * 60);
  }
}

// ===== 历史记录 =====
function renderHistory() {
  const list = document.getElementById('historyList');
  const all  = history.slice().reverse();
  const countEl = document.getElementById('historyCount');
  if (countEl) countEl.textContent = all.length ? `共 ${all.length} 条` : '';
  if (!all.length) {
    list.innerHTML = '<div style="text-align:center;color:#ccc;padding:24px;font-size:14px">暂无记录</div>';
    updateHistoryFade(list, false); return;
  }
  list.innerHTML = all.map(h => `
    <div class="history-item">
      <div class="hist-icon ${h.type==='add'?'hist-add':'hist-sub'}">${h.emoji||'📝'}</div>
      <div class="hist-info">
        <div class="hist-desc">${h.desc}</div>
        <div class="hist-time">${h.time}</div>
      </div>
      <div class="hist-score ${h.type==='add'?'plus':'minus'}">${h.type==='add'?'+':'-'}${h.points}</div>
    </div>
  `).join('');
  updateHistoryFade(list, all.length > 5);
  list.onscroll = () => {
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 4;
    updateHistoryFade(list, !atBottom && all.length > 5);
  };
}
function updateHistoryFade(list, show) {
  document.getElementById('historyFade')?.classList.toggle('has-more', show);
}

// ===== 新建卡片弹窗 =====
function openAddModal() {
  selectedEmoji = EMOJIS[0]; selectedTheme = THEMES[0].cls;
  document.getElementById('cardName').value   = '';
  document.getElementById('cardPoints').value = 10;
  renderEmojiGrid(); renderThemeGrid();
  document.getElementById('addModal').classList.add('show');
}
function openDeductModal() {
  document.getElementById('deductPoints').value = 10;
  document.getElementById('deductReason').value  = '';
  document.getElementById('deductModal').classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  if (id === 'editModal') { selectedForDelete.clear(); }
}

function renderEmojiGrid() {
  document.getElementById('emojiGrid').innerHTML = EMOJIS.map(e =>
    `<div class="emoji-opt ${e===selectedEmoji?'selected':''}" onclick="selectEmoji('${e}')">${e}</div>`
  ).join('');
}
function renderThemeGrid() {
  document.getElementById('themeGrid').innerHTML = THEMES.map(t =>
    `<div class="theme-opt ${t.cls===selectedTheme?'selected':''}" style="background:${t.bg};color:${t.accent}" onclick="selectTheme('${t.cls}')">${t.name}</div>`
  ).join('');
}
function selectEmoji(e) { selectedEmoji = e; renderEmojiGrid(); }
function selectTheme(t) { selectedTheme = t; renderThemeGrid(); }

function adjustPoints(d) {
  const el = document.getElementById('cardPoints');
  el.value = Math.max(1, Math.min(999, parseInt(el.value||10) + d));
}
function adjustDeduct(d) {
  const el = document.getElementById('deductPoints');
  el.value = Math.max(1, parseInt(el.value||10) + d);
}
function confirmAddCard() {
  const name = document.getElementById('cardName').value.trim();
  const pts  = parseInt(document.getElementById('cardPoints').value) || 10;
  if (!name) { document.getElementById('cardName').focus(); return; }
  cards.push({ id:Date.now(), emoji:selectedEmoji, name, points:pts, theme:selectedTheme });
  save(); renderCards(); closeModal('addModal');
}
function confirmDeduct() {
  const pts    = parseInt(document.getElementById('deductPoints').value) || 10;
  const reason = document.getElementById('deductReason').value.trim();
  if (!reason) { document.getElementById('deductReason').focus(); return; }
  if (pts > totalScore) { document.getElementById('deductPoints').style.borderColor='#F44336'; return; }
  totalScore = Math.max(0, totalScore - pts);
  updateScore();
  const now = new Date();
  history.push({ type:'sub', emoji:'🎁', desc:`兑换：${reason}`, points:pts,
    time:`${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` });
  save(); renderHistory(); closeModal('deductModal');
}

// 点击遮罩关闭
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

// 初始化
updateScore(); renderCards(); renderHistory();
