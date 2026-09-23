// Mode "burst": a word cloud in the centre. An open hand blasts it apart; closing the hand (or no hands)
// springs it back, and each re-form brings up the next headline word.
(function () {
  var W = 0, H = 0, items = [], headline = 0, exploded = false, ctxM = document.createElement('canvas').getContext('2d');

  function layout() {
    var words = WH.util.words(), placed = [], cx = W / 2, cy = H * 0.47, old = items;
    var list = [words[headline % words.length]];
    for (var i = 1; list.length < 90; i++) list.push(words[(headline + i) % words.length]);
    items = [];
    list.forEach(function (w, i) {
      var size = i === 0 ? H * 0.11 : H * Math.max(0.018, 0.06 * Math.pow(0.975, i));
      var weight = i === 0 ? 900 : (i < 12 ? 800 : 600);
      ctxM.font = WH.util.font(size, weight);
      if (i === 0) { size = Math.min(size, size * W * 0.8 / ctxM.measureText(w).width); ctxM.font = WH.util.font(size, weight); }
      var bw = ctxM.measureText(w).width + size * 0.3, bh = size * 1.05;
      // Archimedean spiral until the box does not overlap anything placed so far.
      for (var a = 0; a < 400; a += 0.08) {
        var r = a * H * 0.006, x = cx + Math.cos(a) * r * 1.6, y = cy + Math.sin(a) * r;
        var box = [x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2];
        if (box[0] < 0 || box[2] > W || box[1] < 0 || box[3] > H * 0.94) continue;
        if (placed.every(function (q) { return box[2] < q[0] || box[0] > q[2] || box[3] < q[1] || box[1] > q[3]; })) {
          placed.push(box);
          var prev = old[items.length];
          items.push({ word: w, size: size, weight: weight, hx: x, hy: y,
                       x: prev ? prev.x : cx, y: prev ? prev.y : cy, vx: 0, vy: 0, head: i === 0 });
          break;
        }
      }
    });
  }

  WH.util.register('burst', 'Word cloud burst', {
    fullField: true,
    resize: function (w, h) { W = w; H = h; items = []; layout(); },
    onSetChange: function () { headline = 0; layout(); },
    update: function (hands, dt) {
      var pts = WH.util.points(hands, W, H).filter(function (h) { return h.open > 0.7; }), disp = 0;
      items.forEach(function (it) {
        var ax = (it.hx - it.x) * 9, ay = (it.hy - it.y) * 9; // spring home
        pts.forEach(function (h) {
          var dx = it.x - h.palm[0], dy = it.y - h.palm[1], d = Math.hypot(dx, dy) + 1;
          var f = 9000 * h.open / (1 + d / (H * 0.25)); ax += dx / d * f; ay += dy / d * f;
        });
        it.vx = (it.vx + ax * dt) * 0.9; it.vy = (it.vy + ay * dt) * 0.9;
        it.x += it.vx * dt; it.y += it.vy * dt;
        disp += Math.hypot(it.x - it.hx, it.y - it.hy);
      });
      disp /= Math.max(1, items.length);
      if (disp > H * 0.15) exploded = true;
      else if (exploded && disp < H * 0.01) { exploded = false; headline++; layout(); }
    },
    draw: function (ctx, hands, now) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var g = WH.util.screenGradient(ctx, W, H, now);
      items.forEach(function (it) {
        ctx.font = WH.util.font(it.size, it.weight);
        if (it.head) {
          ctx.shadowColor = 'rgba(140,220,255,0.9)'; ctx.shadowBlur = H * 0.03; ctx.fillStyle = '#ffffff';
        } else { ctx.shadowBlur = 0; ctx.fillStyle = g; }
        ctx.globalAlpha = it.head ? 1 : Math.min(1, 0.45 + it.size / (H * 0.06));
        ctx.fillText(it.word, it.x, it.y);
      });
      if (WH.util.flash > 0.01) { ctx.globalAlpha = WH.util.flash * 0.3; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    },
  });
})();
