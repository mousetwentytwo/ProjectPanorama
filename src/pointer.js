// Mouse / touch fallback when no Leap sensor is sending hands: the pointer becomes one hand in the
// same model as WH.leap (Leap mm space), so every mode works. Pressing = fist (grab 1), released = open hand.
(function () {
  var pos = null, down = false, lastMove = -Infinity, prev = null, vel = [0, 0, 0];

  // Inverse of WH.hands.projector: screen px -> Leap mm (x, z); y is a fixed mid height.
  function toLeap(px, py) {
    var b = WH.config.box, W = innerWidth, H = innerHeight;
    var x = b.xMin + px / W * (b.xMax - b.xMin);
    var y = (py - H / 2) / (W * (b.zMax - b.zMin) / (b.xMax - b.xMin)) + 0.5;
    return [x, (b.yNear + b.yFar) / 2, b.zMin + y * (b.zMax - b.zMin)];
  }
  function move(e) {
    var now = performance.now(), p = toLeap(e.clientX, e.clientY);
    if (prev) {
      var dt = Math.max(0.008, (now - prev.t) / 1000);
      vel = [0, 1, 2].map(function (i) { return vel[i] * 0.5 + (p[i] - prev.p[i]) / dt * 0.5; });
    }
    prev = { p: p, t: now }; pos = p; lastMove = now;
  }
  addEventListener('pointermove', move);
  addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('#whm,#lpb,#whg')) return; down = true; move(e); });
  addEventListener('pointerup', function () { down = false; });
  addEventListener('pointercancel', function () { down = false; pos = null; });

  // Synthetic finger layout (short fingers when closed) so silhouette modes have something to draw.
  function fingers(c, open) {
    return [[-45, 55, -0.9], [-25, 75, -0.15], [-5, 82, 0], [15, 76, 0.12], [33, 60, 0.28]].map(function (b, i) {
      var len = b[1] * (0.35 + 0.65 * open), carp = [c[0] + b[0] * 0.6, c[1], c[2] + 40], mcp = [c[0] + b[0], c[1], c[2] - (i ? 25 : 0)];
      var pts = [carp, mcp], p = mcp;
      [0.45, 0.3, 0.25].forEach(function (s) { p = [p[0] + Math.sin(b[2]) * len * s, c[1], p[2] - Math.cos(b[2]) * len * s]; pts.push(p); });
      return pts;
    });
  }

  WH.pointer = {
    // Active while the pointer moved in the last 5 s (or is held down).
    hands: function () {
      if (!pos || (!down && performance.now() - lastMove > 5000)) { vel = [0, 0, 0]; return []; }
      var g = down ? 1 : 0;
      return [{ id: 'ptr', type: 'right', palm: pos, vel: vel.slice(), grab: g, pinch: 0,
                wrist: [pos[0], pos[1], pos[2] + 95], fingers: fingers(pos, 1 - g) }];
    },
  };
})();
