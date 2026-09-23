// Mode "constellation": fingertips and palms become glowing nodes in a neural-network mesh with
// drifting background nodes. Each fingertip carries a word; fast-moving tips shed word sparks.
(function () {
  var W = 0, H = 0, bg = [], sparks = [], prev = {}, labelShift = 0;
  function rand(a, b) { return a + Math.random() * (b - a); }

  WH.util.register('constellation', 'Constellation / neural mesh', {
    resize: function (w, h) {
      W = w; H = h; bg = []; sparks = [];
      for (var i = 0; i < 46; i++) bg.push({ x: rand(0, W), y: rand(0, H), vx: rand(-20, 20), vy: rand(-14, 14) });
    },
    onSetChange: function () { labelShift += 3; },
    update: function (hands, dt) {
      bg.forEach(function (n) {
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      var words = WH.util.words(), next = {};
      WH.util.points(hands, W, H).forEach(function (h, hi) {
        h.tips.forEach(function (p, i) {
          var key = h.id + ':' + i, q = prev[key]; next[key] = p;
          if (!q) return;
          var sp = Math.hypot(p[0] - q[0], p[1] - q[1]) / Math.max(dt, 1e-3);
          if (sp > W * 0.25 && Math.random() < dt * 14 && sparks.length < 220) {
            sparks.push({ x: p[0], y: p[1], vx: (p[0] - q[0]) / dt * 0.15 + rand(-30, 30), vy: (p[1] - q[1]) / dt * 0.15 + rand(-30, 30),
                          life: 1, word: words[Math.floor(Math.random() * words.length)] });
          }
        });
      });
      prev = next;
      sparks = sparks.filter(function (s) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.97; s.vy *= 0.97; s.life -= dt * 0.45; return s.life > 0; });
    },
    draw: function (ctx, hands, now) {
      var pts = WH.util.points(hands, W, H), words = WH.util.words(), D = H * 0.24;
      var nodes = bg.map(function (n) { return { x: n.x, y: n.y, hand: false }; });
      pts.forEach(function (h) {
        nodes.push({ x: h.palm[0], y: h.palm[1], hand: true, palm: true });
        h.tips.forEach(function (p) { nodes.push({ x: p[0], y: p[1], hand: true }); });
      });
      ctx.save();
      ctx.strokeStyle = WH.util.screenGradient(ctx, W, H, now);
      for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y), lim = (a.hand || b.hand) ? D * 1.5 : D;
        if (d > lim) continue;
        ctx.globalAlpha = (1 - d / lim) * (a.hand && b.hand ? 0.9 : a.hand || b.hand ? 0.6 : 0.25);
        ctx.lineWidth = a.hand && b.hand ? 3 : 1.2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // Bones: palm to each tip.
      ctx.globalAlpha = 0.8; ctx.lineWidth = 4;
      pts.forEach(function (h) { h.tips.forEach(function (p) { ctx.beginPath(); ctx.moveTo(h.palm[0], h.palm[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }); });

      ctx.shadowColor = 'rgba(140,220,255,0.95)';
      nodes.forEach(function (n) {
        var r = n.hand ? (n.palm ? H * 0.018 : H * 0.011) : H * 0.004;
        ctx.globalAlpha = n.hand ? 1 : 0.6; ctx.shadowBlur = n.hand ? H * 0.025 : 0;
        ctx.fillStyle = n.hand ? '#eaf8ff' : '#9fd4ff';
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
      });
      ctx.shadowBlur = 0; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = WH.util.screenGradient(ctx, W, H, now);
      pts.forEach(function (h, hi) {
        ctx.globalAlpha = 1; ctx.font = WH.util.font(H * 0.026, 800);
        h.tips.forEach(function (p, i) { ctx.fillText(words[(hi * 5 + i + labelShift) % words.length], p[0] + H * 0.02, p[1] - H * 0.02); });
      });
      sparks.forEach(function (s) {
        ctx.globalAlpha = s.life; ctx.font = WH.util.font(H * (0.012 + 0.012 * s.life), 600);
        ctx.fillText(s.word, s.x, s.y);
      });
      ctx.restore();
    },
  });
})();
