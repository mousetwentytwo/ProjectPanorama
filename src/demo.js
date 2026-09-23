// Attract mode: synthetic hands in the same format as WH.leap, so the screen is never empty.
(function () {
  // Finger layout for a right hand, palm down, fingers toward -z (mm, relative to the palm).
  var BASE = [ // [x offset of the knuckle, finger length, splay angle]
    [-45, 55, -0.9], [-25, 75, -0.15], [-5, 82, 0], [15, 76, 0.12], [33, 60, 0.28],
  ];
  function hand(id, type, cx, cz, t, open) {
    var mir = type === 'left' ? -1 : 1, y = 220 + 40 * Math.sin(t * 0.7 + id);
    var fingers = BASE.map(function (b, i) {
      var ang = b[2] * mir * (0.6 + 0.6 * open) + 0.15 * Math.sin(t * 2 + i) * open;
      var carp = [cx + b[0] * mir * 0.6, y, cz + 40], mcp = [cx + b[0] * mir, y, cz - (i ? 25 : 0)];
      var pts = [carp, mcp], len = b[1] * (0.35 + 0.65 * open), segs = [0.45, 0.3, 0.25];
      var p = mcp;
      segs.forEach(function (s) {
        p = [p[0] + Math.sin(ang) * len * s, y, p[2] - Math.cos(ang) * len * s];
        pts.push(p);
      });
      return pts;
    });
    return { id: id, type: type, palm: [cx, y, cz], vel: [200 * Math.cos(t * 0.5), 0, 0],
             grab: open < 0.1 ? 1 : 0, pinch: 0, wrist: [cx, y, cz + 95], fingers: fingers };
  }

  function hands(tMs) {
    var t = tMs / 1000, cycle = t % 16;
    var open = Math.min(1, Math.max(0, 0.55 + 0.6 * Math.sin(t * 0.9))); // closes to a fist now and then
    var out = [hand(1, 'right', 70 + 70 * Math.sin(t * 0.5), -10 + 40 * Math.sin(t * 0.33), t, open)];
    if (cycle > 8) out.push(hand(2, 'left', -90 + 40 * Math.sin(t * 0.4), 10 * Math.cos(t), t + 1.3, 1));
    return out;
  }

  WH.demo = { hands: hands };
})();
