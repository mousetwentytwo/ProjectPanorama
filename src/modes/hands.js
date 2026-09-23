// Mode "hands": hand silhouettes filled with scrolling word rows.
(function () {
  var W = 0, H = 0, offset = 0, alpha = 0;
  WH.util.register('hands', 'Hands: word-filled silhouettes', {
    resize: function (w, h) { W = w; H = h; },
    update: function (hands, dt) {
      var speed = 0;
      hands.forEach(function (h) { speed = Math.max(speed, Math.hypot(h.vel[0], h.vel[1])); });
      offset += (WH.config.scrollSpeed + speed * 0.9) * dt;
      alpha += ((hands.length ? 1 : 0) - alpha) * Math.min(1, dt * 4);
    },
    draw: function (ctx, hands) {
      var pinch = hands.reduce(function (m, h) { return Math.max(m, h.pinch); }, 0);
      WH.util.silhouette(ctx, W, H, function (l) { WH.hands.paint(l, hands, W, H); }, offset, pinch, alpha);
    },
  });
})();
