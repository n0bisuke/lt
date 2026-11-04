/* IoTLT LT Slides: deck runtime. Call IoTLT.Deck.mount() from a deck page; loading alone does nothing. */
window.IoTLT = (function () {
  function mount(root) {
    var deck = root || document.querySelector('.lt-deck');
    if (!deck) return null;
    var slides = Array.prototype.slice.call(deck.querySelectorAll('.lt-slide'));
    var html = document.documentElement;
    if (/[?&]overview\b/.test(location.search)) {
      html.classList.add('lt-deck-overview');
      deck.classList.add('lt-deck--overview');
      slides.forEach(function (s) {
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
