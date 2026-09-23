// Render loop: sky -> word-filled hand silhouettes; demo hands when nobody is interacting.
(function () {
  var canvas = document.getElementById('stage'), ctx = canvas.getContext('2d');
  var hint = document.getElementById('hint'), status = document.getElementById('status');
  var params = new URLSearchParams(location.search);
  var DEBUG = params.get('debug') === '1', FORCE_DEMO = params.get('demo') === '1';
  var W, H, last = performance.now(), lastLiveAt = -Infinity, fps = 60;

  function resize() {
    // 1:1 CSS pixels. A 4K canvas with a glow runs smoothly on modest GPUs.
    W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    WH.sky.resize(W, H); WH.fill.resize(W, H);
  }
  addEventListener('resize', resize); resize();
  WH.onConfigChange = resize; // re-seed background words after menu changes
  if (!FORCE_DEMO) WH.leap.start();

  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;

    var live = FORCE_DEMO ? [] : WH.leap.hands();
    if (live.length) lastLiveAt = now;
    var demo = now - lastLiveAt > WH.config.idleToDemoMs;
    var hands = demo ? WH.demo.hands(now) : live;

    WH.sky.draw(ctx, now, dt);
    WH.fill.update(hands, dt);
    WH.fill.draw(ctx, hands);
    if (DEBUG) WH.hands.debug(ctx, hands, W, H);

    hint.style.opacity = demo ? 1 : 0;
    status.textContent = (WH.leap.connected() ? 'sensor connected' : 'sensor offline') +
      (demo ? ' · demo' : '') + (DEBUG ? ' · ' + fps.toFixed(0) + ' fps' : '');
    window.__fps = fps;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
