(function () {
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  var N = slides.length, cur = 0;
  var deckTitle = document.body.getAttribute('data-deck') || document.title;
  var home = document.body.getAttribute('data-home') || '../index.html#work';
  var params = new URLSearchParams(location.search);
  var isPresenter = params.has('presenter');
  var chan = null;
  /* theme: shared with the home page through localStorage 'theme-v3' (dark by default) */
  var root = document.documentElement;
  function savedTheme() { try { return localStorage.getItem('theme-v3') || 'dark'; } catch (e) { return 'dark'; } }
  root.setAttribute('data-theme', savedTheme());
  function toggleTheme() {
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme-v3', t); } catch (e) {}
  }
  addEventListener('storage', function (e) { if (e.key === 'theme-v3') root.setAttribute('data-theme', savedTheme()); });
  try { chan = new BroadcastChannel('deck:' + location.pathname); } catch (e) {}
  function send(msg) {
    if (chan) chan.postMessage(msg);
    try { localStorage.setItem('deck-msg:' + location.pathname, JSON.stringify(Object.assign({ t: Date.now() }, msg))); } catch (e) {}
  }
  function onMsg(fn) {
    if (chan) chan.onmessage = function (e) { fn(e.data); };
    addEventListener('storage', function (e) { if (e.key === 'deck-msg:' + location.pathname && e.newValue) try { fn(JSON.parse(e.newValue)); } catch (er) {} });
  }
  function notesHTML(i) { var n = slides[i] && slides[i].querySelector('.notes'); return n ? n.innerHTML : '<p style="color:#8a847c">No notes for this slide.</p>'; }
  function titleOf(i) { var s = slides[i]; if (!s) return ''; return s.getAttribute('data-title') || (s.querySelector('h1,h2') || {}).textContent || ('Slide ' + (i + 1)); }

  /* ================= presenter window ================= */
  if (isPresenter) { presenter(); return; }

  /* page numbers + footer brand */
  slides.forEach(function (s, i) {
    var pg = document.createElement('div'); pg.className = 'pg'; pg.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0'); s.appendChild(pg);
    if (!s.classList.contains('title')) { var b = document.createElement('div'); b.className = 'brandline'; b.textContent = 'Sowmiya Jeromiah · ' + deckTitle; s.appendChild(b); }
  });

  /* chrome */
  var bar = document.createElement('div'); bar.id = 'bar';
  bar.innerHTML =
    '<a class="b" href="' + home + '" title="Back to portfolio">← site</a>' +
    '<div class="ttl"><b>' + deckTitle + '</b> · <span id="sttl"></span></div>' +
    '<button id="bPrev" title="Previous (←)">‹</button><span class="cnt" id="cnt"></span><button id="bNext" title="Next (→ / space)">›</button>' +
    '<button id="bNotes" title="Speaker notes (N)">notes</button>' +
    '<button id="bOv" class="hide-s" title="All slides (O)">grid</button>' +
    '<button id="bPres" class="hide-s" title="Presenter window with notes & timer (S)">presenter</button>' +
    '<button id="bRead" title="Scroll / read mode (R)">read</button>' +
    '<button id="bTheme" title="Light / dark theme (T)">◐</button>' +
    '<button id="bFs" class="hide-s" title="Fullscreen (F)">⛶</button>' +
    '<button id="bHelp" class="hide-s" title="Keyboard shortcuts (?)">?</button>';
  document.body.appendChild(bar);
  var prog = document.createElement('div'); prog.id = 'prog'; document.body.appendChild(prog);
  if (!document.querySelector('.slide .notes')) document.body.classList.add('no-notes');
  var notes = document.createElement('div'); notes.id = 'notes'; notes.innerHTML = '<div class="h">Speaker notes</div><div class="tx" id="ntx"></div>'; document.body.appendChild(notes);
  var ov = document.createElement('div'); ov.id = 'overview'; ov.innerHTML = '<div class="gridv" id="ovg"></div>'; document.body.appendChild(ov);
  var help = document.createElement('div'); help.id = 'help';
  help.innerHTML = '<b>→ space</b>next<br><b>←</b>previous<br><b>N</b>speaker notes<br><b>O</b>all slides<br><b>S</b>presenter window<br><b>F</b>fullscreen<br><b>T</b>light / dark<br><b>R</b>read / scroll mode<br><b>Home End</b>first / last<br><b>Esc</b>close';
  document.body.appendChild(help);

  /* ================= deck mode ================= */
  function fit() {
    if (document.body.classList.contains('read-mode')) return readFit();
    var vp = document.getElementById('viewport').getBoundingClientRect();
    var s = Math.min(vp.width / 1600, vp.height / 900) * .965;
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  function playVideos(i) {
    slides.forEach(function (s, k) {
      s.querySelectorAll('video').forEach(function (v) {
        if (k === i) { if (!v.src && v.dataset.src) v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    });
  }
  function go(i, quiet) {
    cur = Math.max(0, Math.min(N - 1, i));
    slides.forEach(function (s, k) { s.classList.toggle('active', k === cur); s.classList.toggle('past', k < cur); s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
    document.getElementById('cnt').textContent = (cur + 1) + ' / ' + N;
    document.getElementById('sttl').textContent = titleOf(cur);
    document.getElementById('ntx').innerHTML = notesHTML(cur);
    prog.style.width = ((cur + 1) / N * 100) + '%';
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#' + (cur + 1));
    if (!document.body.classList.contains('read-mode')) playVideos(cur);
    if (!quiet) send({ type: 'go', i: cur });
  }
  function next() { go(cur + 1); } function prev() { go(cur - 1); }

  /* overview */
  function buildOverview() {
    var g = document.getElementById('ovg'); g.innerHTML = '';
    slides.forEach(function (s, i) {
      var b = document.createElement('button'); b.setAttribute('aria-label', 'Go to slide ' + (i + 1) + ': ' + titleOf(i));
      if (i === cur) b.className = 'cur';
      var t = document.createElement('div'); t.className = 'thumb'; var c = s.cloneNode(true); c.classList.add('active');
      c.querySelectorAll('video').forEach(function (v) { v.removeAttribute('src'); v.removeAttribute('autoplay'); v.preload = 'none'; });
      t.appendChild(c); b.appendChild(t);
      var l = document.createElement('div'); l.className = 'lab'; l.textContent = (i + 1) + ' · ' + titleOf(i); b.appendChild(l);
      b.addEventListener('click', function () { toggle('ov-open', false); go(i); });
      g.appendChild(b);
      requestAnimationFrame(function () { t.style.transform = 'scale(' + (b.clientWidth / 1600) + ')'; });
    });
  }
  function toggle(cls, force) {
    var on = document.body.classList.toggle(cls, force);
    if (cls === 'ov-open' && on) buildOverview();
    document.getElementById('bNotes').classList.toggle('on', document.body.classList.contains('notes-open'));
    document.getElementById('bOv').classList.toggle('on', document.body.classList.contains('ov-open'));
    fit();
    return on;
  }

  /* read mode */
  var readBuilt = false;
  function setRead(on) {
    document.body.classList.toggle('read-mode', on);
    document.body.classList.toggle('deck-mode', !on);
    document.getElementById('bRead').classList.toggle('on', on);
    if (on && !readBuilt) {
      slides.forEach(function (s) {
        var w = document.createElement('div'); w.className = 'rwrap'; s.parentNode.insertBefore(w, s); w.appendChild(s);
        if (!s.querySelector('.notes')) return;
        var n = document.createElement('div'); n.className = 'rnotes'; n.innerHTML = '<div class="h">Speaker notes</div>' + s.querySelector('.notes').innerHTML;
        w.parentNode.insertBefore(n, w.nextSibling);
      });
      readBuilt = true;
    }
    if (!on && readBuilt) {
      document.querySelectorAll('.rwrap').forEach(function (w) { var s = w.firstChild; w.parentNode.insertBefore(s, w); w.remove(); });
      document.querySelectorAll('.rnotes').forEach(function (n) { n.remove(); });
      slides.forEach(function (s) { s.style.transform = ''; });
      readBuilt = false;
    }
    slides.forEach(function (s) { s.querySelectorAll('video').forEach(function (v) { if (on) { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.controls = true; v.pause(); } else v.controls = false; }); });
    if (on) { readFit(); var t = slides[cur].parentNode; setTimeout(function () { t.scrollIntoView({ block: 'start' }); }, 30); }
    else { fit(); go(cur); }
  }
  function readFit() {
    var w = Math.min(innerWidth - 24, 1600), s = w / 1600;
    document.querySelectorAll('.rwrap').forEach(function (r) { r.style.width = w + 'px'; r.style.height = (900 * s) + 'px'; r.firstChild.style.transform = 'scale(' + s + ')'; });
    document.querySelectorAll('.rnotes').forEach(function (n) { n.style.maxWidth = w + 'px'; });
  }

  /* presenter window */
  function openPresenter() {
    var u = location.pathname + '?presenter#' + (cur + 1);
    var w = window.open(u, 'presenter', 'width=1100,height=760');
    if (!w) alert('Allow pop-ups for this site to open the presenter window.');
  }

  /* events */
  document.getElementById('bPrev').onclick = prev;
  document.getElementById('bNext').onclick = next;
  document.getElementById('bNotes').onclick = function () { toggle('notes-open'); };
  document.getElementById('bOv').onclick = function () { toggle('ov-open'); };
  document.getElementById('bPres').onclick = openPresenter;
  document.getElementById('bRead').onclick = function () { setRead(!document.body.classList.contains('read-mode')); };
  document.getElementById('bHelp').onclick = function () { toggle('help-open'); };
  document.getElementById('bFs').onclick = fullscreen;
  document.getElementById('bTheme').onclick = toggleTheme;
  function fullscreen() {
    try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {}
  }
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    var k = e.key, read = document.body.classList.contains('read-mode');
    if (k === 'Escape') { toggle('ov-open', false); toggle('help-open', false); return; }
    if (k === 'r' || k === 'R') return setRead(!read);
    if (read) return;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter' || k === 'ArrowDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace' || k === 'ArrowUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(N - 1);
    else if (k === 'n' || k === 'N') toggle('notes-open');
    else if (k === 'o' || k === 'O' || k === 'g' || k === 'G') toggle('ov-open');
    else if (k === 'f' || k === 'F') fullscreen();
    else if (k === 's' || k === 'S') openPresenter();
    else if (k === 't' || k === 'T') toggleTheme();
    else if (k === '?') toggle('help-open');
  });
  stage.addEventListener('click', function (e) {
    if (document.body.classList.contains('read-mode')) return;
    if (e.target.closest('a, button, video, input, label, details, .dm')) return;
    var r = stage.getBoundingClientRect();
    if (e.clientX < r.left + r.width * .22) prev(); else next();
  });
  var tx = null;
  stage.addEventListener('touchstart', function (e) { tx = e.target.closest('.dm') ? null : e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (tx === null || document.body.classList.contains('read-mode')) return;
    var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) dx < 0 ? next() : prev(); tx = null;
  });
  addEventListener('resize', fit);
  onMsg(function (m) { if (m.type === 'go' && m.i !== cur) go(m.i, true); if (m.type === 'hello') send({ type: 'go', i: cur }); });

  /* start */
  var h = parseInt(location.hash.slice(1), 10);
  document.body.classList.add('deck-mode');
  go(isNaN(h) ? 0 : h - 1, true);
  fit();
  if (params.has('read') || (innerWidth < 700 && innerHeight > innerWidth)) setRead(true);

  /* ================= presenter view ================= */
  function presenter() {
    document.title = 'Presenter · ' + deckTitle;
    document.body.innerHTML = '';
    var css = document.createElement('style');
    css.textContent = 'body{margin:0;background:#0d0e11;color:#e8e4de;font-family:Inter,system-ui,sans-serif;display:grid;grid-template-columns:1.25fr 1fr;grid-template-rows:auto 1fr auto;height:100vh;gap:14px;padding:14px;box-sizing:border-box}' +
      '.pv{position:relative;background:#1b1c21;border:1px solid #3b3e45;border-radius:10px;overflow:hidden;aspect-ratio:16/9}.pv .slide{position:absolute;left:0;top:0;width:1600px;height:900px;transform-origin:0 0;opacity:1;visibility:visible;transform:none}' +
      '.lbl{font:500 12px "JetBrains Mono",monospace;color:#ff8a2b;text-transform:uppercase;letter-spacing:.1em;margin:0 0 6px}' +
      '#nt{grid-column:2;grid-row:1/3;overflow:auto;background:#17181c;border:1px solid #2f3238;border-radius:10px;padding:18px 22px;font-size:20px;line-height:1.6}#nt p{margin:0 0 12px}#nt ul{padding-left:22px;margin:0 0 12px}' +
      '#ctl{grid-column:1/3;display:flex;gap:10px;align-items:center;font:500 15px "JetBrains Mono",monospace}#ctl button{height:44px;padding:0 18px;border-radius:9px;border:1px solid #2f3238;background:#17181c;color:#fff;font:inherit;cursor:pointer}#ctl button:hover{border-color:#ff8a2b;color:#ff8a2b}#tm{font-size:28px;color:#fff;margin-left:auto}#c{min-width:80px;text-align:center}' +
      '.left{display:flex;flex-direction:column;gap:12px;min-height:0}.nextwrap{width:60%}';
    document.head.appendChild(css);
    var left = document.createElement('div'); left.className = 'left';
    left.innerHTML = '<div><div class="lbl">Current slide</div><div class="pv" id="pc"></div></div><div class="nextwrap"><div class="lbl">Next</div><div class="pv" id="pn"></div></div>';
    var nt = document.createElement('div'); nt.id = 'nt';
    var ctl = document.createElement('div'); ctl.id = 'ctl';
    ctl.innerHTML = '<button id="pp">‹ prev</button><span id="c"></span><button id="pnx">next ›</button><button id="rs">reset timer</button><span id="tm">00:00</span>';
    document.body.appendChild(left); document.body.appendChild(nt); document.body.appendChild(ctl);
    var i0 = parseInt(location.hash.slice(1), 10); cur = isNaN(i0) ? 0 : i0 - 1;
    function show(i) {
      cur = Math.max(0, Math.min(N - 1, i));
      [['pc', cur], ['pn', cur + 1]].forEach(function (x) {
        var box = document.getElementById(x[0]); box.innerHTML = '';
        if (slides[x[1]]) { var c = slides[x[1]].cloneNode(true); c.classList.add('active'); c.querySelectorAll('video').forEach(function (v) { v.removeAttribute('src'); v.removeAttribute('autoplay'); }); box.appendChild(c); c.style.transform = 'scale(' + (box.clientWidth / 1600) + ')'; }
        else box.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#8a847c;font:500 14px JetBrains Mono,monospace">end of deck</div>';
      });
      nt.innerHTML = '<div class="lbl">Notes · ' + titleOf(cur) + '</div>' + notesHTML(cur);
      document.getElementById('c').textContent = (cur + 1) + ' / ' + N;
    }
    function goP(i) { show(i); send({ type: 'go', i: cur }); }
    document.getElementById('pp').onclick = function () { goP(cur - 1); };
    document.getElementById('pnx').onclick = function () { goP(cur + 1); };
    var t0 = Date.now();
    document.getElementById('rs').onclick = function () { t0 = Date.now(); };
    setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); document.getElementById('tm').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 500);
    addEventListener('keydown', function (e) {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) >= 0) { e.preventDefault(); goP(cur + 1); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(e.key) >= 0) { e.preventDefault(); goP(cur - 1); }
    });
    addEventListener('resize', function () { show(cur); });
    onMsg(function (m) { if (m.type === 'go' && m.i !== cur) show(m.i); });
    show(cur); send({ type: 'hello' });
  }
})();
