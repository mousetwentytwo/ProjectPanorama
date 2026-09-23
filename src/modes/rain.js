// Mode "rain": falling word particles. An open hand pushes them away; a fist pulls them in like a magnet.
(function () {
  var W = 0, H = 0, ps = [], t = 0;
  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawn(p, top) {
    var words = WH.util.words(), d = Math.random();
    p.word = words[Math.floor(Math.random() * words.length)];
    p.depth = d; p.size = H * (0.011 + d * 0.019);
    p.x = rand(0, W); p.y = top ? rand(-H * 0.2, -10) : rand(0, H);
    p.vx = 0; p.vy = 0; p.fall = H * (0.03 + d * 0.07); p.phase = rand(0, 6.28);
    return p;
  }
  function reseed() { ps = []; for (var i = 0; i < WH.config.rainCount; i++) ps.push(spawn({}, false)); }

  WH.util.register('rain', 'Word rain / swarm', {
    fullField: true,
    resize: function (w, h) { W = w; H = h; reseed(); },
    onSetChange: function () { ps.forEach(function (p) { var w = WH.util.words(); p.word = w[Math.floor(Math.random() * w.length)]; }); },
    update: function (hands, dt) {
      t += dt;
      var pts = WH.util.points(hands, W, H), R = H * 0.28;
      ps.forEach(function (p) {
        var ax = Math.sin(t * 0.6 + p.phase) * 12, ay = (p.fall - p.vy) * 1.5;
        pts.forEach(function (h) {
          var dx = p.x - h.palm[0], dy = p.y - h.palm[1], d = Math.hypot(dx, dy) + 1;
          if (h.grab > 0.6) { // magnet: pull toward the fist, with a little swirl
            if (d < R * 2.5) { var f = 2600 * (1 - d / (R * 2.5)); ax += (-dx / d * f) + (-dy / d) * 400; ay += (-dy / d * f) + (dx / d) * 400; }
          } else if (d < R) { // open hand: push away
            var g = 5200 * (1 - d / R) * h.open; ax += dx / d * g; ay += dy / d * g;
          }
        });
        p.vx = (p.vx + ax * dt) * 0.96; p.vy = (p.vy + ay * dt) * 0.96;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y > H + 20) spawn(p, true);
        if (p.x < -200) p.x += W + 300; else if (p.x > W + 100) p.x -= W + 300;
      });
    },
    draw: function (ctx, hands, now) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = WH.util.screenGradient(ctx, W, H, now);
      ps.forEach(function (p) {
        ctx.globalAlpha = 0.35 + p.depth * 0.65;
        ctx.font = WH.util.font(p.size, p.depth > 0.6 ? 800 : 600);
        ctx.fillText(p.word, p.x, p.y);
      });
      // Glow where a fist is attracting.
      WH.util.points(hands, W, H).forEach(function (h) {
        if (h.grab <= 0.6) return;
        var r = H * 0.12, g = ctx.createRadialGradient(h.palm[0], h.palm[1], 0, h.palm[0], h.palm[1], r);
        g.addColorStop(0, 'rgba(180,230,255,0.55)'); g.addColorStop(1, 'rgba(180,230,255,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(h.palm[0] - r, h.palm[1] - r, r * 2, r * 2);
      });
      ctx.restore();
    },
  });
})();
