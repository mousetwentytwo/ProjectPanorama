// Silhouette layer: dark translucent hand shapes filled with scrolling rows of IT words.
(function () {
  var layer = document.createElement('canvas'), lctx = layer.getContext('2d');
  var W = 0, H = 0, offset = 0, setIdx = 0, grabbed = false, alpha = 0, flash = 0;

  function resize(w, h) { W = layer.width = w; H = layer.height = h; }

  function update(hands, dt) {
    var speed = 0;
    hands.forEach(function (h) { speed = Math.max(speed, Math.hypot(h.vel[0], h.vel[1])); });
    offset += (WH.config.scrollSpeed + speed * 0.9) * dt;

    // A grab (fist) switches to the next word set once per grab.
    var isGrab = hands.some(function (h) { return h.grab > WH.config.grabThreshold; });
    if (isGrab && !grabbed) { setIdx = (setIdx + 1) % WH.config.wordSets.length; flash = 1; }
    grabbed = isGrab;
    flash = Math.max(0, flash - dt * 1.5);
    alpha += ((hands.length ? 1 : 0) - alpha) * Math.min(1, dt * 4);
  }

  function drawRows(ctx, pinch) {
    var words = WH.config.wordSets[setIdx];
    var rh = H * WH.config.rowHeightVh, rows = Math.ceil(H / rh) + 1;
    ctx.textBaseline = 'middle';
    ctx.font = '800 ' + (rh * 0.8).toFixed(1) + 'px system-ui, Segoe UI, sans-serif';
    for (var r = 0; r < rows; r++) {
      var dir = r % 2 ? 1 : -1, speedMul = 0.6 + ((r * 37) % 10) / 12;
      var line = '', start = (r * 5) % words.length;
      for (var i = 0; i < 12; i++) line += words[(start + i) % words.length] + '  ·  ';
      var lw = ctx.measureText(line).width;
      var x = ((dir * offset * speedMul) % lw + lw) % lw - lw;
      var light = 70 + 25 * Math.sin(r * 0.7 + offset * 0.004) + pinch * 10;
      ctx.fillStyle = 'hsl(' + (195 + r * 3 % 30) + ',100%,' + Math.min(97, light + flash * 20).toFixed(0) + '%)';
      for (; x < W; x += lw) ctx.fillText(line, x, r * rh + rh / 2);
    }
  }

  function draw(ctx, hands) {
    if (alpha < 0.01) return;
    lctx.clearRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = lctx.strokeStyle = 'rgba(4,24,64,0.82)';
    WH.hands.paint(lctx, hands, W, H);
    lctx.globalCompositeOperation = 'source-atop'; // words only where a hand is
    var pinch = hands.reduce(function (m, h) { return Math.max(m, h.pinch); }, 0);
    drawRows(lctx, pinch);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(120,210,255,' + (0.8 + flash * 0.2) + ')';
    ctx.shadowBlur = H * 0.03;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  WH.fill = { resize: resize, update: update, draw: draw };
})();
