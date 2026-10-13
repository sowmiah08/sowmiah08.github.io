/*
 * Interactive project demos.
 *   <div class="demo-mount" data-demo="pose|cubes|hand|apples|rrr"></div>
 * Each demo is a simplified, simulated illustration of the real project's
 * algorithm — the numbers on the project pages come from the real systems.
 */
(function () {
  // colours follow the page theme (<html data-theme="light|dark">); demos redraw every frame, so swapping C is enough
  var DARK = { acc: '#ff8a2b', blue: '#4cc6ff', green: '#3ddc84', red: '#ff5f5f', yel: '#ffc23d', violet: '#b48cff',
    text: '#fbfaf8', muted: '#c3beb7', faint: '#827c74', line: '#3a3c43', grid: 'rgba(255,170,100,.06)', bg: '#16171b', panel: '#1d1f24',
    link: '#2c2f36', table: '#5a554f', grey: '#8d8a86', redHi: '#ff8b8b', camA: '#2b2a28', camB: '#1f1e1c', scan: 'rgba(255,255,255,.03)',
    skyA: '#2a3a2a', skyB: '#1b261b', leafA: '#2f5a2c', leafB: '#3f7436', leafOcc: '#356630', inset: 'rgba(16,17,20,.88)', plot: '#121316',
    safe: 'rgba(61,220,132,.5)', obsF: 'rgba(255,95,95,.18)', obsS: 'rgba(255,95,95,.6)' };
  var LIGHT = { acc: '#e8650a', blue: '#0b8fd1', green: '#16a34a', red: '#e03e3e', yel: '#c98a00', violet: '#7c4ddb',
    text: '#1d1b18', muted: '#57524b', faint: '#8a847c', line: '#d9d3cb', grid: 'rgba(200,110,40,.09)', bg: '#fbf9f6', panel: '#f1ede7',
    link: '#d6cfc5', table: '#b9b1a6', grey: '#9c968f', redHi: '#e85d5d', camA: '#ece7df', camB: '#dcd5ca', scan: 'rgba(0,0,0,.035)',
    skyA: '#d7e8cc', skyB: '#bcd8ad', leafA: '#86b875', leafB: '#9cc986', leafOcc: '#74a964', inset: 'rgba(255,255,255,.92)', plot: '#f4f0ea',
    safe: 'rgba(22,163,74,.55)', obsF: 'rgba(224,62,62,.12)', obsS: 'rgba(224,62,62,.6)' };
  var C = {};
  function applyTheme() { var k; var P = document.documentElement.getAttribute('data-theme') === 'dark' ? DARK : LIGHT; for (k in P) C[k] = P[k]; }
  applyTheme();
  try { new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) {}
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mono = '"JetBrains Mono", ui-monospace, monospace';

  /* ---------------- helpers ---------------- */
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000000) / 1000000; }; }
  function gauss(r) { var u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function f2(x, n) { return (x >= 0 ? ' ' : '') + x.toFixed(n == null ? 3 : n); }
  function font(ctx, px, w) { ctx.font = (w || 500) + ' ' + px + 'px ' + mono; }

  function shell(root, title, sub) {
    root.innerHTML = '';
    var dm = el('div', 'dm'), stage = el('div', 'dm-stage'), cv = el('canvas');
    stage.appendChild(cv);
    var tl = el('div', 'dm-hud tl'), tr = el('div', 'dm-hud tr'), bl = el('div', 'dm-hud bl');
    stage.appendChild(tl); stage.appendChild(tr); stage.appendChild(bl);
    var side = el('div', 'dm-side');
    side.appendChild(el('div', 'dm-title', title));
    if (sub) side.appendChild(el('p', 'dm-sub', sub));
    dm.appendChild(stage); dm.appendChild(side); root.appendChild(dm);
    var S = { root: root, stage: stage, cv: cv, ctx: cv.getContext('2d'), side: side, tl: tl, tr: tr, bl: bl, W: 0, H: 0 };
    S.fit = function () {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h || (w === S.W && h === S.H)) return false;
      var dpr = Math.min(devicePixelRatio || 1, 2);
      S.W = w; S.H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); S.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };
    S.local = function (e) { var r = cv.getBoundingClientRect(), k = cv.clientWidth / (r.width || 1); return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; };
    return S;
  }
  function slider(S, label, min, max, step, val, fmt, cb) {
    var w = el('label', 'dm-ctl'), top = el('span', 'dm-ctl-top'), v = el('b'), inp = el('input');
    top.appendChild(el('span', null, label)); top.appendChild(v);
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
    function u() { var x = parseFloat(inp.value); v.textContent = fmt ? fmt(x) : x; cb(x); }
    inp.addEventListener('input', u); w.appendChild(top); w.appendChild(inp); S.side.appendChild(w); u();
    return inp;
  }
  function toggle(S, label, on, cb) {
    var w = el('label', 'dm-tog'), i = el('input'); i.type = 'checkbox'; i.checked = on;
    w.appendChild(i); w.appendChild(el('span', null, label)); i.addEventListener('change', function () { cb(i.checked); });
    S.side.appendChild(w); cb(on); return i;
  }
  function seg(S, label, opts, val, cb) {
    var w = el('div', 'dm-seg'), g = el('div', 'dm-seg-g');
    w.appendChild(el('span', 'dm-seg-l', label));
    opts.forEach(function (o) {
      var b = el('button', o[0] === val ? 'on' : '', o[1]); b.type = 'button';
      b.onclick = function () { [].forEach.call(g.children, function (x) { x.className = ''; }); b.className = 'on'; cb(o[0]); };
      g.appendChild(b);
    });
    w.appendChild(g); S.side.appendChild(w); cb(val);
  }
  function button(S, label, cb, pri) { var b = el('button', 'dm-btn' + (pri ? ' pri' : ''), label); b.type = 'button'; b.onclick = cb; S.side.appendChild(b); return b; }
  function steps(S, list) {
    var u = el('ol', 'dm-steps');
    list.forEach(function (t, i) { u.appendChild(el('li', null, '<i>' + (i + 1) + '</i>' + t)); });
    S.side.appendChild(u);
    var last = -2;
    return function (k) { if (k === last) return; last = k; [].forEach.call(u.children, function (li, i) { li.className = i < k ? 'done' : i === k ? 'on' : ''; }); };
  }
  function readout(S) { var d = el('div', 'dm-read'); S.side.appendChild(d); return d; }
  function note(S, t) { S.side.appendChild(el('p', 'dm-note', t)); }
  function grid(ctx, W, H, step) {
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (var x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (var y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
  }
  function cross(ctx, x, y, r, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 1.8, y); ctx.lineTo(x - r * .6, y); ctx.moveTo(x + r * .6, y); ctx.lineTo(x + r * 1.8, y);
    ctx.moveTo(x, y - r * 1.8); ctx.lineTo(x, y - r * .6); ctx.moveTo(x, y + r * .6); ctx.lineTo(x, y + r * 1.8); ctx.stroke();
  }
  function ik2(bx, by, tx, ty, L1, L2, side) {
    var dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy) || 1e-6, dmax = (L1 + L2) * .995, dmin = Math.abs(L1 - L2) + 1e-3;
    if (d > dmax || d < dmin) { var k = (d > dmax ? dmax : dmin) / d; dx *= k; dy *= k; d = Math.hypot(dx, dy); }
    var a = Math.atan2(dy, dx), b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    var t1 = a + side * b, ex = bx + Math.cos(t1) * L1, ey = by + Math.sin(t1) * L1;
    return { ex: ex, ey: ey, wx: bx + dx, wy: by + dy, t1: t1, t2: Math.atan2(by + dy - ey, bx + dx - ex) - t1 };
  }
  function drawArm2(ctx, pts, w, gripAng, grip) {
    ctx.lineCap = 'round';
    for (var i = 0; i < pts.length - 1; i++) {
      ctx.strokeStyle = C.muted; ctx.lineWidth = w + 4 - i * 2; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
      ctx.strokeStyle = C.link; ctx.lineWidth = w - i * 2; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
      ctx.strokeStyle = C.acc; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
    }
    pts.forEach(function (p, i) {
      if (i === pts.length - 1) return;
      ctx.fillStyle = C.panel; ctx.strokeStyle = C.acc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p[0], p[1], i ? 6 : 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    if (gripAng != null) {
      var e = pts[pts.length - 1], g = 5 + (grip == null ? 1 : grip) * 5;
      ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(gripAng); ctx.strokeStyle = C.text; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -g); ctx.lineTo(0, g); ctx.moveTo(0, -g); ctx.lineTo(11, -g); ctx.moveTo(0, g); ctx.lineTo(11, g); ctx.stroke(); ctx.restore();
    }
  }

  /* ---------------- registry + render loop ---------------- */
  var mounted = [];
  function register(S, tick) {
    S.tick = tick; mounted.push(S);
    new IntersectionObserver(function (es) { S.inView = es[0].isIntersecting; }, { threshold: .05 }).observe(S.stage);
    if (window.ResizeObserver) new ResizeObserver(function () { if (S.fit() && S.onResize) S.onResize(); }).observe(S.stage);
    if (S.fit() && S.onResize) S.onResize();
  }
  function shown(S) {
    if (!S.inView || !S.stage.clientWidth) return false;
    var sl = S.root.closest('.slide');
    if (sl && !sl.classList.contains('active') && !document.body.classList.contains('read-mode')) return false;
    return true;
  }
  var lastSlow = 0;
  function loop(now) {
    var slow = reduce && now - lastSlow < 400;
    if (!slow) { lastSlow = now; mounted.forEach(function (S) { if (shown(S)) { if (!S.W && S.fit() && S.onResize) S.onResize(); if (S.W) S.tick(now); } }); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  var DEMOS = {};

  /* =====================================================================
     1. visionNassembly — depth scan → SAM 2 masks → ICP fit → 6-DoF pose
     ===================================================================== */
  DEMOS.pose = function (root) {
    var S = shell(root, 'Perception: scan → segment → fit → pose', 'A simplified version of the visionNassembly pipeline. Every scan randomises part positions, rotations and sensor noise.');
    var KINDS = [
      { name: 'plug', w: 86, h: 56, ht: .9, holes: [], col: C.acc },
      { name: 'socket', w: 104, h: 104, ht: .6, holes: [[-26, -26, 9], [26, -26, 9], [-26, 26, 9], [26, 26, 9]], col: C.blue },
      { name: 'plate', w: 150, h: 84, ht: .35, holes: [[30, 0, 18]], col: C.yel },
      { name: 'peg', r: 22, ht: 1, holes: [], col: C.green }
    ];
    var objs = [], pts = [], t0 = 0, k = 1, shownPoses = false, auto = true;
    var setStep = steps(S, ['Depth scan (RGB-D)', 'SAM 2 segmentation', 'Model fitting · ICP', '6-DoF pose out']);
    var poses = readout(S);
    button(S, '↻ Rescan new scene', function () { scene(); }, true);
    toggle(S, 'auto-rescan', true, function (v) { auto = v; });
    note(S, 'Illustration. Real system: ≈1 mm pose error, 11/12 assemblies.');
    S.tl.innerHTML = '/camera/depth/points<br>OVERHEAD · <b>30 Hz</b>';

    function inside(o, x, y) {
      var dx = x - o.x, dy = y - o.y, c = Math.cos(-o.th), s = Math.sin(-o.th), lx = (dx * c - dy * s) / k, ly = (dx * s + dy * c) / k;
      if (o.r) { if (Math.hypot(lx, ly) > o.r) return false; } else if (Math.abs(lx) > o.w / 2 || Math.abs(ly) > o.h / 2) return false;
      for (var i = 0; i < o.holes.length; i++) if (Math.hypot(lx - o.holes[i][0], ly - o.holes[i][1]) < o.holes[i][2]) return false;
      return true;
    }
    function scene() {
      var W = S.W, H = S.H; k = W / 760; objs = [];
      KINDS.forEach(function (K) {
        for (var t = 0; t < 300; t++) {
          var rad = (K.r || Math.hypot(K.w, K.h) / 2) * k;
          var o = Object.assign({}, K, { x: rad + 16 + Math.random() * (W - 2 * rad - 32), y: rad + 34 + Math.random() * (H - 2 * rad - 64), th: Math.random() * Math.PI * 2, rad: rad,
            off: { x: (Math.random() - .5) * 60 * k, y: (Math.random() - .5) * 60 * k, th: (Math.random() - .5) * 1.2 }, err: .6 + Math.random() * .8 });
          if (objs.every(function (p) { return Math.hypot(p.x - o.x, p.y - o.y) > p.rad + o.rad + 30 * k; })) { objs.push(o); break; }
        }
      });
      pts = []; var st = 7 * k;
      for (var y = st / 2; y < H; y += st) for (var x = st / 2; x < W; x += st) {
        var jx = x + (Math.random() - .5) * st * .5, jy = y + (Math.random() - .5) * st * .5, hit = -1;
        for (var i = 0; i < objs.length; i++) if (inside(objs[i], jx, jy)) { hit = i; break; }
        if (hit < 0 && Math.random() < .5) continue;
        pts.push({ x: jx, y: jy, o: hit, n: Math.random() });
      }
      t0 = performance.now(); shownPoses = false; poses.innerHTML = '<span style="color:' + C.faint + '">// waiting for fit…</span>';
    }
    function outline(ctx, o, ox, oy, oth, fill) {
      ctx.save(); ctx.translate(o.x + ox, o.y + oy); ctx.rotate(o.th + oth); ctx.scale(k, k); ctx.beginPath();
      if (o.r) ctx.arc(0, 0, o.r, 0, Math.PI * 2); else ctx.rect(-o.w / 2, -o.h / 2, o.w, o.h);
      o.holes.forEach(function (h) { ctx.moveTo(h[0] + h[2], h[1]); ctx.arc(h[0], h[1], h[2], 0, Math.PI * 2, true); });
      if (fill) ctx.fill('evenodd'); ctx.lineWidth = 1.6 / k; ctx.stroke(); ctx.restore();
    }
    function ease(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
    S.onResize = scene;
    var TS = 1700, TG = 900, TF = 1300;
    register(S, function (now) {
      var ctx = S.ctx, W = S.W, H = S.H, t = now - t0;
      if (auto && t > TS + TG + TF + 5500) { scene(); t = 0; }
      ctx.clearRect(0, 0, W, H);
      var sp = Math.min(1, t / TS), gp = ease((t - TS) / TG), fp = ease((t - TS - TG) / TF), pp = ease((t - TS - TG - TF) / 500), sy = sp * H;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; if (p.y > sy) continue;
        if (p.o < 0) { ctx.fillStyle = C.faint; ctx.globalAlpha = .4; ctx.fillRect(p.x - 1, p.y - 1, 2, 2); continue; }
        var o = objs[p.o]; ctx.globalAlpha = .55 + o.ht * .45 - p.n * .15; ctx.fillStyle = gp > 0 ? o.col : C.acc;
        var z = 2 + o.ht * 1.4; ctx.fillRect(p.x - z / 2, p.y - z / 2, z, z);
      }
      ctx.globalAlpha = 1;
      if (sp < 1) {
        var g = ctx.createLinearGradient(0, sy - 40, 0, sy); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, C.acc);
        ctx.globalAlpha = .22; ctx.fillStyle = g; ctx.fillRect(0, sy - 40, W, 40); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
      }
      if (gp > 0) objs.forEach(function (o) {
        ctx.globalAlpha = gp * .22; ctx.fillStyle = o.col; ctx.strokeStyle = o.col; outline(ctx, o, 0, 0, 0, true);
        ctx.globalAlpha = gp; font(ctx, Math.max(10, 11 * k)); ctx.fillStyle = o.col;
        ctx.fillText('mask:' + o.name + ' ' + (.95 + o.err / 40).toFixed(2), o.x - o.rad * .8, o.y - o.rad - 6); ctx.globalAlpha = 1;
      });
      if (fp > 0) objs.forEach(function (o) {
        var r = 1 - fp; ctx.setLineDash([5, 4]); ctx.strokeStyle = C.text; ctx.globalAlpha = .9;
        outline(ctx, o, o.off.x * r, o.off.y * r, o.off.th * r, false); ctx.setLineDash([]); ctx.globalAlpha = 1;
      });
      if (pp > 0) objs.forEach(function (o) {
        var len = (o.r ? 34 : 44) * k * pp;
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.th); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.strokeStyle = '#22c55e'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
        ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      var st = t < TS ? 0 : t < TS + TG ? 1 : t < TS + TG + TF ? 2 : 3;
      setStep(t > TS + TG + TF + 500 ? 4 : st);
      S.bl.innerHTML = ['scanning… <b>' + Math.round(sp * 100) + '%</b>', 'segmenting <b>' + objs.length + '</b> objects', 'fitting · ICP iter <b>' + Math.round(fp * 30) + '</b>', 'poses published · <b>/object_poses</b>'][st];
      if (st === 3 && !shownPoses) {
        shownPoses = true; var tw = .6, th = tw * H / W;
        poses.innerHTML = '<table><tr><th>obj</th><th>x (m)</th><th>y (m)</th><th>θ</th><th>err</th></tr>' + objs.map(function (o) {
          return '<tr><td><span style="color:' + o.col + '">■</span> <b>' + o.name + '</b></td><td>' + f2((o.x / W - .5) * tw) + '</td><td>' + f2((.5 - o.y / H) * th) + '</td><td>' + Math.round(((o.th * 180 / Math.PI) % 360 + 360) % 360) + '°</td><td class="a">' + o.err.toFixed(1) + 'mm</td></tr>';
        }).join('') + '</table>';
      }
    });
  };

  /* =====================================================================
     2. Pick & place — point cloud → HSV → DBSCAN → cube filter → buffer → pick
     ===================================================================== */
  DEMOS.cubes = function (root) {
    var S = shell(root, 'Cube picking: point cloud → DBSCAN → pick', 'Live point cloud with real DBSCAN clustering. Change the noise and eps to see clusters split, merge or get rejected.');
    var noise = 3, eps = 14, showRej = true;
    var objs = [], cloud = [], clusters = [], buf = [], locked = null, target = null, arm = null, lastPerc = 0, sceneT = 0, picked = 0;
    var M = 0.6; // metres across the canvas width
    var setStep = steps(S, ['Point cloud', 'HSV colour mask', 'DBSCAN clustering', 'Cube-shape filter', 'Stable buffer (10)', 'MoveIt pick']);
    slider(S, 'depth noise', 0, 10, .5, noise, function (v) { return v.toFixed(1) + ' mm'; }, function (v) { noise = v; });
    slider(S, 'DBSCAN eps', 4, 40, 1, eps, function (v) { return v + ' mm'; }, function (v) { eps = v; });
    toggle(S, 'show rejected clusters & noise', true, function (v) { showRej = v; });
    var ro = readout(S);
    button(S, '↻ New scene', function () { newScene(); }, true);
    S.tl.innerHTML = '/camera/camera/depth/color/points<br>top-down · <b>RealSense</b>';

    function mm(px) { return px / S.W * M * 1000; }
    function px(mmv) { return mmv / 1000 / M * S.W; }
    function newScene() {
      var W = S.W, H = S.H, s = px(40); objs = []; picked = 0;
      var defs = [['cube', 'red'], ['cube', 'blue'], ['cube', 'red'], ['cube', 'blue'], ['bar', 'red'], ['cyl', 'grey'], ['box', 'green']];
      defs.forEach(function (d) {
        for (var t = 0; t < 200; t++) {
          var o = { kind: d[0], color: d[1], x: W * (.12 + Math.random() * .76), y: H * (.12 + Math.random() * .52), rot: Math.random() * Math.PI,
            w: d[0] === 'bar' ? px(100) : d[0] === 'box' ? px(70) : s, h: d[0] === 'box' ? px(50) : s, r: px(26) };
          var rad = Math.max(o.w, o.h) * .75;
          if (objs.every(function (p) { return Math.hypot(p.x - o.x, p.y - o.y) > rad + Math.max(p.w, p.h) * .75 + px(12); })) { objs.push(o); break; }
        }
      });
      // sometimes place two cubes touching, to show DBSCAN merging with a large eps
      var c = objs.filter(function (o) { return o.kind === 'cube' && o.color === 'blue'; });
      if (c.length === 2 && Math.random() < .6) { c[1].x = c[0].x + s + px(6); c[1].y = c[0].y; c[1].rot = c[0].rot = 0; }
      buf = []; locked = null; target = null; arm = null; sceneT = performance.now();
    }
    function inObj(o, x, y) {
      var dx = x - o.x, dy = y - o.y;
      if (o.kind === 'cyl') return Math.hypot(dx, dy) < o.r;
      var c = Math.cos(-o.rot), s = Math.sin(-o.rot), lx = dx * c - dy * s, ly = dx * s + dy * c;
      return Math.abs(lx) < o.w / 2 && Math.abs(ly) < o.h / 2;
    }
    function perceive() {
      var W = S.W, H = S.H, st = W / 95, n = px(noise); cloud = [];
      for (var y = st / 2; y < H; y += st) for (var x = st / 2; x < W; x += st) {
        var jx = x + (Math.random() - .5) * st * .6 + gauss(Math.random) * n * .5, jy = y + (Math.random() - .5) * st * .6 + gauss(Math.random) * n * .5, col = 'table';
        for (var i = 0; i < objs.length; i++) if (!objs[i].gone && inObj(objs[i], x, y)) { col = objs[i].color; break; }
        if (col === 'table' && Math.random() < .55) continue;
        cloud.push({ x: jx, y: jy, c: col });
      }
      var spk = Math.round(noise * 4);
      for (var k = 0; k < spk; k++) cloud.push({ x: Math.random() * W, y: Math.random() * H, c: Math.random() < .5 ? 'red' : 'blue', spk: true });
      clusters = [];
      ['red', 'blue'].forEach(function (col) {
        var P = cloud.filter(function (p) { return p.c === col; }), e = px(eps), lab = new Array(P.length).fill(-2), cid = 0;
        function nb(i) { var r = []; for (var j = 0; j < P.length; j++) if (Math.abs(P[i].x - P[j].x) < e && Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) < e) r.push(j); return r; }
        for (var i = 0; i < P.length; i++) {
          if (lab[i] !== -2) continue;
          var N = nb(i); if (N.length < 5) { lab[i] = -1; continue; }
          lab[i] = cid; var q = N.slice();
          while (q.length) { var j = q.pop(); if (lab[j] === -1) lab[j] = cid; if (lab[j] !== -2) continue; lab[j] = cid; var N2 = nb(j); if (N2.length >= 5) q = q.concat(N2); }
          cid++;
        }
        for (var c = 0; c < cid; c++) {
          var m = P.filter(function (p, i) { return lab[i] === c; }), mx = 0, my = 0;
          m.forEach(function (p) { mx += p.x; my += p.y; }); mx /= m.length; my /= m.length;
          var sxx = 0, syy = 0, sxy = 0; m.forEach(function (p) { var dx = p.x - mx, dy = p.y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
          sxx /= m.length; syy /= m.length; sxy /= m.length;
          var tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
          var ang = .5 * Math.atan2(2 * sxy, sxx - syy), a = mm(Math.sqrt(12 * l1)), b = mm(Math.sqrt(12 * Math.max(l2, 0)));
          var ok = a > 26 && a < 56 && b > 26 && b < 56 && m.length >= 12, why = ok ? '' : (m.length < 12 ? 'too few points' : Math.round(a) + '×' + Math.round(b) + ' mm');
          clusters.push({ col: col, x: mx, y: my, a: a, b: b, ang: ang, n: m.length, ok: ok, why: why, pts: m });
        }
        P.forEach(function (p, i) { p.lab = lab[i]; });
      });
    }
    S.onResize = newScene;
    register(S, function (now) {
      var ctx = S.ctx, W = S.W, H = S.H;
      if (!objs.length) newScene();
      if (now - lastPerc > 120 && !(arm && arm.carry)) { perceive(); lastPerc = now; step(now); }
      if (arm) runArm(now);
      // draw
      ctx.clearRect(0, 0, W, H); grid(ctx, W, H, 32);
      var colMap = { red: C.red, blue: C.blue, green: C.green, grey: C.grey, table: C.table };
      cloud.forEach(function (p) {
        var isMask = p.c === 'red' || p.c === 'blue';
        if (!isMask) { ctx.globalAlpha = .35; ctx.fillStyle = colMap[p.c]; ctx.fillRect(p.x - 1, p.y - 1, 2, 2); return; }
        if (p.lab === -1 || p.spk) { if (!showRej) return; ctx.globalAlpha = .9; ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x - 2, p.y - 2); ctx.lineTo(p.x + 2, p.y + 2); ctx.moveTo(p.x + 2, p.y - 2); ctx.lineTo(p.x - 2, p.y + 2); ctx.stroke(); return; }
        ctx.globalAlpha = .95; ctx.fillStyle = colMap[p.c]; ctx.fillRect(p.x - 1.6, p.y - 1.6, 3.2, 3.2);
      });
      ctx.globalAlpha = 1; font(ctx, Math.max(10, W / 80));
      clusters.forEach(function (c) {
        if (!c.ok && !showRej) return;
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
        ctx.strokeStyle = c.ok ? C.text : C.faint; ctx.setLineDash(c.ok ? [] : [4, 4]); ctx.lineWidth = 1.4;
        var aw = px(c.a), bw = px(c.b); ctx.strokeRect(-aw / 2 - 4, -bw / 2 - 4, aw + 8, bw + 8); ctx.restore(); ctx.setLineDash([]);
        ctx.fillStyle = c.ok ? (c.col === 'red' ? C.redHi : C.blue) : C.faint;
        ctx.fillText(c.ok ? 'cube ✓' : '✗ ' + c.why, c.x - px(c.a) / 2, c.y - Math.max(px(c.a), px(c.b)) / 2 - 10);
      });
      if (target && !locked) {
        buf.forEach(function (b) { ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(b.x, b.y, 2.2, 0, Math.PI * 2); ctx.fill(); });
        cross(ctx, target.x, target.y, 9, C.yel);
      }
      if (locked) { cross(ctx, locked.x, locked.y, 11, C.acc); ctx.fillStyle = C.acc; ctx.fillText('goal locked', locked.x + 18, locked.y + 4); }
      // bin + arm
      var bx = W * .08, by = H * .86, bs = px(70);
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.strokeRect(bx - bs / 2, by - bs / 2, bs, bs); ctx.fillStyle = C.blue; ctx.fillText('drop · ' + picked, bx - bs / 2, by - bs / 2 - 8);
      var base = [W * .5, H * .97], L = H * .4, a = arm ? arm.p : { x: W * .5, y: H * .55 };
      var s = ik2(base[0], base[1], a.x, a.y, L, L * .95, -1);
      if (arm && arm.carry) { ctx.fillStyle = arm.carry.color === 'red' ? C.red : C.blue; var cs = px(40); ctx.fillRect(s.wx - cs / 2, s.wy - cs / 2, cs, cs); }
      drawArm2(ctx, [base, [s.ex, s.ey], [s.wx, s.wy]], 14, Math.atan2(s.wy - s.ey, s.wx - s.ex), arm ? arm.g : 1);
      ctx.fillStyle = C.panel; ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(base[0], base[1], 16, Math.PI, 0); ctx.fill(); ctx.stroke();
      // readout
      var ok = clusters.filter(function (c) { return c.ok; }).length, rej = clusters.length - ok;
      var spread = buf.length ? Math.max.apply(null, buf.map(function (b) { return mm(Math.hypot(b.x - avg(buf).x, b.y - avg(buf).y)); })) : 0;
      ro.innerHTML = '<table><tr><td>points</td><td><b>' + cloud.length + '</b></td></tr><tr><td>clusters</td><td><b>' + clusters.length + '</b> · <span class="g">' + ok + ' cube</span> · <span class="r">' + rej + ' rejected</span></td></tr>' +
        '<tr><td>buffer</td><td><b>' + (locked ? 10 : buf.length) + '/10</b> · spread <b>' + (locked ? '—' : spread.toFixed(1)) + '</b> mm</td></tr>' +
        '<tr><td>goal</td><td>' + (locked ? '<span class="a">x ' + (mm(locked.x - W / 2) / 1000).toFixed(3) + ' y ' + (mm(H * .97 - locked.y) / 1000).toFixed(3) + ' m</span>' : '<span style="color:' + C.faint + '">waiting for stable detections</span>') + '</td></tr></table>';
      setStep(arm ? 5 : locked ? 5 : target ? 4 : 3);
      S.bl.innerHTML = arm ? 'MoveIt · <b>' + arm.ph + '</b>' : locked ? 'goal locked' : target ? 'buffering detections…' : 'searching for a valid cube…';
    });
    function avg(b) { var x = 0, y = 0; b.forEach(function (p) { x += p.x; y += p.y; }); return { x: x / b.length, y: y / b.length }; }
    function step(now) {
      if (arm) return;
      var cand = clusters.filter(function (c) { return c.ok; });
      if (!cand.length) { if (objs.every(function (o) { return o.gone || o.kind !== 'cube'; }) && now - sceneT > 1500) newScene(); target = null; buf = []; return; }
      if (target) { var near = cand.filter(function (c) { return Math.hypot(c.x - target.x, c.y - target.y) < px(25); })[0]; if (!near) { target = null; buf = []; return; } target = near; }
      else { cand.sort(function (a, b) { return (a.col === 'red' ? 0 : 1) - (b.col === 'red' ? 0 : 1) || b.y - a.y; }); target = cand[0]; buf = []; }
      buf.push({ x: target.x, y: target.y }); if (buf.length > 10) buf.shift();
      if (buf.length === 10) {
        var m = avg(buf), sp = Math.max.apply(null, buf.map(function (b) { return mm(Math.hypot(b.x - m.x, b.y - m.y)); }));
        if (sp < 6) { locked = m; var obj = null, bd = 1e9; objs.forEach(function (o) { if (o.gone || o.kind !== 'cube') return; var d = Math.hypot(o.x - m.x, o.y - m.y); if (d < bd) { bd = d; obj = o; } });
          arm = { ph: 'plan → reach', t: now, p: { x: S.W * .5, y: S.H * .55 }, from: { x: S.W * .5, y: S.H * .55 }, obj: obj, g: 1 }; }
      }
    }
    function runArm(now) {
      var t = (now - arm.t) / 1000, W = S.W, H = S.H, drop = { x: W * .08, y: H * .86 }, home = { x: W * .5, y: H * .55 };
      function lerp(a, b, u) { u = clamp(u, 0, 1); u = u * u * (3 - 2 * u); return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }; }
      if (arm.ph === 'plan → reach') { arm.p = lerp(arm.from, locked, t / 1.1); if (t > 1.1) { arm.ph = 'close gripper'; arm.t = now; } }
      else if (arm.ph === 'close gripper') { arm.g = 1 - clamp(t / .4, 0, 1); if (t > .5) { arm.ph = 'lift & carry'; arm.t = now; arm.carry = arm.obj; if (arm.obj) arm.obj.gone = true; } }
      else if (arm.ph === 'lift & carry') { arm.p = lerp(locked, drop, t / 1.2); if (t > 1.2) { arm.ph = 'open'; arm.t = now; } }
      else if (arm.ph === 'open') { arm.g = clamp(t / .3, 0, 1); if (t > .4) { arm.carry = null; picked++; arm.ph = 'return home'; arm.t = now; } }
      else if (arm.ph === 'return home') { arm.p = lerp(drop, home, t / 1); if (t > 1) { arm = null; locked = null; target = null; buf = []; } }
    }
  };

  /* =====================================================================
     3. Hand teleop — fingertip pixel → depth → camera frame → AprilTag TF → base_link → IK
     ===================================================================== */
  DEMOS.hand = function (root) {
    var S = shell(root, 'Hand → robot: the full transform chain', 'Move your pointer over the camera image: it is the fingertip. Every number below is computed live, from pinhole back-projection to base_link to IK.');
    var hh = .15, noise = 4, safe = true, ptr = null, lastPtr = 0, cur = { x: .2, y: 0 }, side = 1;
    var fx = 615, fy = 615, cx = 320, cy = 240, Hc = .9, tagU = 320, tagV = 430;
    var setStep = steps(S, ['MediaPipe fingertip (u, v)', 'Back-project with depth', 'AprilTag: camera → base', 'Clamp to safe workspace', 'IK → joint angles']);
    slider(S, 'hand height above table', .03, .35, .01, hh, function (v) { return (v * 100).toFixed(0) + ' cm'; }, function (v) { hh = v; });
    slider(S, 'depth noise', 0, 15, 1, noise, function (v) { return v + ' mm'; }, function (v) { noise = v; });
    toggle(S, 'safety: clamp to workspace + speed cap', true, function (v) { safe = v; });
    var ro = readout(S);
    note(S, 'Simulated camera (fx = fy = 615). Real clamp: x, y ∈ [−0.25, 0.25] m, z ∈ [0.05, 0.40] m.');
    S.tl.innerHTML = 'RGB · aligned depth<br><b>camera_color_optical_frame</b>';
    S.tr.innerHTML = 'top view<br><b>base_link</b>';
    function lay() { var W = S.W, H = S.H, iw = W * .55 - 16, ih = iw * .75; if (ih > H - 50) { ih = H - 50; iw = ih / .75; } return { ix: 10, iy: (H - ih) / 2 + 8, iw: iw, ih: ih, rx: W * .58, rw: W * .42 - 12 }; }
    S.stage.addEventListener('pointermove', function (e) { var p = S.local(e), l = lay(); if (p.x > l.ix && p.x < l.ix + l.iw && p.y > l.iy && p.y < l.iy + l.ih) { ptr = { u: (p.x - l.ix) / l.iw * 640, v: (p.y - l.iy) / l.ih * 480 }; lastPtr = performance.now(); } else ptr = null; });
    S.stage.addEventListener('pointerleave', function () { ptr = null; });
    register(S, function (now) {
      var ctx = S.ctx, W = S.W, H = S.H, l = lay();
      var hand = ptr, autoMode = false;
      if (!hand && now - lastPtr > 2500) { var t = now / 1000; hand = { u: 320 + Math.sin(t * .6) * 210, v: 220 + Math.sin(t * 1.1) * 120 }; autoMode = true; }
      ctx.clearRect(0, 0, W, H);
      // camera image
      var g = ctx.createLinearGradient(0, l.iy, 0, l.iy + l.ih); g.addColorStop(0, C.camA); g.addColorStop(1, C.camB);
      ctx.fillStyle = g; ctx.fillRect(l.ix, l.iy, l.iw, l.ih); ctx.strokeStyle = C.line; ctx.strokeRect(l.ix + .5, l.iy + .5, l.iw, l.ih);
      function P(u, v) { return [l.ix + u / 640 * l.iw, l.iy + v / 480 * l.ih]; }
      // table grain
      ctx.strokeStyle = C.scan; for (var gy = 0; gy < 480; gy += 12) { var a = P(0, gy), b = P(640, gy); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      // AprilTag
      var tg = P(tagU, tagV), ts = l.iw / 640 * 38; ctx.fillStyle = '#fff'; ctx.fillRect(tg[0] - ts / 2, tg[1] - ts / 2, ts, ts); ctx.fillStyle = '#000'; ctx.fillRect(tg[0] - ts * .38, tg[1] - ts * .38, ts * .76, ts * .76);
      ctx.fillStyle = '#fff'; [[-.2, -.2], [.1, -.2], [-.2, .1], [.15, .12], [-.05, -.05]].forEach(function (q) { ctx.fillRect(tg[0] + q[0] * ts, tg[1] + q[1] * ts, ts * .12, ts * .12); });
      ctx.fillStyle = C.blue; font(ctx, Math.max(9, W / 95)); ctx.fillText('tag36h11 → base_link', tg[0] + ts, tg[1] + 4);
      // robot sketch in image (simple) heading to target later
      var st = 0, info = '';
      if (hand) {
        // 1. pixel
        st = 1; var u = hand.u, v = hand.v;
        // 2. depth & back-projection
        var z = Hc - hh + gauss(Math.random) * noise / 1000; st = 2;
        var xc = (u - cx) * z / fx, yc = (v - cy) * z / fy;
        // 3. camera → base (tag gives translation; camera looks straight down)
        var tx = (tagU - cx) * Hc / fx, ty = (tagV - cy) * Hc / fy;
        var xb = -(yc - ty), yb = -(xc - tx), zb = Hc - z; st = 3;
        // 4. clamp
        var cxb = clamp(xb, -.25, .25), cyb = clamp(yb, -.25, .25), czb = clamp(zb, .05, .40), clamped = (cxb !== xb || cyb !== yb || czb !== zb);
        var goal = safe ? { x: cxb, y: cyb } : { x: xb, y: yb }; st = 4;
        var sp = safe ? .006 : .05; if (!safe && !clamped) sp = .006; var _u = sp, dx = goal.x - cur.x, dy = goal.y - cur.y, d = Math.hypot(dx, dy);
        if (d > sp) { cur.x += dx / d * sp; cur.y += dy / d * sp; } else { cur.x = goal.x; cur.y = goal.y; }
        info = '<table><tr><td>pixel (u, v)</td><td><b>' + u.toFixed(0) + ', ' + v.toFixed(0) + '</b></td></tr>' +
          '<tr><td>depth z</td><td><b>' + z.toFixed(3) + '</b> m</td></tr>' +
          '<tr><td>p_cam</td><td class="bl">' + f2(xc) + f2(yc) + f2(z) + '</td></tr>' +
          '<tr><td>p_base</td><td class="a">' + f2(xb) + f2(yb) + f2(zb) + '</td></tr>' +
          '<tr><td>status</td><td>' + (clamped ? (safe ? '<span class="a">clamped to workspace</span>' : '<span class="r">OUTSIDE workspace!</span>') : '<span class="g">in workspace</span>') + (autoMode ? ' · <span style="color:#827c74">auto</span>' : '') + '</td></tr></table>';
        // draw hand
        var hp = P(u, v), sc = l.iw / 640, wr = [hp[0] + 34 * sc, hp[1] + 70 * sc];
        ctx.strokeStyle = 'rgba(232,190,160,.85)'; ctx.lineWidth = 16 * sc; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(wr[0] + 30 * sc, wr[1] + 70 * sc); ctx.lineTo(wr[0], wr[1]); ctx.lineTo(hp[0], hp[1]); ctx.stroke();
        ctx.lineWidth = 12 * sc; ctx.beginPath(); ctx.moveTo(wr[0], wr[1]); ctx.lineTo(wr[0] + 30 * sc, wr[1] - 30 * sc); ctx.stroke();
        var lm = [[0, 0], [.25, .25], [.5, .5], [.75, .75], [1, 1]]; ctx.fillStyle = '#ff4d4d';
        lm.forEach(function (q) { ctx.beginPath(); ctx.arc(hp[0] + (wr[0] - hp[0]) * q[0], hp[1] + (wr[1] - hp[1]) * q[1], 3, 0, Math.PI * 2); ctx.fill(); });
        ctx.beginPath(); ctx.arc(hp[0], hp[1], 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = C.text; ctx.fillText('index tip (' + u.toFixed(0) + ', ' + v.toFixed(0) + ')', hp[0] + 10, hp[1] - 10);
        ctx.setLineDash([3, 4]); ctx.strokeStyle = C.yel; ctx.beginPath(); ctx.moveTo(tg[0], tg[1]); ctx.lineTo(hp[0], hp[1]); ctx.stroke(); ctx.setLineDash([]);
      } else {
        var hx = .15 - cur.x, hy = -cur.y; cur.x += clamp(hx, -.006, .006); cur.y += clamp(hy, -.006, .006);
        info = '<span style="color:' + C.faint + '">no fingertip detected → returning home</span>';
        ctx.fillStyle = C.faint; ctx.fillText('move your pointer here', l.ix + 14, l.iy + 22);
      }
      ro.innerHTML = info; setStep(hand ? 4 : 0);
      // robot top view
      var sc2 = Math.min(l.rw / .62, (H - 70) / .62), ox = l.rx + l.rw / 2, oy = H / 2 + 14;
      function B(x, y) { return [ox - y * sc2, oy - x * sc2]; }
      ctx.strokeStyle = C.line; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(ox, oy, .3 * sc2, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      var b1 = B(-.25, .25), b2 = B(.25, -.25); ctx.strokeStyle = safe ? C.green : C.faint; ctx.setLineDash([6, 4]); ctx.strokeRect(b1[0], b2[1], b2[0] - b1[0], b1[1] - b2[1]); ctx.setLineDash([]);
      ctx.fillStyle = safe ? C.green : C.faint; ctx.fillText('safe workspace', b1[0] + 4, b2[1] - 6);
      // axes
      ctx.lineWidth = 2; ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - 34); ctx.stroke(); ctx.fillStyle = '#ef4444'; ctx.fillText('x', ox + 4, oy - 30);
      ctx.strokeStyle = '#22c55e'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - 34, oy); ctx.stroke(); ctx.fillStyle = '#22c55e'; ctx.fillText('y', ox - 40, oy - 4);
      var tp = B(cur.x, cur.y), L1 = .16 * sc2, L2 = .15 * sc2, s = ik2(ox, oy, tp[0], tp[1], L1, L2, side);
      drawArm2(ctx, [[ox, oy], [s.ex, s.ey], [s.wx, s.wy]], 12, Math.atan2(s.wy - s.ey, s.wx - s.ex), 1);
      if (hand) cross(ctx, tp[0], tp[1], 7, C.acc);
      var th1 = Math.atan2(-(s.ey - oy), s.ex - ox) * 180 / Math.PI, th2 = wrap(Math.atan2(-(s.wy - s.ey), s.wx - s.ex) - Math.atan2(-(s.ey - oy), s.ex - ox)) * 180 / Math.PI;
      S.bl.innerHTML = 'IK · θ1 <b>' + th1.toFixed(1) + '°</b> θ2 <b>' + th2.toFixed(1) + '°</b>';
    });
  };

  /* =====================================================================
     4. Apple detection — confidence / IoU thresholds, TP/FP/FN, PR curve, AP
     ===================================================================== */
  DEMOS.apples = function (root) {
    var S = shell(root, 'Detector evaluation: precision, recall, mAP', 'Synthetic orchard and detections. Slide the confidence threshold and switch the IoU threshold to see why mAP@50–95 is lower than mAP@50.');
    var conf = .4, iou = .5, showGT = true, seed = 7, gts = [], dets = [], leaves = [], ap = {};
    slider(S, 'confidence threshold', .05, .95, .01, conf, function (v) { return v.toFixed(2); }, function (v) { conf = v; });
    seg(S, 'IoU threshold for a match', [[.5, '0.50'], [.75, '0.75'], [.9, '0.90']], .5, function (v) { iou = v; });
    toggle(S, 'colour by match (TP / FP / missed)', true, function (v) { showGT = v; });
    var ro = readout(S);
    button(S, '↻ New orchard', function () { seed = (Math.random() * 1e6) | 0; build(); }, true);
    note(S, 'Illustration. The trained YOLO11s scored mAP@50 0.853 and mAP@50–95 0.495 on 6,172 real apples.');
    function boxIoU(a, b) { var x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y), x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h), i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1); return i / (a.w * a.h + b.w * b.h - i); }
    function build() {
      var r = rng(seed), W = S.W, H = S.H; gts = []; dets = []; leaves = [];
      for (var i = 0; i < 70; i++) leaves.push({ x: r() * W, y: r() * H * .95, rx: 10 + r() * 30, ry: 6 + r() * 14, a: r() * Math.PI, c: r() });
      for (var t = 0; t < 400 && gts.length < 24; t++) {
        var far = r() < .4, rad = (far ? 6 + r() * 6 : 13 + r() * 13) * W / 760, x = rad + r() * (W - 2 * rad), y = rad + r() * (H * .9 - 2 * rad);
        if (gts.some(function (g) { return Math.hypot(g.cx - x, g.cy - y) < g.r + rad - 4; })) continue;
        gts.push({ cx: x, cy: y, r: rad, occ: r() < .35 ? .2 + r() * .45 : 0, red: r() < .7, x: x - rad, y: y - rad, w: 2 * rad, h: 2 * rad });
      }
      gts.forEach(function (g) {
        var small = clamp((16 * W / 760 - g.r) / (10 * W / 760), 0, 1);
        if (r() > .97 - g.occ * .5 - small * .25) return;
        var c = clamp(.95 - g.occ * .7 - small * .35 + gauss(r) * .07, .06, .99), j = (1 - c) * .55 + g.occ * .35;
        var w = g.w * (1 + gauss(r) * j * .5 - g.occ * .3), h = g.h * (1 + gauss(r) * j * .5 - g.occ * .25);
        dets.push({ x: g.cx - w / 2 + gauss(r) * g.r * j * .6, y: g.cy - h / 2 + gauss(r) * g.r * j * .6, w: w, h: h, c: c });
        if (r() < .12) dets.push({ x: g.x + g.r * .3, y: g.y + g.r * .2, w: g.w * .8, h: g.h * .9, c: c * .5 });
      });
      for (var f = 0; f < 8; f++) { var lf = leaves[(r() * leaves.length) | 0], s = (8 + r() * 14) * W / 760; dets.push({ x: lf.x - s, y: lf.y - s, w: 2 * s, h: 2 * s, c: .08 + r() * .5 }); }
      dets.sort(function (a, b) { return b.c - a.c; });
      ap = {}; [.5, .55, .6, .65, .7, .75, .8, .85, .9, .95].forEach(function (th) { ap[th] = AP(th); });
    }
    function match(th, cth) {
      var used = new Array(gts.length).fill(false), out = [];
      dets.forEach(function (d) {
        if (d.c < cth) return;
        var bi = -1, bv = th; gts.forEach(function (g, i) { if (used[i]) return; var v = boxIoU(d, g); if (v >= bv) { bv = v; bi = i; } });
        if (bi >= 0) used[bi] = true; out.push({ d: d, tp: bi >= 0 });
      });
      return { m: out, used: used };
    }
    function AP(th) {
      var m = match(th, 0).m, tp = 0, fp = 0, P = [], R = [];
      m.forEach(function (x) { if (x.tp) tp++; else fp++; P.push(tp / (tp + fp)); R.push(tp / gts.length); });
      for (var i = P.length - 2; i >= 0; i--) P[i] = Math.max(P[i], P[i + 1]);
      var a = 0, pr = 0; for (i = 0; i < R.length; i++) { a += (R[i] - pr) * P[i]; pr = R[i]; }
      return { ap: a, P: P, R: R };
    }
    S.onResize = build;
    register(S, function () {
      var ctx = S.ctx, W = S.W, H = S.H;
      var sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, C.skyA); sky.addColorStop(1, C.skyB); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      leaves.forEach(function (l) { ctx.fillStyle = l.c < .5 ? C.leafA : C.leafB; ctx.beginPath(); ctx.ellipse(l.x, l.y, l.rx, l.ry, l.a, 0, Math.PI * 2); ctx.fill(); });
      gts.forEach(function (g) {
        var gr = ctx.createRadialGradient(g.cx - g.r * .35, g.cy - g.r * .35, g.r * .1, g.cx, g.cy, g.r);
        gr.addColorStop(0, g.red ? '#ff8a7a' : '#f7e36a'); gr.addColorStop(1, g.red ? '#b3222a' : '#b8a32a');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2); ctx.fill();
        if (g.occ) { ctx.fillStyle = C.leafOcc; ctx.beginPath(); ctx.ellipse(g.cx + g.r * .5, g.cy - g.r * .2, g.r * (.6 + g.occ), g.r * .7, .6, 0, Math.PI * 2); ctx.fill(); }
      });
      var res = match(iou, conf), tp = 0, fp = 0;
      font(ctx, Math.max(9, W / 100));
      res.m.forEach(function (x) {
        var d = x.d; x.tp ? tp++ : fp++;
        ctx.strokeStyle = showGT ? (x.tp ? C.green : C.red) : C.blue; ctx.lineWidth = 1.8; ctx.strokeRect(d.x, d.y, d.w, d.h);
        ctx.fillStyle = ctx.strokeStyle; ctx.fillText(d.c.toFixed(2), d.x, d.y - 3);
      });
      if (showGT) gts.forEach(function (g, i) { if (res.used[i]) return; ctx.strokeStyle = C.yel; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.4; ctx.strokeRect(g.x, g.y, g.w, g.h); ctx.setLineDash([]); });
      var fn = gts.length - tp, P = tp + fp ? tp / (tp + fp) : 1, R = tp / gts.length;
      // PR inset
      var iw = W * .3, ih = H * .3, ix = W - iw - 14, iy = H - ih - 14, cur = ap[iou];
      ctx.fillStyle = C.inset; ctx.fillRect(ix, iy, iw, ih); ctx.strokeStyle = C.line; ctx.strokeRect(ix + .5, iy + .5, iw, ih);
      ctx.fillStyle = C.faint; ctx.fillText('precision–recall · IoU ' + iou.toFixed(2), ix + 8, iy + 14);
      var px0 = ix + 26, py0 = iy + ih - 18, pw = iw - 38, ph = ih - 40;
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(px0, py0 - ph); ctx.lineTo(px0, py0); ctx.lineTo(px0 + pw, py0); ctx.stroke();
      ctx.strokeStyle = C.acc; ctx.lineWidth = 2; ctx.beginPath();
      cur.R.forEach(function (rr, i) { var X = px0 + rr * pw, Y = py0 - cur.P[i] * ph; if (!i) ctx.moveTo(px0, Y); ctx.lineTo(X, Y); }); ctx.stroke();
      ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(px0 + R * pw, py0 - P * ph, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.faint; ctx.fillText('R', px0 + pw - 8, py0 + 12); ctx.fillText('P', ix + 10, py0 - ph + 8);
      var m5095 = 0; for (var k in ap) m5095 += ap[k].ap; m5095 /= 10;
      ro.innerHTML = '<table><tr><td>apples counted</td><td><b>' + (tp + fp) + '</b> (true: ' + gts.length + ')</td></tr>' +
        '<tr><td>TP · FP · missed</td><td><span class="g">' + tp + '</span> · <span class="r">' + fp + '</span> · <span style="color:' + C.yel + '">' + fn + '</span></td></tr>' +
        '<tr><td>precision</td><td><b>' + P.toFixed(3) + '</b></td></tr><tr><td>recall</td><td><b>' + R.toFixed(3) + '</b></td></tr>' +
        '<tr><td>AP @ 0.50</td><td class="a">' + ap[.5].ap.toFixed(3) + '</td></tr><tr><td>AP @ 0.75</td><td class="a">' + ap[.75].ap.toFixed(3) + '</td></tr>' +
        '<tr><td>AP @ 0.50–0.95</td><td class="a">' + m5095.toFixed(3) + '</td></tr></table>';
      S.tl.innerHTML = 'YOLO detections · conf ≥ <b>' + conf.toFixed(2) + '</b>';
    });
  };

  /* =====================================================================
     5. RRR control — closed-form IK + joint PID + obstacle repulsion
     ===================================================================== */
  DEMOS.rrr = function (root) {
    var S = shell(root, '3R arm: IK + PID + repulsion', 'The target moves on (2L, L·sin 2πft). Closed-form IK gives joint goals, and a PID loop per joint tracks them. Tune the gains live.');
    var Kp = 8, Ki = .4, Kd = .15, f = .2, rate = 30, obst = true, th = [.3, .6, -.6], I = [0, 0, 0], E = [0, 0, 0], held = null, lastHold = 0, sim = 0, trail = [], errs = [], tLast = 0;
    var O = { x: 2.0, y: .35, r: .125 };
    slider(S, 'Kp', 0, 25, .5, Kp, null, function (v) { Kp = v; });
    slider(S, 'Ki', 0, 5, .1, Ki, null, function (v) { Ki = v; });
    slider(S, 'Kd', 0, 2, .05, Kd, null, function (v) { Kd = v; });
    slider(S, 'target frequency f', .05, .6, .01, f, function (v) { return v.toFixed(2) + ' Hz'; }, function (v) { f = v; });
    seg(S, 'target update rate (control 50 Hz)', [[5, '5 Hz'], [30, '30 Hz'], [0, 'continuous']], 30, function (v) { rate = v; });
    toggle(S, 'obstacle + repulsion field', true, function (v) { obst = v; });
    var ro = readout(S);
    S.tl.innerHTML = 'L₁ = L₂ = L₃ = 1 · <b>_ik_rrr_all()</b>';
    function fk(t) { var a = t[0], b = a + t[1], c = b + t[2]; var p1 = [Math.cos(a), Math.sin(a)], p2 = [p1[0] + Math.cos(b), p1[1] + Math.sin(b)]; return [[0, 0], p1, p2, [p2[0] + Math.cos(c), p2[1] + Math.sin(c)]]; }
    function ikAll(x, y) {
      var phi = Math.atan2(y, x), wx = x - Math.cos(phi), wy = y - Math.sin(phi), d2 = wx * wx + wy * wy, c2 = clamp((d2 - 2) / 2, -1, 1), out = [];
      [1, -1].forEach(function (s) { var t2 = s * Math.acos(c2), t1 = Math.atan2(wy, wx) - Math.atan2(Math.sin(t2), 1 + Math.cos(t2)); out.push([t1, t2, phi - t1 - t2]); });
      return out;
    }
    function repel(p) {
      if (!obst) return p; var dx = p.x - O.x, dy = p.y - O.y, d = Math.hypot(dx, dy), safe = 2 * O.r;
      if (d >= safe) return p; if (d < 1e-6) { dx = -1; dy = 0; d = 1; }
      return { x: O.x + dx / d * safe, y: O.y + dy / d * safe };
    }
    register(S, function (now) {
      var ctx = S.ctx, W = S.W, H = S.H, plotH = H * .24, vh = H - plotH;
      var dtF = Math.min(.05, (now - (tLast || now)) / 1000); tLast = now;
      // control loop at 50 Hz in fixed sub-steps
      var dt = .02, steps = Math.round(dtF / dt) || 1;
      for (var s = 0; s < steps; s++) {
        sim += dt;
        var raw = { x: 2, y: Math.sin(2 * Math.PI * f * sim) };
        if (!rate) held = raw; else if (!held || sim - lastHold >= 1 / rate) { held = raw; lastHold = sim; }
        var cmd = repel(held), sols = ikAll(cmd.x, cmd.y), best = sols[0], bd = 1e9;
        sols.forEach(function (q) { var dd = Math.abs(wrap(q[0] - th[0])) + Math.abs(wrap(q[1] - th[1])) + Math.abs(wrap(q[2] - th[2])); if (dd < bd) { bd = dd; best = q; } });
        for (var j = 0; j < 3; j++) {
          var e = wrap(best[j] - th[j]); I[j] = clamp(I[j] + e * dt, -1, 1); var D = (e - E[j]) / dt; E[j] = e;
          th[j] += clamp(Kp * e + Ki * I[j] + Kd * D, -6, 6) * dt;
        }
        var ee = fk(th)[3]; errs.push(Math.hypot(ee[0] - raw.x, ee[1] - raw.y)); if (errs.length > 300) errs.shift();
        trail.push(ee); if (trail.length > 160) trail.shift();
      }
      // view transform
      var sc = Math.min(W / 3.9, vh / 3.3), ox = W * .14, oy = vh / 2;
      function V(p) { return [ox + p[0] * sc, oy - p[1] * sc]; }
      ctx.clearRect(0, 0, W, H); grid(ctx, W, vh, sc / 2);
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, vh); ctx.stroke();
      ctx.setLineDash([4, 5]); ctx.strokeStyle = C.safe; var a1 = V([2, -1]), a2 = V([2, 1]); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.line; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.arc(ox, oy, 3 * sc, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.setLineDash([]);
      if (obst) {
        var oc = V([O.x, O.y]); ctx.fillStyle = C.obsF; ctx.strokeStyle = C.obsS; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(oc[0], oc[1], 2 * O.r * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(oc[0], oc[1], O.r * sc, 0, Math.PI * 2); ctx.fill();
        font(ctx, Math.max(9, W / 95)); ctx.fillText('obstacle · safe zone 2r', oc[0] + 2 * O.r * sc + 6, oc[1] + 4);
      }
      ctx.strokeStyle = C.blue; ctx.lineWidth = 1.5; ctx.beginPath(); trail.forEach(function (p, i) { var v = V(p); i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]); }); ctx.stroke();
      var P = fk(th).map(V); drawArm2(ctx, P, 12, null);
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(P[3][0], P[3][1], 6, 0, Math.PI * 2); ctx.fill();
      var tr = V([held.x, held.y]); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(tr[0], tr[1], 7, 0, Math.PI * 2); ctx.fill();
      var cm = repel(held); if (cm !== held) { var cv = V([cm.x, cm.y]); ctx.strokeStyle = C.yel; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cv[0], cv[1], 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(tr[0], tr[1]); ctx.lineTo(cv[0], cv[1]); ctx.stroke(); ctx.setLineDash([]); }
      // error plot
      ctx.fillStyle = C.plot; ctx.fillRect(0, vh, W, plotH); ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(0, vh + .5); ctx.lineTo(W, vh + .5); ctx.stroke();
      var mx = Math.max(.2, Math.max.apply(null, errs)); ctx.strokeStyle = C.acc; ctx.lineWidth = 1.6; ctx.beginPath();
      errs.forEach(function (e, i) { var x = 50 + i / 300 * (W - 64), y = vh + plotH - 10 - e / mx * (plotH - 26); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      font(ctx, Math.max(9, W / 95)); ctx.fillStyle = C.faint; ctx.fillText('|ee − target|', 8, vh + 16); ctx.fillText(mx.toFixed(2) + ' L', 8, vh + 30); ctx.fillText('last 6 s', W - 60, vh + 16);
      var e = errs[errs.length - 1] || 0, rms = Math.sqrt(errs.reduce(function (a, b) { return a + b * b; }, 0) / (errs.length || 1));
      ro.innerHTML = '<table><tr><td>error now</td><td><b>' + e.toFixed(3) + '</b> L</td></tr><tr><td>RMS (6 s)</td><td class="a">' + rms.toFixed(3) + ' L</td></tr>' +
        '<tr><td>θ1 θ2 θ3</td><td>' + th.map(function (t) { return (wrap(t) * 180 / Math.PI).toFixed(0) + '°'; }).join(' ') + '</td></tr></table>';
      S.bl.innerHTML = '<span style="color:' + C.green + '">●</span> target <span style="color:' + C.blue + '">●</span> end-effector' + (obst ? ' <span style="color:' + C.yel + '">○</span> repelled' : '');
    });
  };

  /* ---------------- mount ---------------- */
  function mountAll(scope) {
    (scope || document).querySelectorAll('.demo-mount[data-demo]').forEach(function (m) {
      if (m.dataset.mounted || m.closest('#overview')) return;
      var fn = DEMOS[m.dataset.demo]; if (!fn) return;
      m.dataset.mounted = '1'; fn(m);
    });
  }
  window.ProjectDemos = { mountAll: mountAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mountAll(); }); else mountAll();
})();
