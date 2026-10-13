(function () {
  var D = window.PORTFOLIO;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover)').matches;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ext = ' target="_blank" rel="noopener"';
  var STATUS = { completed: 'Completed', ongoing: 'In progress', planned: 'Planned' };

  function status(p) {
    return '<span class="status ' + p.status + '"><i></i>' + STATUS[p.status] + (p.statusNote ? ' · ' + esc(p.statusNote) : '') + '</span>';
  }
  function chips(list) { return '<div class="chips">' + list.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>'; }
  function metrics(m) {
    if (!m) return '';
    return '<div class="metrics">' + m.map(function (x) { return '<div><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div>';
  }
  function links(p) {
    return '<div class="row-links">' +
      (p.caseStudy ? '<a class="tlink" href="' + p.caseStudy + '">Case study' + (p.media && p.media.type === 'video' ? ' &amp; video' : '') + ' →</a>' : '') +
      (p.repo ? '<a class="tlink dim" href="' + p.repo + '"' + ext + '>GitHub ↗<span class="sr-only"> (opens in new tab)</span></a>' : '') +
      '</div>';
  }
  function media(p, featured) {
    var m = p.media, pos = m.position ? ' style="object-position:' + m.position + '"' : '';
    if (m.type === 'video') {
      if (featured) return '<div class="media"><video src="' + m.src + '" poster="' + m.poster + '" muted loop playsinline preload="metadata" aria-label="' + esc(m.alt) + '"></video><span class="badge">● demo video</span></div>';
      return '<div class="media"><img src="' + (m.thumb || m.poster) + '" alt="' + esc(m.alt) + '" loading="lazy"' + pos + '>' +
        '<video data-src="' + m.src + '" muted loop playsinline preload="none" aria-hidden="true"' + (m.videoPosition ? ' style="object-position:' + m.videoPosition + '"' : '') + '></video>' +
        '<span class="play-hint">' + (canHover ? '▶ hover to play' : '▶ video in case study') + '</span></div>';
    }
    return '<div class="media' + (m.light ? ' light' : '') + '"><img src="' + m.src + '" alt="' + esc(m.alt) + '" loading="lazy"' + pos + '></div>';
  }

  /* ---------- projects ---------- */
  var feat = D.projects.filter(function (p) { return p.featured; })[0];
  if (feat) $('featured').innerHTML =
    '<article class="feat rv" aria-labelledby="p-' + feat.slug + '">' + media(feat, true) +
      '<div class="body"><div class="kind">' + esc(feat.kind) + ' · featured</div>' +
      '<h3 id="p-' + feat.slug + '">' + esc(feat.title) + '</h3>' + status(feat) +
      '<p class="sum">' + esc(feat.summary) + '</p>' + metrics(feat.metrics) +
      '<p class="contrib"><b>My role:</b> ' + esc(feat.contribution) + '</p>' + chips(feat.stack) + links(feat) + '</div></article>';

  $('projects').innerHTML = D.projects.filter(function (p) { return !p.featured; }).map(function (p) {
    return '<article class="pcard rv" aria-labelledby="p-' + p.slug + '">' + media(p, false) +
      '<div class="body"><div class="top"><span class="kind">' + esc(p.kind) + '</span>' + status(p) + '</div>' +
      '<h3 id="p-' + p.slug + '"><a href="' + p.caseStudy + '">' + esc(p.title) + '</a></h3>' +
      '<p class="sum">' + esc(p.summary) + '</p>' + metrics(p.metrics) +
      '<p class="contrib"><b>My role:</b> ' + esc(p.contribution) + '</p>' +
      '<div class="foot">' + chips(p.stack) + links(p) + '</div></div></article>';
  }).join('');

  if (D.otherWork && D.otherWork.length) $('other').innerHTML = '<h3>Other work</h3>' + D.otherWork.map(function (o) {
    return '<div class="orow"><div><h4>' + esc(o.title) + '</h4><span class="kind">' + esc(o.kind) + '</span></div>' +
      '<p>' + esc(o.summary) + '</p>' +
      '<div class="r">' + (o.repo ? '<a class="tlink dim" href="' + o.repo + '"' + ext + '>GitHub ↗<span class="sr-only"> (opens in new tab)</span></a>' : '<span class="kind">' + esc(o.note || '') + '</span>') + '</div></div>';
  }).join('');

  /* ---------- skills / experience / interests / contact ---------- */
  $('skillList').innerHTML = D.skills.map(function (g) {
    return '<div class="col"><h3>' + esc(g.group) + '</h3><ul>' + g.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
  }).join('');

  $('xpList').innerHTML = D.experience.map(function (x) {
    return '<div class="xrow"><div class="when">' + esc(x.when) + '<span class="type">' + esc(x.type) + '</span></div>' +
      '<div><h3>' + esc(x.title) + '</h3><div class="org">' + esc(x.org) + '</div></div><p class="det">' + esc(x.detail || '') + '</p></div>';
  }).join('');

  function nn(title, cls, list) {
    return '<div class="nn rv"><div class="h"><h3>' + title + '</h3><span class="status ' + cls + '"><i></i>' + STATUS[cls] + '</span></div><ul>' +
      list.map(function (i) { return '<li><h4>' + esc(i.title) + '</h4><p>' + esc(i.detail) + '</p></li>'; }).join('') + '</ul></div>';
  }
  $('nowNext').innerHTML = nn('Now', 'ongoing', D.interests.now) + nn('Next', 'planned', D.interests.next);

  var L = D.links, c = '';
  c += '<a class="btn pri" href="' + L.linkedin + '"' + ext + '>Connect on LinkedIn ↗</a>';
  c += '<a class="btn" href="' + L.github + '"' + ext + '>GitHub ↗</a>';
  if (L.email) c += '<a class="btn" href="mailto:' + esc(L.email) + '">Email</a>';
  if (L.cv) c += '<a class="btn" href="' + esc(L.cv) + '" download>Download CV</a>';
  $('contactLinks').innerHTML = c;
  $('yr').textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  var nav = $('nav');
  function onScroll() { nav.classList.toggle('solid', scrollY > 8); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var mb = $('menuBtn'), nl = $('navList');
  mb.addEventListener('click', function () {
    var open = nl.classList.toggle('open'); mb.setAttribute('aria-expanded', open); mb.textContent = open ? 'close' : 'menu';
  });
  nl.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nl.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.textContent = 'menu'; } });
  var navLinks = nl.querySelectorAll('a[href^="#"]');
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) { a.classList.toggle('cur', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'about', 'skills', 'experience', 'contact'].forEach(function (id) { spy.observe($(id)); });

  /* ---------- reveal ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .08 });
  document.querySelectorAll('.rv').forEach(function (n) { io.observe(n); });

  /* ---------- videos ---------- */
  var fv = document.querySelector('.feat video');
  if (fv && !reduce) new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) { var p = fv.play(); if (p && p.catch) p.catch(function () {}); } else fv.pause();
  }, { threshold: .3 }).observe(fv);
  if (fv && reduce) fv.setAttribute('controls', '');

  if (canHover && !reduce) document.querySelectorAll('.pcard').forEach(function (card) {
    var v = card.querySelector('video[data-src]');
    if (!v) return;
    card.addEventListener('pointerenter', function () {
      if (!v.src) v.src = v.dataset.src;
      var p = v.play(); if (p && p.then) p.then(function () { card.classList.add('playing'); }).catch(function () {});
    });
    card.addEventListener('pointerleave', function () { v.pause(); card.classList.remove('playing'); });
  });

  /* ================================================================
     Hero visual: line-art 3R arm, analytic IK, follows the pointer
     ================================================================ */
  (function () {
    var cv = $('arm'), ctx = cv.getContext('2d'), fig = $('viz');
    var annJ = $('annJ'), annE = $('annE');
    var W, H, base, L, j = [{}, {}, {}, {}], target = { x: 0, y: 0 }, goal = { x: 0, y: 0 }, phi = -1.2, side = 1, mouse = null, t0 = performance.now(), running = false;
    var C = { line: '#2a323b', grid: '#161b20', faint: '#5f6873', muted: '#9aa3ad', text: '#e8ecf0', acc: '#4fd1c5', accDim: 'rgba(79,209,197,.12)' };

    function size() {
      var dpr = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var s = Math.min(W, H);
      base = { x: W * .42, y: H * .8 }; L = [s * .3, s * .26, s * .1];
      if (!target.x) { target.x = goal.x = base.x + s * .2; target.y = goal.y = base.y - s * .4; }
    }
    function solve() {
      var wx = target.x - Math.cos(phi) * L[2], wy = target.y - Math.sin(phi) * L[2];
      var dx = wx - base.x, dy = wy - base.y, d = Math.hypot(dx, dy) || 1e-6, dmax = (L[0] + L[1]) * .995, dmin = Math.abs(L[0] - L[1]) + 2;
      if (d > dmax || d < dmin) { var k = (d > dmax ? dmax : dmin) / d; dx *= k; dy *= k; d = Math.hypot(dx, dy); wx = base.x + dx; wy = base.y + dy; }
      var al = Math.atan2(dy, dx), be = Math.acos(Math.max(-1, Math.min(1, (L[0] * L[0] + d * d - L[1] * L[1]) / (2 * L[0] * d))));
      function elbow(sd) { return { x: base.x + Math.cos(al + sd * be) * L[0], y: base.y + Math.sin(al + sd * be) * L[0] }; }
      var e = elbow(side);
      if (e.y > base.y - 12) { var e2 = elbow(-side); if (e2.y < e.y) { side = -side; e = e2; } }
      j[0] = { x: base.x, y: base.y }; j[1] = e; j[2] = { x: wx, y: wy };
      j[3] = { x: wx + Math.cos(phi) * L[2], y: wy + Math.sin(phi) * L[2] };
    }
    function frameAxes(x, y, ang, len, label) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = C.acc; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
      ctx.strokeStyle = C.muted; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
      ctx.fillStyle = C.acc; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillText('x', len + 3, 3);
      ctx.fillStyle = C.muted; ctx.fillText('y', -3, -len - 4);
      ctx.restore();
      if (label) { ctx.fillStyle = C.faint; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillText(label, x + 10, y + 16); }
    }
    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (var gx = base.x % 28; gx < W; gx += 28) { ctx.beginPath(); ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, H); ctx.stroke(); }
      for (var gy = base.y % 28; gy < H; gy += 28) { ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(W, gy + .5); ctx.stroke(); }
      // workspace envelope + floor
      var reach = L[0] + L[1] + L[2];
      ctx.setLineDash([2, 5]); ctx.strokeStyle = C.line;
      ctx.beginPath(); ctx.arc(base.x, base.y, reach, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(base.x, base.y, Math.abs(L[0] - L[1]) + L[2], Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(W * .06, base.y + 12); ctx.lineTo(W * .94, base.y + 12); ctx.stroke();
      ctx.fillStyle = C.faint; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillText('r = ' + (reach / Math.min(W, H)).toFixed(2), base.x + reach * .7 + 6, base.y - reach * .7);
      // dimension line for link 1
      // target
      ctx.strokeStyle = C.acc; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(goal.x, goal.y, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(goal.x - 14, goal.y); ctx.lineTo(goal.x - 9, goal.y); ctx.moveTo(goal.x + 9, goal.y); ctx.lineTo(goal.x + 14, goal.y);
      ctx.moveTo(goal.x, goal.y - 14); ctx.lineTo(goal.x, goal.y - 9); ctx.moveTo(goal.x, goal.y + 9); ctx.lineTo(goal.x, goal.y + 14); ctx.stroke();
      // base
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.4; ctx.fillStyle = '#0e1114';
      ctx.beginPath(); ctx.moveTo(base.x - 30, base.y + 12); ctx.lineTo(base.x - 18, base.y - 4); ctx.lineTo(base.x + 18, base.y - 4); ctx.lineTo(base.x + 30, base.y + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      // links as outlined bars
      var wds = [11, 9, 7];
      for (var i = 0; i < 3; i++) {
        var a = j[i], b = j[i + 1], ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.hypot(b.x - a.x, b.y - a.y), w = wds[i];
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
        ctx.fillStyle = '#0e1114'; ctx.strokeStyle = C.muted; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(len, -w * .8); ctx.arc(len, 0, w * .8, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, w); ctx.arc(0, 0, w, Math.PI / 2, -Math.PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = C.line; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      }
      for (i = 0; i < 3; i++) {
        ctx.strokeStyle = C.acc; ctx.lineWidth = 1.4; ctx.fillStyle = '#0e1114';
        ctx.beginPath(); ctx.arc(j[i].x, j[i].y, i ? 5 : 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      // gripper
      var e = j[3];
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(phi);
      ctx.strokeStyle = C.text; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.moveTo(0, -8); ctx.lineTo(12, -6); ctx.moveTo(0, 8); ctx.lineTo(12, 6); ctx.stroke();
      ctx.restore();
      // frames
      frameAxes(base.x, base.y, 0, 26, '');
      frameAxes(e.x, e.y, phi, 20, '');
    }
    function deg(r) { return (r * 180 / Math.PI).toFixed(1); }
    function norm(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
    function hud() {
      var a0 = Math.atan2(-(j[1].y - j[0].y), j[1].x - j[0].x), a1 = Math.atan2(-(j[2].y - j[1].y), j[2].x - j[1].x), a2 = Math.atan2(-(j[3].y - j[2].y), j[3].x - j[2].x);
      annJ.innerHTML = 'θ1 <b>' + deg(a0) + '°</b><br>θ2 <b>' + deg(norm(a1 - a0)) + '°</b><br>θ3 <b>' + deg(norm(a2 - a1)) + '°</b>';
      var s = Math.min(W, H);
      annE.innerHTML = 'tool0 (<b>' + ((j[3].x - base.x) / s).toFixed(2) + '</b>, <b>' + ((base.y - j[3].y) / s).toFixed(2) + '</b>)';
    }
    function step(now) {
      var s = Math.min(W, H);
      if (mouse) { goal.x = mouse.x; goal.y = Math.min(mouse.y, base.y - 20); }
      else { var t = (now - t0) / 1000; goal.x = base.x + Math.sin(t * .45) * s * .3; goal.y = base.y - s * .42 + Math.sin(t * .9) * s * .12; }
      var dx = goal.x - target.x, dy = goal.y - target.y, d = Math.hypot(dx, dy), sp = Math.min(d * .08, 6);
      if (d > .01) { target.x += dx / d * sp; target.y += dy / d * sp; }
      var want = Math.atan2(target.y - base.y, target.x - base.x);
      phi = norm(phi + norm(want - phi) * .06);
      solve(); draw(now); hud();
    }
    function loop(now) { step(now); if (running) requestAnimationFrame(loop); }
    fig.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    fig.addEventListener('pointerleave', function () { mouse = null; });
    size();
    addEventListener('resize', function () { size(); solve(); draw(0); hud(); });
    if (reduce) { solve(); draw(0); hud(); return; }
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!running) { running = true; requestAnimationFrame(loop); } } else running = false;
    }).observe(fig);
  })();
})();
