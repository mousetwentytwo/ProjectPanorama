// Shared helpers for display modes: word sets, grab -> next set, gradients, screen-space hands,
// and the "words clipped to a silhouette" layer used by the hands and puppet modes.
(function () {
  var U = WH.util = { setIdx: 0, flash: 0, grabbed: false, onSetChange: null };
  var FONT = 'px system-ui, Segoe UI, sans-serif';

  U.font = function (px, weight) { return (weight || 600) + ' ' + px.toFixed(1) + FONT; };
  U.words = function () {
    var s = WH.config.wordSets;
    return s[U.setIdx % s.length] || ['AI'];
  };

  // Once per frame: a grab (fist) switches to the next word set once per grab, and flashes.
  U.update = function (hands, dt) {
    var isGrab = hands.some(function (h) { return h.grab > WH.config.grabThreshold; });
    if (isGrab && !U.grabbed) {
      U.setIdx = (U.setIdx + 1) % WH.config.wordSets.length; U.flash = 1;
      if (U.onSetChange) U.onSetChange();
    }
    U.grabbed = isGrab;
    U.flash = Math.max(0, U.flash - dt * 1.5);
  };

  // Linear gradient through the configured stops, mirrored so it tiles without a seam.
  U.gradient = function (ctx, x0, y0, x1, y1) {
    var st = WH.config.gradient, n = st.length * 2 - 2, g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i <= n; i++) g.addColorStop(i / n, st[i < st.length ? i : n - i]);
    return g;
  };
  // Whole-screen diagonal gradient that drifts over time (for free-floating words).
  U.screenGradient = function (ctx, W, H, t) {
    var s = (t * 0.00005 % 1) * W * 2;
    return U.gradient(ctx, -s, 0, W * 2 - s, H);
  };

  // Hands in screen space: palm, fingertips, velocity in px/s, openness 0..1.
  U.points = function (hands, W, H) {
    var P = WH.hands.projector(W, H), b = WH.config.box, k = W / (b.xMax - b.xMin);
    return hands.map(function (h) {
      return {
        id: h.id, palm: P(h.palm), grab: h.grab, pinch: h.pinch, open: 1 - h.grab,
        tips: h.fingers.map(function (f) { return P(f[f.length - 1]); }),
        vel: [h.vel[0] * k, h.vel[2] * k],
      };
    });
  };

  // Scrolling gradient word rows over the whole layer (drawn source-atop onto a silhouette).
  U.wordRows = function (ctx, W, H, offset, pinch) {
    var words = U.words(), rh = Math.max(8, H * WH.config.rowHeightVh), rows = Math.ceil(H / rh) + 1;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (var r = 0; r < rows; r++) {
      var dir = r % 2 ? 1 : -1, speedMul = 0.6 + ((r * 37) % 10) / 12;
      var heavy = r % 3 === 0; // mix weights for texture
      ctx.font = U.font(rh * (heavy ? 0.95 : 0.8), heavy ? 900 : 600);
      var line = '', start = (r * 7) % words.length;
      for (var i = 0; i < 16; i++) line += words[(start + i) % words.length] + ' • ';
      var lw = ctx.measureText(line).width;
      var x = ((dir * offset * speedMul) % lw + lw) % lw - lw;
      var shift = (offset * 0.6 + r * rh * 3) % (W * 2);
      ctx.fillStyle = U.gradient(ctx, -shift, 0, W * 2 - shift, rh * 6);
      for (; x < W; x += lw) ctx.fillText(line, x, r * rh + rh / 2);
    }
    var glow = Math.max(U.flash * 0.6, pinch * 0.2);
    if (glow > 0.01) { ctx.fillStyle = 'rgba(255,255,255,' + glow.toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  };

  // Silhouette painted by paintFn (solid fill/stroke), filled with word rows, drawn with a glow.
  var layer = document.createElement('canvas'), lctx = layer.getContext('2d');
  U.silhouette = function (ctx, W, H, paintFn, offset, pinch, alpha) {
    if (alpha < 0.01) return;
    if (layer.width !== W || layer.height !== H) { layer.width = W; layer.height = H; }
    lctx.clearRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = lctx.strokeStyle = 'rgba(4,24,64,0.82)';
    lctx.lineCap = lctx.lineJoin = 'round';
    paintFn(lctx);
    lctx.globalCompositeOperation = 'source-atop'; // words only where the silhouette is
    U.wordRows(lctx, W, H, offset, pinch);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(120,210,255,' + (0.8 + U.flash * 0.2) + ')';
    ctx.shadowBlur = H * 0.03;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  };

  WH.modes = {}; WH.modeList = [];
  U.register = function (key, label, mode) { mode.key = key; mode.label = label; WH.modes[key] = mode; WH.modeList.push(mode); };
})();
