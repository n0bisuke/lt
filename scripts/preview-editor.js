(function () {
  if (!window.LT_PREVIEW_DECK) return;

  const adjustments = window.LT_ADJUSTMENTS || {};
  const style = document.createElement('style');
  style.textContent = `
    #lt-edit-toolbar{position:fixed;z-index:2147483000;right:16px;bottom:16px;display:flex;align-items:center;gap:8px;padding:10px 12px;background:#171717;color:#fff;font:14px/1.4 system-ui,sans-serif;border-radius:6px;box-shadow:0 4px 18px #0006}
    #lt-edit-toolbar[hidden]{display:none}#lt-edit-toolbar button{border:1px solid #fff;background:#fff;color:#171717;padding:7px 12px;font:inherit;font-weight:700;cursor:pointer}
    #lt-edit-toolbar .lt-edit-help{max-width:420px}#lt-edit-toolbar .lt-edit-status{color:#d2f5dc;min-width:48px}
    #lt-edit-toolbar:not(.active) .lt-edit-help,#lt-edit-toolbar:not(.active) [data-action="reset"],#lt-edit-toolbar:not(.active) .lt-edit-status{display:none}
    #lt-edit-outline{position:fixed;z-index:2147482999;border:2px solid #00a8ff;box-shadow:0 0 0 99999px #0015;pointer-events:none;display:none}
    #lt-edit-handle{position:absolute;right:-8px;bottom:-8px;width:16px;height:16px;padding:0;border:2px solid #fff;border-radius:50%;background:#00a8ff;box-shadow:0 1px 4px #0008;pointer-events:auto;cursor:nwse-resize}
    #lt-preview-timer{position:fixed;z-index:2147483000;left:16px;bottom:16px;display:flex;align-items:center;gap:5px;padding:4px 7px;border:1px solid #0002;border-radius:5px;background:#f5f5f5d9;color:#555;font:12px/1.3 system-ui,sans-serif;opacity:.72;transition:opacity .15s}
    #lt-preview-timer:hover,#lt-preview-timer:focus-within{opacity:1}
    #lt-preview-timer button{width:20px;height:20px;padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}
    #lt-preview-timer time{min-width:42px;text-align:center;font-variant-numeric:tabular-nums}
    html.lt-editing svg[data-marpit-svg]{cursor:crosshair}html.lt-editing [data-lt-edit-selected]{outline:2px solid #00a8ff!important;outline-offset:2px;cursor:move!important}
  `;
  document.head.append(style);
  const toolbar = document.createElement('div');
  toolbar.id = 'lt-edit-toolbar';
  toolbar.hidden = false;
  toolbar.innerHTML = '<button type="button" data-action="toggle">画像を編集</button><span class="lt-edit-help">画像をドラッグで移動。右下の丸で縦横比を保ってサイズ変更。</span><button type="button" data-action="reset" disabled>画像をリセット</button><span class="lt-edit-status" aria-live="polite"></span>';
  document.body.append(toolbar);
  const timer = document.createElement('div');
  timer.id = 'lt-preview-timer';
  timer.innerHTML = '<button type="button" data-action="toggle" aria-label="タイマー開始" title="タイマー開始">▶</button><time>00:00</time><button type="button" data-action="reset" aria-label="タイマーをリセット" title="タイマーをリセット">↺</button>';
  document.body.append(timer);
  const timerToggle = timer.querySelector('[data-action="toggle"]');
  const timerDisplay = timer.querySelector('time');
  const timerStorageKey = `lt-preview-timer:${window.LT_PREVIEW_DECK}`;
  let timerState = { elapsed: 0, startedAt: null };
  try {
    const saved = JSON.parse(localStorage.getItem(timerStorageKey) || 'null');
    if (saved && Number.isFinite(saved.elapsed)) timerState = saved;
  } catch {}
  function elapsedNow() {
    return timerState.elapsed + (timerState.startedAt ? Date.now() - timerState.startedAt : 0);
  }
  function renderTimer() {
    const seconds = Math.floor(elapsedNow() / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    timerDisplay.textContent = hours ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
    const running = Boolean(timerState.startedAt);
    timerToggle.textContent = running ? 'Ⅱ' : '▶';
    timerToggle.setAttribute('aria-label', running ? 'タイマー一時停止' : 'タイマー開始');
    timerToggle.title = running ? 'タイマー一時停止' : 'タイマー開始';
  }
  function saveTimerState() {
    try { localStorage.setItem(timerStorageKey, JSON.stringify(timerState)); } catch {}
    renderTimer();
  }
  timerToggle.addEventListener('click', () => {
    if (timerState.startedAt) {
      timerState.elapsed = elapsedNow();
      timerState.startedAt = null;
    } else {
      timerState.startedAt = Date.now();
    }
    saveTimerState();
  });
  timer.querySelector('[data-action="reset"]').addEventListener('click', () => {
    timerState = { elapsed: 0, startedAt: null };
    saveTimerState();
  });
  renderTimer();
  setInterval(renderTimer, 250);
  const outline = document.createElement('div');
  outline.id = 'lt-edit-outline';
  outline.innerHTML = '<button id="lt-edit-handle" type="button" aria-label="サイズを変更"></button>';
  document.body.append(outline);

  const toggle = toolbar.querySelector('[data-action="toggle"]');
  const resetButton = toolbar.querySelector('[data-action="reset"]');
  const status = toolbar.querySelector('.lt-edit-status');
  const handle = outline.querySelector('#lt-edit-handle');
  let editing = false;
  let selected = null;
  let drag = null;
  let saveTimer;
  let statusTimer;

  function keyFor(target) {
    const svg = target.closest('svg[data-marpit-svg]');
    const sections = svg ? Array.from(svg.querySelectorAll('foreignObject > section')) : [];
    const section = sections.find((item) => item.contains(target));
    if (!svg || !section || section === target) return null;
    const slides = Array.from(svg.parentElement.querySelectorAll(':scope > svg[data-marpit-svg]'));
    const slide = slides.indexOf(svg);
    const sectionIndex = sections.indexOf(section);
    const path = [];
    let node = target;
    while (node && node !== section) {
      const parent = node.parentElement;
      if (!parent) return null;
      path.unshift(Array.prototype.indexOf.call(parent.children, node));
      node = parent;
    }
    if (path.some((index) => index < 0)) return null;
    return { key: `${slide}:${sectionIndex}:${path.join('.')}`, slide, sectionIndex, path };
  }

  function findTarget(key) {
    const [slide, sectionIndex, ...indices] = key.split(':');
    const svg = Array.from(document.querySelectorAll('svg[data-marpit-svg]'))[Number(slide)];
    let target = svg?.querySelectorAll('foreignObject > section')[Number(sectionIndex)];
    for (const index of indices.join(':').split('.').filter(Boolean)) target = target?.children[Number(index)];
    return target || null;
  }

  function applyAdjustment(key, adjustment) {
    const target = findTarget(key);
    if (!target) return;
    if (!Object.prototype.hasOwnProperty.call(target.dataset, 'ltEditOriginalWidth')) target.dataset.ltEditOriginalWidth = target.style.width;
    if (!Object.prototype.hasOwnProperty.call(target.dataset, 'ltEditOriginalHeight')) target.dataset.ltEditOriginalHeight = target.style.height;
    target.dataset.ltEditKey = key;
    target.style.translate = adjustment.x || adjustment.y ? `${adjustment.x}px ${adjustment.y}px` : 'none';
    if (adjustment.width !== null) target.style.width = `${adjustment.width}px`;
    if (adjustment.height !== null) target.style.height = `${adjustment.height}px`;
  }

  Object.entries(adjustments).forEach(([key, value]) => applyAdjustment(key, value));

  function scaleFor(target) {
    const svg = target.closest('svg[data-marpit-svg]');
    return svg ? svg.getBoundingClientRect().width / 1280 : 1;
  }

  function drawOutline() {
    if (!selected) { outline.style.display = 'none'; return; }
    const rect = selected.target.getBoundingClientRect();
    outline.style.display = 'block';
    outline.style.left = `${rect.left}px`;
    outline.style.top = `${rect.top}px`;
    outline.style.width = `${rect.width}px`;
    outline.style.height = `${rect.height}px`;
    resetButton.disabled = !adjustments[selected.key];
  }

  function select(target, location) {
    if (selected) delete selected.target.dataset.ltEditSelected;
    if (!Object.prototype.hasOwnProperty.call(target.dataset, 'ltEditOriginalWidth')) target.dataset.ltEditOriginalWidth = target.style.width;
    if (!Object.prototype.hasOwnProperty.call(target.dataset, 'ltEditOriginalHeight')) target.dataset.ltEditOriginalHeight = target.style.height;
    selected = { target, originalWidth: target.dataset.ltEditOriginalWidth, originalHeight: target.dataset.ltEditOriginalHeight, ...location };
    target.dataset.ltEditSelected = 'true';
    drawOutline();
    resetButton.disabled = !adjustments[location.key];
    status.textContent = `選択中：${target.tagName.toLowerCase()}`;
  }

  function liveAdjustment() {
    const scale = scaleFor(selected.target) || 1;
    const rect = selected.target.getBoundingClientRect();
    const previous = adjustments[selected.key] || { x: 0, y: 0, width: null, height: null };
    const translated = selected.target.style.translate.match(/(-?[\d.]+)px\s+(-?[\d.]+)px/);
    const width = selected.target.style.width ? rect.width / scale : null;
    const height = selected.target.style.height ? rect.height / scale : null;
    return {
      x: translated ? Number(translated[1]) : previous.x,
      y: translated ? Number(translated[2]) : previous.y,
      width: width === null ? null : Math.round(width),
      height: height === null ? null : Math.round(height),
      _bounds: { rect, scale },
    };
  }

  function persist(reset) {
    if (!selected) return;
    status.textContent = '保存中…';
    const adjustment = liveAdjustment();
    delete adjustment._bounds;
    fetch('/__preview-adjustments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deck: window.LT_PREVIEW_DECK, key: selected.key, adjustment, reset: Boolean(reset) }),
    }).then((response) => {
      if (!response.ok) throw new Error('保存できませんでした');
      return response.json();
    }).then((saved) => {
      Object.keys(adjustments).forEach((key) => delete adjustments[key]);
      Object.assign(adjustments, saved);
      if (reset) {
        selected.target.style.translate = 'none';
        selected.target.style.width = selected.originalWidth;
        selected.target.style.height = selected.originalHeight;
        delete selected.target.dataset.ltEditKey;
        resetButton.disabled = true;
      } else {
        selected.target.dataset.ltEditKey = selected.key;
      }
      status.textContent = '保存済み';
      drawOutline();
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => { status.textContent = ''; }, 1800);
    }).catch(() => { status.textContent = '保存エラー'; });
  }

  function setTranslate(target, x, y) {
    target.style.translate = x || y ? `${Math.round(x)}px ${Math.round(y)}px` : 'none';
  }

  function startMove(event) {
    if (!editing || event.target.closest('#lt-edit-toolbar, #lt-edit-outline')) return;
    if (!event.target.closest('svg[data-marpit-svg]')) return;
    const candidate = event.target.closest('img');
    if (!candidate || candidate.closest('#lt-edit-toolbar')) return;
    const location = keyFor(candidate);
    if (!location) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    select(candidate, location);
    const current = adjustments[location.key] || { x: 0, y: 0 };
    drag = { type: 'move', startX: event.clientX, startY: event.clientY, x: current.x, y: current.y, scale: scaleFor(candidate) || 1 };
    candidate.setPointerCapture?.(event.pointerId);
  }

  function move(event) {
    if (!drag || !selected) return;
    if (drag.type === 'move') {
      const dx = (event.clientX - drag.startX) / drag.scale;
      const dy = (event.clientY - drag.startY) / drag.scale;
      setTranslate(selected.target, drag.x + dx, drag.y + dy);
    } else {
      const rect = drag.rect;
      const scale = drag.scale;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const ratioChange = Math.abs(dx / rect.width) > Math.abs(dy / rect.height) ? dx / rect.width : dy / rect.height;
      const factor = Math.max(0.1, 1 + ratioChange);
      selected.target.style.width = `${Math.max(24, rect.width * factor / scale)}px`;
      selected.target.style.height = `${Math.max(24, rect.height * factor / scale)}px`;
    }
    drawOutline();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist(false), 350);
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    if (selected) {
      persist(false);
    }
  }

  toggle.addEventListener('click', () => {
    editing = !editing;
    toolbar.classList.toggle('active', editing);
    document.documentElement.classList.toggle('lt-editing', editing);
    toggle.textContent = editing ? '画像編集を終了' : '画像を編集';
    if (!editing) { outline.style.display = 'none'; if (selected) delete selected.target.dataset.ltEditSelected; selected = null; }
  });
  resetButton.addEventListener('click', () => persist(true));
  document.addEventListener('pointerdown', startMove, true);
  document.addEventListener('click', (event) => {
    if (!editing || !event.target.closest('svg[data-marpit-svg]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const candidate = event.target.closest('img');
    const location = candidate && keyFor(candidate);
    if (location) select(candidate, location);
  }, true);
  document.addEventListener('pointermove', move, true);
  document.addEventListener('pointerup', endDrag, true);
  document.addEventListener('pointercancel', endDrag, true);
  handle.addEventListener('pointerdown', (event) => {
    if (!selected) return;
    event.preventDefault(); event.stopPropagation();
    const rect = selected.target.getBoundingClientRect();
    drag = { type: 'resize', startX: event.clientX, startY: event.clientY, rect, scale: scaleFor(selected.target) || 1 };
    handle.setPointerCapture(event.pointerId);
  });
  window.addEventListener('resize', drawOutline);
  toggle.addEventListener('dblclick', (event) => event.preventDefault());
})();
