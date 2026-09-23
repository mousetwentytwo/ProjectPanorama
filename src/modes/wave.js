// Mode "wave": a purple/cyan dot plane in perspective moving like a fluid surface, with word banners
// scrolling left and right above it. Hands drop ripples into the surface; a fist makes a big splash.
(function () {
  var W = 0, H = 0, t = 0, horizon = 0, f = 0, CAM = 1.2, ZFAR = 14;
  var rows = [], ripples = [], banners = [], palette = [], lastDrop = {};

  function C() { return WH.config.wave; }
  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function buildPalette() {
    var a = hex(C().colors[0]), b = hex(C().colors[1]);
    palette = [];
    for (var i = 0; i < 8; i++) {
      var k = i / 7, m = function (j) { return Math.round(a[j] + (b[j] - a[j]) * k); };
      palette.push('rgb(' + m(0) + ',' + m(1) + ',' + m(2) + ')');
    }
  }

  // Surface height at world (x, z): three travelling waves plus hand ripples.
  function height(x, z) {
    var c = C(), amp = 0.22 * c.amplitude, L = c.wavelength, s = c.speed * t, ch = c.choppiness;
    var h = Math.sin((x * 0.9 + z * 0.55) / L - s * 1.3) * amp
          + Math.sin((x * -0.6 + z * 1.1) / (L * 0.7) - s * 1.7) * amp * 0.6 * ch
          + Math.sin((x * 1.7 - z * 0.3) / (L * 0.45) - s * 2.3) * amp * 0.35 * ch;
    for (var i = 0; i < ripples.length; i++) {
      var r = ripples[i], d = Math.hypot(x - r.x, z - r.z), front = r.age * 2.2;
      if (d > front + 1) continue;
      h += r.a * Math.sin(d * 4 - r.age * 9) * Math.exp(-r.age * 0.9) * Math.exp(-Math.max(0, front - d) * 0.35) / (1 + d);
    }
    return h;
  }
  function project(x, y, z) { return [W / 2 + x / z * f, horizon + (CAM - y) / z * f]; }
  function unproject(sx, sy) { // screen point -> surface point (y = 0)
    var z = Math.max(1.1, Math.min(ZFAR, CAM * f / Math.max(4, sy - horizon)));
    return { x: (sx - W / 2) * z / f, z: z };
  }

  function build() {
    var d = C().density, nz = Math.round(60 * d), nx = Math.round(120 * d);
    rows = [];
    for (var i = 0; i < nz; i++) {
      var z = 1 + (ZFAR - 1) * Math.pow(1 - i / (nz - 1), 1.7); // far rows first
      var half = z * (W / 2) / f * 1.15, xs = [];
      for (var j = 0; j < nx; j++) xs.push(-half + 2 * half * j / (nx - 1));
      rows.push({ z: z, xs: xs });
    }
    buildPalette(); buildBanners();
  }
  function buildBanners() {
    var n = Math.max(1, Math.round(C().banners)), words = WH.util.words(), old = banners;
    banners = [];
    for (var i = 0; i < n; i++) {
      var k = n === 1 ? 0.5 : i / (n - 1), line = '';
      for (var w = 0; w < 14; w++) line += words[(i * 5 + w) % words.length] + '   •   ';
      banners.push({ y: H * (0.1 + k * 0.72), size: H * (0.028 + k * 0.038), dir: i % 2 ? 1 : -1,
                     speed: 0.6 + k * 0.9, off: old[i] ? old[i].off : 0, boost: 0, line: line, k: k });
    }
  }

  WH.util.register('wave', 'Wave: fluid dot plane + banners', {
    ownBackground: true,
    resize: function (w, h) { W = w; H = h; horizon = H * 0.35; f = H * 0.9; ripples = []; build(); },
    onSetChange: buildBanners,
    update: function (hands, dt) {
      t += dt;
      WH.util.points(hands, W, H).forEach(function (h) {
        var sp = Math.hypot(h.vel[0], h.vel[1]), p = unproject(h.palm[0], Math.max(h.palm[1], horizon + H * 0.08));
        var fist = h.grab > WH.config.grabThreshold;
        if ((sp > W * 0.05 || fist) && t - (lastDrop[h.id] || 0) > (fist ? 0.8 : 0.18) && ripples.length < 24) {
          lastDrop[h.id] = t;
          ripples.push({ x: p.x, z: p.z, age: 0, a: (fist ? 0.9 : 0.35) * C().amplitude });
        }
        banners.forEach(function (b) { // speed up the banner nearest the hand
          var d = Math.abs(b.y - h.palm[1]) / H; if (d < 0.12) b.boost = Math.max(b.boost, sp / W * 2.5);
        });
      });
      ripples = ripples.filter(function (r) { r.age += dt; return r.age < 6; });
      banners.forEach(function (b) {
        b.boost *= Math.pow(0.3, dt);
        b.off += b.dir * WH.config.scrollSpeed * b.speed * (1 + b.boost) * dt;
      });
    },
    draw: function (ctx, hands, now) {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#040820'); g.addColorStop(0.35, '#1b0d44'); g.addColorStop(1, '#070f2e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var amp = 0.22 * C().amplitude * 1.8 + 1e-3;

      ctx.save();
      rows.forEach(function (row) {
        var depth = 1 - (row.z - 1) / (ZFAR - 1); // 0 far .. 1 near
        ctx.globalAlpha = 0.25 + depth * 0.75;
        var base = Math.max(1, f * 0.012 / row.z);
        for (var j = 0; j < row.xs.length; j++) {
          var x = row.xs[j], h = height(x, row.z), p = project(x, h, row.z);
          if (p[1] < horizon - 60 || p[1] > H + 10) continue;
          var k = Math.max(0, Math.min(1, h / amp + 0.5)), s = base * (0.7 + k * 0.9);
          ctx.fillStyle = palette[Math.round(k * 7)];
          ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
        }
      });
      ctx.restore();

      // Banners: ribbon + scrolling gradient text, bobbing and tilting with the surface below.
      ctx.save();
      ctx.textBaseline = 'middle';
      banners.forEach(function (b, i) {
        var z = 3 + (1 - b.k) * 7, hl = height(-2, z), hr = height(2, z);
        var bob = (hl + hr) / 2 * f / z * 0.6, tilt = Math.atan2(hr - hl, 4) * 0.5;
        ctx.save();
        ctx.translate(W / 2, b.y - bob); ctx.rotate(tilt);
        var rg = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
        rg.addColorStop(0, 'rgba(10,6,40,0)'); rg.addColorStop(0.15, 'rgba(10,6,40,0.55)');
        rg.addColorStop(0.85, 'rgba(10,6,40,0.55)'); rg.addColorStop(1, 'rgba(10,6,40,0)');
        ctx.fillStyle = rg; ctx.fillRect(-W * 0.6, -b.size * 0.85, W * 1.2, b.size * 1.7);
        ctx.font = WH.util.font(b.size, i % 2 ? 700 : 900);
        var lw = ctx.measureText(b.line).width, x = ((b.off % lw) + lw) % lw - lw - W * 0.6;
        var shift = (now * 0.05 + i * 300) % (W * 2);
        ctx.fillStyle = WH.util.gradient(ctx, -W - shift, 0, W * 3 - shift, 0);
        ctx.shadowColor = 'rgba(120,220,255,0.7)'; ctx.shadowBlur = b.size * 0.5;
        for (; x < W * 0.6; x += lw) ctx.fillText(b.line, x, 0);
        ctx.restore();
      });
      if (WH.util.flash > 0.01) { ctx.globalAlpha = WH.util.flash * 0.25; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    },
  });
})();
