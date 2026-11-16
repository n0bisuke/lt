/* IoTLT LT Slides: deck runtime. Call IoTLT.Deck.mount() from a deck page; loading alone does nothing. */
window.IoTLT = (function () {
  function mount(root) {
    var deck = root || document.querySelector('.lt-deck');
    if (!deck) return null;
    // 手書き HTML のスライドと、Marp が出力するスライド（svg）の両方を扱う
    var slides = Array.prototype.slice.call(deck.querySelectorAll('.lt-slide, svg[data-marpit-svg]'));
    var html = document.documentElement;
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
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      history.replaceState(null, '', '#' + (index + 1));
    }
    addEventListener('resize', fit);
    addEventListener('keydown', function (e) {
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
