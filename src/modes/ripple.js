// Mode "ripple": the whole screen is a field of words. Hands send out expanding rings; words on a
// ring swell, brighten and sometimes change. Resting hands give a slow standing pulse.
(function () {
  var W = 0, H = 0, cells = [], rings = [], lastSpawn = {}, t = 0, rh = 20;
  var mctx = document.createElement('canvas').getContext('2d');

  var widths = {};
  function width(w) { return widths[w] || (widths[w] = mctx.measureText(w).width); }

  function build() {
    widths = {};
    var words = WH.util.words(), k = 0;
    rh = Math.max(12, H * WH.config.rowHeightVh * 1.5); cells = [];
    mctx.font = WH.util.font(rh * 0.62, 700);
    for (var y = rh / 2, r = 0; y < H + rh; y += rh, r++) {
      for (var x = (r % 2) * rh * 1.5; x < W + rh;) {
        var w = words[k++ % words.length], cw = mctx.measureText(w).width + rh * 0.7;
        cells.push({ x: x + cw / 2, y: y, word: w, I: 0, room: cw - rh * 0.5 });
        x += cw;
      }
    }
  }

  WH.util.register('ripple', 'Ripple / wave field', {
    fullField: true,
    resize: function (w, h) { W = w; H = h; rings = []; build(); },
    onSetChange: build,
    update: function (hands, dt) {
      t += dt;
      WH.util.points(hands, W, H).forEach(function (h) {
        var sp = Math.hypot(h.vel[0], h.vel[1]), gap = sp > W * 0.08 ? 0.22 : 1.3;
        if (t - (lastSpawn[h.id] || 0) > gap && rings.length < 30) {
          lastSpawn[h.id] = t;
          rings.push({ x: h.palm[0], y: h.palm[1], r: 0, life: 1, strength: sp > W * 0.08 ? 1 : 0.55 });
        }
      });
      rings = rings.filter(function (g) { g.r += H * 0.45 * dt; g.life -= dt * 0.35; return g.life > 0; });
      var band = rh * 1.6, words = WH.util.words();
      cells.forEach(function (c) {
        var I = 0;
        for (var i = 0; i < rings.length; i++) {
          var g = rings[i], d = Math.hypot(c.x - g.x, c.y - g.y) - g.r;
          if (d > -band * 3 && d < band * 3) I += Math.exp(-(d * d) / (band * band)) * g.life * g.strength;
        }
        c.I += (Math.min(1.2, I) - c.I) * Math.min(1, dt * 10);
        if (c.I > 0.6 && Math.random() < dt * 2) {
          var cand = words[Math.floor(Math.random() * words.length)];
          if (width(cand) <= c.room) c.word = cand; // keep rows from overlapping
        }
      });
    },
    draw: function (ctx, hands, now) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = WH.util.screenGradient(ctx, W, H, now);
      var base = rh * 0.62;
      cells.forEach(function (c) {
        ctx.globalAlpha = Math.min(1, 0.22 + c.I * 0.8);
        ctx.font = WH.util.font(base * (1 + c.I * 0.35), c.I > 0.4 ? 900 : 700);
        ctx.fillText(c.word, c.x, c.y);
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 2;
      rings.forEach(function (g) {
        ctx.strokeStyle = 'rgba(190,235,255,' + (g.life * 0.25).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.283); ctx.stroke();
      });
      if (WH.util.flash > 0.01) { ctx.globalAlpha = WH.util.flash * 0.25; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    },
  });
})();
