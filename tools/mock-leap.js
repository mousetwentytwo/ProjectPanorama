// Fake Leap service for testing without hardware: node tools/mock-leap.js
// Serves v6-style JSON frames on ws://127.0.0.1:6437/v6.json. Needs `npm i ws` (dev only).
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ host: '127.0.0.1', port: 6437 });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ serviceVersion: 'mock', version: 6 }));
  const t0 = Date.now();
  const timer = setInterval(() => {
    const t = (Date.now() - t0) / 1000, cx = 120 * Math.sin(t), y = 220, cz = 0;
    const pointables = [-40, -20, 0, 20, 40].map((dx, type) => {
      const bx = cx + dx, tip = (k) => [bx + dx * 0.3 * k, y, cz - 20 - 25 * k];
      return { handId: 7, type, carpPosition: [cx + dx * 0.5, y, cz + 40], mcpPosition: tip(0),
               pipPosition: tip(1), dipPosition: tip(2), btipPosition: tip(3) };
    });
    ws.send(JSON.stringify({ id: Date.now(), hands: [{ id: 7, type: 'right', palmPosition: [cx, y, cz],
      palmVelocity: [120 * Math.cos(t), 0, 0], grabStrength: 0, pinchStrength: 0, wrist: [cx, y, cz + 90] }],
      pointables }));
  }, 16);
  ws.on('close', () => clearInterval(timer));
});
console.log('mock Leap on ws://127.0.0.1:6437');
