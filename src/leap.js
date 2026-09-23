// Minimal Leap Motion WebSocket client (Orion 4.x service, protocol v6).
// Has no dependencies, so it works offline. Converts frames to a compact hand model:
// { id, type, palm:[x,y,z], vel:[x,y,z], grab, pinch, wrist:[..]|null, fingers:[[p0..p4] x5] }
// with all positions in mm in Leap space (y up, origin on the device).
(function () {
  var state = { connected: false, hands: [], lastFrameAt: 0 };
  var ws = null, retryMs = 1000;

  function parseFrame(f) {
    if (!f.hands) return;
    var byHand = {};
    (f.pointables || []).forEach(function (p) {
      if (!p.carpPosition) return; // tools or old protocol
      (byHand[p.handId] = byHand[p.handId] || [])[p.type] =
        [p.carpPosition, p.mcpPosition, p.pipPosition, p.dipPosition, p.btipPosition || p.tipPosition];
    });
    state.hands = f.hands.map(function (h) {
      return {
        id: h.id, type: h.type, palm: h.palmPosition, vel: h.palmVelocity || [0, 0, 0],
        grab: h.grabStrength || 0, pinch: h.pinchStrength || 0,
        wrist: h.wrist || null, fingers: (byHand[h.id] || []).filter(Boolean),
      };
    });
    state.lastFrameAt = performance.now();
  }

  function connect() {
    try { ws = new WebSocket(WH.config.leapUrl); } catch (e) { return schedule(); }
    ws.onopen = function () {
      state.connected = true; retryMs = 1000;
      ws.send(JSON.stringify({ background: true }));
      ws.send(JSON.stringify({ focused: true }));
      ws.send(JSON.stringify({ enableGestures: false }));
    };
    ws.onmessage = function (e) {
      var d; try { d = JSON.parse(e.data); } catch (_) { return; }
      if (d.event && d.event.type === 'deviceEvent') return;
      parseFrame(d);
    };
    ws.onclose = function () { state.connected = false; state.hands = []; schedule(); };
    ws.onerror = function () { try { ws.close(); } catch (_) {} };
  }
  function schedule() { setTimeout(connect, retryMs); retryMs = Math.min(retryMs * 2, 10000); }

  WH.leap = {
    start: connect,
    // Hands go stale if the service stops sending frames without closing.
    hands: function () { return performance.now() - state.lastFrameAt < 500 ? state.hands : []; },
    connected: function () { return state.connected; },
  };
})();
