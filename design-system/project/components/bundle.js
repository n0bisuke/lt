/* IoTLT LT Slides: deck runtime. Call IoTLT.Deck.mount() from a deck page; loading alone does nothing. */
window.IoTLT = (function () {
  function mount(root) {
    var deck = root || document.querySelector('.lt-deck');
    if (!deck) return null;
    // 手書き HTML のスライドと、Marp が出力するスライド（svg）の両方を扱う
    var slides = Array.prototype.slice.call(deck.querySelectorAll('.lt-slide, svg[data-marpit-svg]'));
    var html = document.documentElement;
    var wholeLock = deck.hasAttribute('data-lt-gated');
    var wholeLockId = deck.getAttribute('data-lt-lock-id') || '';
    var wholeStorageKey = 'lt-access:' + wholeLockId;
    if (wholeLock) {
      try { if (sessionStorage.getItem(wholeStorageKey) === '1') deck.classList.add('lt-access-open'); } catch (e) {}
    }
    var gate = null;
    var gateInput = null;
    var gateError = null;
    var pendingLockedIndex = null;
    var lockStorageKey = 'lt-unlocked-slides:' + location.pathname;
    var unlocked = {};
    try {
      unlocked = JSON.parse(sessionStorage.getItem(lockStorageKey) || '{}') || {};
      slides.forEach(function (slide, index) {
        if (slide.hasAttribute('data-lt-locked') && unlocked[index]) slide.classList.add('lt-lock-open');
      });
    } catch (e) {}
    function lockGate() {
      if (gate) return gate;
      gate = document.createElement('div');
      gate.className = 'lt-lock-gate';
      gate.hidden = true;
      gate.innerHTML = '<form class="lt-lock-card"><h2>限定スライド</h2><p>閲覧用の合言葉を入力してください。</p><label>合言葉<input type="password" autocomplete="current-password" required></label><p class="lt-lock-error" role="alert" aria-live="polite"></p><div class="lt-lock-actions"><button type="button" data-action="back">戻る</button><button type="submit">開く</button></div></form>';
      document.body.appendChild(gate);
      gateInput = gate.querySelector('input');
      gateError = gate.querySelector('.lt-lock-error');
      gate.querySelector('[data-action="back"]').addEventListener('click', function () {
        gate.hidden = true;
        pendingLockedIndex = null;
      });
      gate.addEventListener('submit', function (event) {
        event.preventDefault();
        var index = pendingLockedIndex;
        var slide = slides[index];
        if (!slide) return;
        var verifier = wholeLock ? deck : slide;
        var saltHex = verifier.getAttribute('data-lt-lock-salt') || '';
        var expected = (verifier.getAttribute('data-lt-lock-hash') || '').toLowerCase();
        var salt = new Uint8Array(saltHex.match(/.{2}/g).map(function (part) { return parseInt(part, 16); }));
        var encoded = new TextEncoder().encode(gateInput.value);
        gateError.textContent = '';
        crypto.subtle.importKey('raw', encoded, 'PBKDF2', false, ['deriveBits']).then(function (key) {
          return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 210000, hash: 'SHA-256' }, key, 256);
        }).then(function (bits) {
          var actual = Array.prototype.map.call(new Uint8Array(bits), function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
          if (actual !== expected) throw new Error('wrong-key');
          if (wholeLock) {
            deck.classList.add('lt-access-open');
            try { sessionStorage.setItem(wholeStorageKey, '1'); } catch (e) {}
          } else {
            slide.classList.add('lt-lock-open');
            unlocked[index] = true;
            try { sessionStorage.setItem(lockStorageKey, JSON.stringify(unlocked)); } catch (e) {}
          }
          gate.hidden = true;
          gateInput.value = '';
          show(index);
          if (wholeLock && window.parent !== window) window.parent.postMessage({ type: 'lt-lock-unlocked', id: wholeLockId }, location.origin);
        }).catch(function () {
          gateError.textContent = '合言葉が違います。もう一度入力してください。';
          gateInput.select();
          if (wholeLock && window.parent !== window) window.parent.postMessage({ type: 'lt-lock-denied', id: wholeLockId }, location.origin);
        });
      });
      return gate;
    }
    window.addEventListener('message', function (event) {
      if (event.origin !== location.origin || !event.data || event.data.type !== 'lt-lock-check'
        || !wholeLock || event.data.id !== wholeLockId || typeof event.data.phrase !== 'string') return;
      pendingLockedIndex = parseInt(location.hash.slice(1), 10) - 1 || 0;
      var modal = lockGate();
      modal.hidden = false;
      gateInput.value = event.data.phrase;
      gate.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    function mountTimer(mode) {
      if (window.LT_PREVIEW_DECK || document.getElementById('lt-presentation-timer')) return;
      var duration = mode === 'timer5' ? 5 * 60 * 1000 : mode === 'timer10' ? 10 * 60 * 1000 : null;
      var key = 'lt-presentation-timer:' + location.pathname + ':' + mode;
      var timer = document.createElement('div');
      timer.id = 'lt-presentation-timer';
      timer.setAttribute('role', 'group');
      timer.setAttribute('aria-label', mode === 'stopwatch' ? 'ストップウォッチ' : (duration / 60000) + '分タイマー');
      timer.innerHTML = '<span class="lt-timer-mode"></span><button type="button" data-action="toggle"></button><time aria-live="off"></time><button type="button" data-action="reset" aria-label="タイマーをリセット" title="タイマーをリセット">↺</button>';
      document.body.appendChild(timer);
      var modeLabel = timer.querySelector('.lt-timer-mode');
      var toggle = timer.querySelector('[data-action="toggle"]');
      var display = timer.querySelector('time');
      modeLabel.textContent = mode === 'stopwatch' ? '計測' : (duration / 60000) + '分';
      var state = duration === null ? { elapsed: 0, startedAt: null } : { remaining: duration, startedAt: null };
      try {
        var saved = JSON.parse(localStorage.getItem(key) || 'null');
        if (saved && Number.isFinite(duration === null ? saved.elapsed : saved.remaining)) state = saved;
      } catch (e) {}
      function valueNow() {
        var passed = state.startedAt ? Date.now() - state.startedAt : 0;
        return duration === null ? state.elapsed + passed : Math.max(0, state.remaining - passed);
      }
      function render() {
        var value = valueNow();
        if (duration !== null && value <= 0 && state.startedAt) {
          state.remaining = 0;
          state.startedAt = null;
          value = 0;
          try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
        }
        var seconds = Math.floor(value / 1000);
        display.textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
        var running = Boolean(state.startedAt);
        toggle.textContent = running ? 'Ⅱ' : '▶';
        toggle.setAttribute('aria-label', running ? 'タイマー一時停止' : 'タイマー開始');
        toggle.title = running ? 'タイマー一時停止' : 'タイマー開始';
      }
      function saveAndRender() {
        try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
        render();
      }
      toggle.addEventListener('click', function () {
        if (state.startedAt) {
          if (duration === null) state.elapsed = valueNow();
          else state.remaining = valueNow();
          state.startedAt = null;
        } else if (duration === null || state.remaining > 0) {
          state.startedAt = Date.now();
        }
        saveAndRender();
      });
      timer.querySelector('[data-action="reset"]').addEventListener('click', function () {
        state = duration === null ? { elapsed: 0, startedAt: null } : { remaining: duration, startedAt: null };
        saveAndRender();
      });
      render();
      window.setInterval(render, 250);
    }
    var timerMode = location.hash.slice(1);
    if (timerMode === 'stopwatch' || timerMode === 'timer5' || timerMode === 'timer10') mountTimer(timerMode);
    if (/[?&]overview\b/.test(location.search)) {
      html.classList.add('lt-deck-overview');
      deck.classList.add('lt-deck--overview');
      slides.forEach(function (s) {
        // Marp のテーマは div.marpit > svg を前提にしているので、svg は包まない
        if (s.tagName.toLowerCase() === 'svg') return;
        var w = document.createElement('div');
        w.className = 'lt-slide-wrap';
        s.parentNode.insertBefore(w, s);
        w.appendChild(s);
      });
      return { slides: slides };
    }
    html.classList.add('lt-deck-root');
    deck.classList.add('lt-deck--mounted');
    var index = 0;
    function fit() {
      var k = Math.min(innerWidth / 1920, innerHeight / 1080);
      slides.forEach(function (s) {
        if (s.tagName.toLowerCase() === 'svg') return; // svg は CSS で画面に合わせる
        s.style.transform = 'translate(-50%, -50%) scale(' + k + ')';
      });
    }
    function show(i) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      if (wholeLock && !deck.classList.contains('lt-access-open')) {
        pendingLockedIndex = index;
        var pageGate = lockGate();
        pageGate.hidden = false;
        gateError.textContent = '';
        if (window.parent === window) window.setTimeout(function () { gateInput.focus(); }, 0);
        return;
      }
      if (slides[index].hasAttribute('data-lt-locked') && !slides[index].classList.contains('lt-lock-open')) {
        pendingLockedIndex = index;
        var modal = lockGate();
        modal.hidden = false;
        gateError.textContent = '';
        window.setTimeout(function () { gateInput.focus(); }, 0);
        return;
      }
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      history.replaceState(null, '', '#' + (index + 1));
    }
    addEventListener('resize', fit);
    addEventListener('keydown', function (e) {
      if (e.metaKey && e.key === 'ArrowLeft' && index === 0) return;
      if (gate && !gate.hidden) {
        if (e.key === 'Escape') { gate.hidden = true; pendingLockedIndex = null; e.preventDefault(); return; }
        if (e.target.closest && e.target.closest('.lt-lock-card')) return;
        e.preventDefault();
        return;
      }
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].indexOf(e.key) >= 0) { e.preventDefault(); show(index + 1); }
      if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].indexOf(e.key) >= 0) { e.preventDefault(); show(index - 1); }
      if (e.key === 'Home') show(0);
      if (e.key === 'End') show(slides.length - 1);
      if (e.key === 'f' && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    });
    deck.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      show(index + (e.clientX < innerWidth / 3 ? -1 : 1));
    });
    fit();
    show((parseInt(location.hash.slice(1), 10) || 1) - 1);
    return { slides: slides, show: show };
  }
  return { Deck: { mount: mount } };
})();
