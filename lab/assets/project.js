(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* theme (shared with the home page) */
  try { var t = localStorage.getItem('theme'); if (t) root.setAttribute('data-theme', t); } catch (e) {}
  var themeBtn = document.getElementById('theme');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* scroll progress */
  var prog = document.getElementById('progress');
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* reveal */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(function (n) { io.observe(n); });

  /* video: speed buttons + pause when off-screen */
  document.querySelectorAll('.player').forEach(function (p) {
    var v = p.querySelector('video');
    if (!v) return;
    p.querySelectorAll('[data-speed]').forEach(function (b) {
      b.addEventListener('click', function () {
        v.playbackRate = parseFloat(b.dataset.speed);
        p.querySelectorAll('[data-speed]').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
    var tc = p.querySelector('.tc');
    if (tc) v.addEventListener('timeupdate', function () {
      function f(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
      tc.textContent = f(v.currentTime) + ' / ' + f(v.duration);
    });
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
    else new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause();
    }, { threshold: .25 }).observe(v);
  });

  /* ---------- presentation mode ---------- */
  var main = document.querySelector('main');
  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-slide]'));
  var ui = document.createElement('div'); ui.id = 'deck-ui';
  ui.innerHTML = '<button data-a="prev" aria-label="Previous slide">‹</button><span id="deck-n">1 / ' + slides.length + '</span><button data-a="next" aria-label="Next slide">›</button><button class="x" data-a="exit">Esc · exit</button>';
  var hint = document.createElement('div'); hint.id = 'deck-hint'; hint.textContent = '← → / space to move · F fullscreen · Esc exit';
  document.body.appendChild(ui); document.body.appendChild(hint);
  var cur = 0, presenting = false;

  function current() {
    var best = 0, bd = Infinity;
    slides.forEach(function (s, i) { var d = Math.abs(s.getBoundingClientRect().top); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function go(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides[cur].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('deck-n').textContent = (cur + 1) + ' / ' + slides.length;
  }
  function start() {
    presenting = true; document.body.classList.add('present');
    try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {}); } catch (e) {}
    setTimeout(function () { go(0); }, 60);
  }
  function stop() {
    presenting = false; document.body.classList.remove('present');
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  }
  document.querySelectorAll('[data-present]').forEach(function (b) { b.addEventListener('click', start); });
  ui.addEventListener('click', function (e) {
    var a = e.target.getAttribute('data-a');
    if (a === 'prev') go(current() - 1); else if (a === 'next') go(current() + 1); else if (a === 'exit') stop();
  });
  main.addEventListener('scroll', function () {
    if (!presenting) return;
    cur = current(); document.getElementById('deck-n').textContent = (cur + 1) + ' / ' + slides.length;
  }, { passive: true });
  addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea, video')) return;
    if (!presenting) { if (e.key === 'p' || e.key === 'P') start(); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(current() + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(current() - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key === 'f' || e.key === 'F') { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (er) {} }
    else if (e.key === 'Escape') stop();
  });
  // Esc in fullscreen is swallowed by the browser, so leaving fullscreen also leaves the deck
  var wasFull = false;
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) wasFull = true;
    else if (wasFull && presenting) { wasFull = false; stop(); }
  });
})();
