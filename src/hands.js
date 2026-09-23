// Projects Leap hands (mm) to the screen and paints solid silhouettes onto a layer.
(function () {
  function projector(W, H) {
    var b = WH.config.box;
    return function (p) {
      var x = (p[0] - b.xMin) / (b.xMax - b.xMin), y = (p[2] - b.zMin) / (b.zMax - b.zMin);
      // Keep the aspect: spread x over the width, and scale z so a hand is not squashed.
      return [x * W, H / 2 + (y - 0.5) * W * (b.zMax - b.zMin) / (b.xMax - b.xMin), p[1]];
    };
  }

  // Stroke thickness in px for a given hand height (mm): lower hands (closer to the sensor) look bigger.
  function thickness(W, y) {
    var b = WH.config.box, k = Math.max(0, Math.min(1, (y - b.yNear) / (b.yFar - b.yNear)));
    return W * 0.012 * WH.config.handScale * (1.3 - 0.6 * k);
  }

  function hull(pts) { // monotone chain convex hull
    pts = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [];
    pts.forEach(function (p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    for (var i = pts.length - 1; i >= 0; i--) { var p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  // Draw every hand as one filled shape using the current fillStyle / strokeStyle.
  function paint(ctx, hands, W, H) {
    var P = projector(W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    hands.forEach(function (h) {
      if (!h.fingers.length) return;
      var t = thickness(W, h.palm[1]);
      var palmPts = [];
      h.fingers.forEach(function (f) { palmPts.push(P(f[0]), P(f[1])); });
      if (h.wrist) palmPts.push(P(h.wrist));
      var hp = hull(palmPts);
      ctx.lineWidth = t * 1.4;
      ctx.beginPath(); hp.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.closePath(); ctx.fill(); ctx.stroke();
      h.fingers.forEach(function (f, i) {
        ctx.lineWidth = t * (i === 0 ? 1.15 : 1);
        ctx.beginPath();
        for (var k = 1; k < f.length; k++) { var p = P(f[k]); k === 1 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
      });
    });
  }

  // Skeleton overlay for ?debug=1.
  function debug(ctx, hands, W, H) {
    var P = projector(W, H);
    ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2;
    hands.forEach(function (h) {
      h.fingers.forEach(function (f) {
        ctx.beginPath(); f.forEach(function (q, k) { var p = P(q); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      });
    });
  }

  WH.hands = { paint: paint, debug: debug, projector: projector };
})();
