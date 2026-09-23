// Mode "puppet": a full-body figure filled with scrolling words. The LM-010 only sees hands, so the
// tracked hands drive the figure's wrists (2-bone IK for the elbows) and its lean; idle it breathes and waves.
(function () {
  var W = 0, H = 0, t = 0, offset = 0, lean = 0, wr = { L: null, R: null }, grab = { L: 0, R: 0 };

  function lerp(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }

  // Elbow for shoulder S reaching target T with bone lengths l1, l2; choose the lower solution.
  function ik(S, T, l1, l2) {
    var dx = T[0] - S[0], dy = T[1] - S[1], d = Math.max(1, Math.min(Math.hypot(dx, dy), l1 + l2 - 1));
    var a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))), th = Math.atan2(dy, dx);
    var e1 = [S[0] + Math.cos(th + a) * l1, S[1] + Math.sin(th + a) * l1];
    var e2 = [S[0] + Math.cos(th - a) * l1, S[1] + Math.sin(th - a) * l1];
    var wrist = [S[0] + Math.cos(th) * d, S[1] + Math.sin(th) * d];
    return { elbow: e1[1] > e2[1] ? e1 : e2, wrist: wrist };
  }

  function skeleton() {
    var s = H * 0.86, cx = W / 2 + lean * s * 0.12, top = H * 0.08, br = 1 + 0.015 * Math.sin(t * 1.6);
    var neck = [cx, top + s * 0.16], hip = [W / 2, top + s * 0.55];
    var sh = s * 0.13 * br, hw = s * 0.08;
    return {
      s: s, head: [cx, top + s * 0.08], headR: s * 0.075, neck: neck, hip: hip,
      shL: [neck[0] - sh, neck[1] + s * 0.03], shR: [neck[0] + sh, neck[1] + s * 0.03],
      hipL: [hip[0] - hw, hip[1]], hipR: [hip[0] + hw, hip[1]],
      footL: [hip[0] - s * 0.13 - lean * s * 0.03, top + s], footR: [hip[0] + s * 0.13 - lean * s * 0.03, top + s],
      kneeL: [hip[0] - s * 0.1, top + s * 0.77], kneeR: [hip[0] + s * 0.1, top + s * 0.77],
      upper: s * 0.17, lower: s * 0.16,
    };
  }

  function hand(l, E, Wr, th, closed) { // palm blob plus fanned fingers along the forearm direction
    var a = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]), len = th * (2.1 - 1.4 * closed);
    l.beginPath(); l.arc(Wr[0], Wr[1], th * 0.9, 0, 6.283); l.fill();
    l.lineWidth = th * 0.42;
    for (var i = -2; i <= 2; i++) {
      var b = a + i * 0.32;
      l.beginPath(); l.moveTo(Wr[0], Wr[1]);
      l.lineTo(Wr[0] + Math.cos(b) * len * (i === -2 || i === 2 ? 0.75 : 1), Wr[1] + Math.sin(b) * len); l.stroke();
    }
  }

  WH.util.register('puppet', 'Word puppet (full figure)', {
    resize: function (w, h) { W = w; H = h; wr = { L: null, R: null }; },
    update: function (hands, dt) {
      t += dt; offset += WH.config.scrollSpeed * dt;
      var sk = skeleton(), reach = sk.upper + sk.lower;
      var pts = WH.util.points(hands, W, H).sort(function (a, b) { return a.palm[0] - b.palm[0]; });
      var tgt = { L: null, R: null };
      if (pts.length >= 2) { tgt.L = pts[0]; tgt.R = pts[pts.length - 1]; }
      else if (pts.length === 1) tgt[pts[0].palm[0] < W / 2 ? 'L' : 'R'] = pts[0];
      ['L', 'R'].forEach(function (side) {
        var S = sk['sh' + side], p = tgt[side], goal;
        if (p) { // map the hand's screen position into the figure's reach around the shoulder
          var nx = (p.palm[0] - W / 2) / (W / 2), ny = (p.palm[1] - H / 2) / (H / 2);
          goal = [S[0] + (side === 'L' ? -0.35 : 0.35) * reach + nx * reach * 0.9, S[1] + ny * reach * 1.1];
          grab[side] += (p.grab - grab[side]) * Math.min(1, dt * 8);
        } else if (side === 'R' && !pts.length) { // idle wave
          goal = [S[0] + reach * 0.55, S[1] - reach * 0.55 + Math.sin(t * 5) * reach * 0.08];
          goal[0] += Math.sin(t * 5) * reach * 0.18; grab[side] *= 0.9;
        } else {
          goal = [S[0] + (side === 'L' ? -0.25 : 0.25) * reach, S[1] + reach * 0.9 + Math.sin(t * 1.3) * 6];
          grab[side] *= 0.9;
        }
        wr[side] = wr[side] ? lerp(wr[side], goal, Math.min(1, dt * 10)) : goal;
      });
      var goalLean = pts.length ? (pts.reduce(function (m, p) { return m + p.palm[0]; }, 0) / pts.length - W / 2) / (W / 2) : Math.sin(t * 0.4) * 0.2;
      lean += (Math.max(-1, Math.min(1, goalLean)) - lean) * Math.min(1, dt * 3);
    },
    draw: function (ctx, hands) {
      var sk = skeleton(), s = sk.s;
      var pinch = hands.reduce(function (m, h) { return Math.max(m, h.pinch); }, 0);
      WH.util.silhouette(ctx, W, H, function (l) {
        l.beginPath(); l.arc(sk.head[0], sk.head[1], sk.headR, 0, 6.283); l.fill();
        l.lineWidth = s * 0.07; l.beginPath(); l.moveTo(sk.head[0], sk.head[1]); l.lineTo(sk.neck[0], sk.neck[1] + s * 0.03); l.stroke();
        // Torso: rounded quad from shoulders to hips.
        l.lineWidth = s * 0.06;
        l.beginPath(); l.moveTo(sk.shL[0], sk.shL[1]); l.lineTo(sk.shR[0], sk.shR[1]);
        l.lineTo(sk.hipR[0], sk.hipR[1]); l.lineTo(sk.hipL[0], sk.hipL[1]); l.closePath(); l.fill(); l.stroke();
        l.lineWidth = s * 0.075;
        [['L'], ['R']].forEach(function (x) {
          var side = x[0];
          l.beginPath(); l.moveTo(sk['hip' + side][0], sk['hip' + side][1]);
          l.lineTo(sk['knee' + side][0], sk['knee' + side][1]); l.lineTo(sk['foot' + side][0], sk['foot' + side][1]); l.stroke();
        });
        ['L', 'R'].forEach(function (side) {
          var S = sk['sh' + side], r = ik(S, wr[side], sk.upper, sk.lower);
          l.lineWidth = s * 0.055;
          l.beginPath(); l.moveTo(S[0], S[1]); l.lineTo(r.elbow[0], r.elbow[1]); l.lineTo(r.wrist[0], r.wrist[1]); l.stroke();
          hand(l, r.elbow, r.wrist, s * 0.04, grab[side]);
        });
      }, offset, pinch, 1);
    },
  });
})();
