// Blue-tinted sky: vertical gradient, soft drifting clouds, faint parallax IT words.
(function () {
  var words = [], clouds = [], W = 0, H = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function allWords() { return [].concat.apply([], WH.config.wordSets); }

  function resize(w, h) {
    W = w; H = h;
    var pool = allWords();
    words = [];
    for (var i = 0; i < WH.config.bgWordCount; i++) {
      var depth = Math.random(); // 0 far .. 1 near
      words.push({ text: pool[i % pool.length], x: rand(0, W), y: rand(0, H), depth: depth,
                   size: H * (0.01 + depth * 0.024), speed: 6 + depth * 30, phase: rand(0, 6.28),
                   hue: Math.floor(rand(0, 4)) });
    }
    clouds = [];
    for (var j = 0; j < 9; j++) {
      clouds.push({ x: rand(-0.2, 1.2) * W, y: rand(0.05, 0.9) * H, r: rand(0.12, 0.35) * H,
                    speed: rand(4, 14), a: rand(0.04, 0.1) });
    }
  }

  function draw(ctx, t, dt, showWords) {
    var c = WH.config.sky, g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c.top); g.addColorStop(0.55, c.mid); g.addColorStop(1, c.bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    clouds.forEach(function (cl) {
      cl.x += cl.speed * dt; if (cl.x - cl.r > W) cl.x = -cl.r;
      var rg = ctx.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, cl.r);
      rg.addColorStop(0, 'rgba(255,255,255,' + cl.a + ')'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(cl.x - cl.r, cl.y - cl.r, cl.r * 2, cl.r * 2);
    });

    if (showWords === false) return;
    ctx.textBaseline = 'middle';
    ctx.save();
    words.forEach(function (w) {
      w.x -= w.speed * dt; if (w.x < -w.size * 10) { w.x = W + w.size * 2; w.y = rand(0, H); }
      var tw = 0.5 + 0.5 * Math.sin(t * 0.0008 + w.phase);
      ctx.font = (w.depth > 0.6 ? '800 ' : '500 ') + w.size + 'px system-ui, Segoe UI, sans-serif';
      if (!w.width || w.font !== ctx.font) { w.font = ctx.font; w.width = ctx.measureText(w.text).width; }
      var st = WH.config.gradient, g = ctx.createLinearGradient(w.x, w.y, w.x + w.width, w.y);
      g.addColorStop(0, st[(w.hue) % st.length]); g.addColorStop(1, st[(w.hue + 1) % st.length]);
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.06 + w.depth * 0.22 * tw;
      ctx.fillText(w.text, w.x, w.y);
    });
    ctx.restore();
  }

  WH.sky = { resize: resize, draw: draw };
})();
