// Mode "games": Leap minigames with a score, prize tiers and claim codes.
// SELECT (hover a tile / keys 1-4) -> INTRO (3-2-1) -> PLAY -> RESULT (tier, prize, code) -> SELECT.
// Demo hands never play: real hands (or the keyboard) are needed, and only rounds with real hands earn a code.
(function () {
  var U = WH.util;
  var W = 0, H = 0, t = 0, state = 'select', stateT = 0, sel = 0, dwell = 0, dwellIdx = -1;
  var game = null, score = 0, combo = 1, timeLeft = 0, result = null, sawReal = false;
  var lastActivity = 0, openHold = 0, grabPrev = {}, pops = [], pts = [], demoNow = false;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function cfg() { return WH.config.games; }
  function dist(a, b, c, d) { return Math.hypot(a - c, b - d); }

  function pop(x, y, text, color) { pops.push({ x: x, y: y, text: text, color: color, life: 1 }); }
  // Add points with the combo multiplier; any penalty resets the combo.
  function add(p, x, y) {
    if (p > 0) { p = Math.round(p * Math.floor(combo)); combo = Math.min(5, combo + 0.25); } else combo = 1;
    score = Math.max(0, score + p);
    pop(x, y, (p > 0 ? '+' : '') + p, p > 0 ? '#7dffb0' : '#ff6b8a');
  }
  // Hands whose grab crossed the fist threshold this frame.
  function fistEdges() {
    var out = [], next = {};
    pts.forEach(function (h) {
      var g = h.grab > WH.config.grabThreshold; next[h.id] = g;
      if (g && !grabPrev[h.id]) out.push(h);
    });
    grabPrev = next;
    return out;
  }
  function label(ctx, text, x, y, px, weight, color, align) {
    ctx.font = U.font(px, weight || 700); ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color || '#fff'; ctx.fillText(text, x, y);
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---------------------------------------------------------------- Bug Catcher
  var BUGS = ['NullPointer', 'Race Condition', 'Memory Leak', 'Off-by-one', 'Deadlock', 'Heisenbug', 'Segfault', 'Stack Overflow', 'Typo'];
  var bugCatcher = {
    key: 'bugs', name: 'BUG CATCHER', rule: 'Make a fist on a bug to squash it. Spare the green features!',
    start: function () { this.bugs = []; },
    spawn: function () {
      var r = Math.random(), kind = r < 0.08 ? 'gold' : r < 0.23 ? 'feature' : 'bug';
      this.bugs.push({ x: rand(0.1, 0.9) * W, y: rand(0.25, 0.9) * H, a: rand(0, 6.28), sp: H * rand(0.08, 0.16) * (kind === 'gold' ? 1.8 : 1),
                       kind: kind, label: kind === 'feature' ? 'FEATURE' : kind === 'gold' ? 'CRITICAL BUG' : pick(BUGS), r: H * 0.035, leg: 0 });
    },
    update: function (dt) {
      var self = this;
      while (this.bugs.length < 7) this.spawn();
      this.bugs.forEach(function (b) {
        b.a += rand(-3, 3) * dt; b.leg += dt * 14;
        b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt;
        if (b.x < W * 0.05 || b.x > W * 0.95) { b.a = Math.PI - b.a; b.x = Math.max(W * 0.05, Math.min(W * 0.95, b.x)); }
        if (b.y < H * 0.18 || b.y > H * 0.95) { b.a = -b.a; b.y = Math.max(H * 0.18, Math.min(H * 0.95, b.y)); }
      });
      fistEdges().forEach(function (h) {
        var best = null, bd = 1e9;
        self.bugs.forEach(function (b) { var d = dist(b.x, b.y, h.palm[0], h.palm[1]); if (d < b.r * 2.4 && d < bd) { bd = d; best = b; } });
        if (!best) return;
        add(best.kind === 'gold' ? 50 : best.kind === 'feature' ? -20 : 10, best.x, best.y - best.r * 2);
        self.bugs.splice(self.bugs.indexOf(best), 1);
      });
    },
    draw: function (ctx) {
      this.bugs.forEach(function (b) {
        var col = b.kind === 'gold' ? '#ffd24a' : b.kind === 'feature' ? '#4dff9a' : '#ff5a7a';
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a + Math.PI / 2);
        ctx.strokeStyle = col; ctx.lineWidth = b.r * 0.12;
        for (var i = -1; i <= 1; i++) for (var s = -1; s <= 1; s += 2) {
          var sw = Math.sin(b.leg + i * 2 + s) * 0.3;
          ctx.beginPath(); ctx.moveTo(0, i * b.r * 0.5); ctx.lineTo(s * b.r * 1.3, i * b.r * 0.6 + sw * b.r); ctx.stroke();
        }
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = b.r * 0.8;
        ctx.beginPath(); ctx.ellipse(0, b.r * 0.2, b.r * 0.75, b.r, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -b.r * 0.95, b.r * 0.45, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = b.r * 0.08;
        ctx.beginPath(); ctx.moveTo(0, -b.r * 0.6); ctx.lineTo(0, b.r * 1.15); ctx.stroke();
        ctx.restore();
        label(ctx, b.label, b.x, b.y + b.r * 1.9, H * 0.018, 700, col);
      });
    },
    icon: function (ctx, x, y, s) {
      ctx.fillStyle = '#ff5a7a'; ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = s * 0.05;
      for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + i * s * 0.2); ctx.lineTo(x + s * 0.5, y + i * s * 0.25); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(x, y + s * 0.05, s * 0.25, s * 0.33, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - s * 0.33, s * 0.15, 0, 6.283); ctx.fill();
    },
  };

  // ---------------------------------------------------------------- Word Sort
  var wordSort = {
    key: 'sort', name: 'WORD SORT', rule: 'Push falling words into the right bucket with your palm.',
    start: function () { this.words = []; this.next = 0.5; },
    update: function (dt, progress) {
      var self = this, sets = WH.config.wordSets, n = Math.min(3, sets.length), bw = W / n;
      this.next -= dt;
      if (this.next <= 0) {
        var c = Math.floor(Math.random() * n);
        this.words.push({ x: rand(0.1, 0.9) * W, y: H * 0.14, vx: 0, word: pick(sets[c]), cat: c });
        this.next = 1.7 - 1.0 * progress;
      }
      var fall = H * (0.1 + 0.12 * progress);
      this.words = this.words.filter(function (w) {
        pts.forEach(function (h) {
          var dx = w.x - h.palm[0], dy = w.y - h.palm[1];
          if (Math.abs(dy) < H * 0.1 && Math.abs(dx) < W * 0.09) w.vx = h.vel[0] * 0.9 + (dx >= 0 ? 1 : -1) * W * 0.15;
        });
        w.vx *= Math.pow(0.25, dt); w.x = Math.max(W * 0.03, Math.min(W * 0.97, w.x + w.vx * dt)); w.y += fall * dt;
        if (w.y < H * 0.84) return true;
        var b = Math.min(n - 1, Math.floor(w.x / bw));
        add(b === w.cat ? 10 : -5, w.x, H * 0.8);
        return false;
      });
    },
    draw: function (ctx) {
      var sets = WH.config.wordSets, n = Math.min(3, sets.length), bw = W / n, labels = cfg().sortLabels;
      var cols = ['#7df9ff', '#b388ff', '#ffb86b'];
      for (var i = 0; i < n; i++) {
        ctx.fillStyle = 'rgba(8,24,60,0.55)'; ctx.strokeStyle = cols[i]; ctx.lineWidth = 3;
        rrect(ctx, i * bw + W * 0.01, H * 0.85, bw - W * 0.02, H * 0.13, 16); ctx.fill(); ctx.stroke();
        label(ctx, labels[i] || ('SET ' + (i + 1)), i * bw + bw / 2, H * 0.915, H * 0.04, 900, cols[i]);
      }
      this.words.forEach(function (w) {
        ctx.font = U.font(H * 0.032, 800);
        var tw = ctx.measureText(w.word).width;
        ctx.fillStyle = 'rgba(4,16,44,0.75)'; rrect(ctx, w.x - tw / 2 - 12, w.y - H * 0.028, tw + 24, H * 0.056, 12); ctx.fill();
        label(ctx, w.word, w.x, w.y, H * 0.032, 800, '#fff');
      });
    },
    icon: function (ctx, x, y, s) {
      ['#7df9ff', '#b388ff', '#ffb86b'].forEach(function (c, i) {
        ctx.strokeStyle = c; ctx.lineWidth = s * 0.05; rrect(ctx, x - s * 0.5 + i * s * 0.35, y + s * 0.1, s * 0.3, s * 0.35, 4); ctx.stroke();
      });
      ctx.fillStyle = '#fff'; rrect(ctx, x - s * 0.2, y - s * 0.4, s * 0.4, s * 0.16, 4); ctx.fill();
    },
  };

  // ---------------------------------------------------------------- Packet Defender
  var GOOD = ['HTTPS', 'DNS', 'API', 'SSH', 'NTP', 'SMTP'], BAD = ['MALWARE', 'DDoS', 'PHISH', 'RANSOM', 'WORM', 'SQLi'];
  var packetDefender = {
    key: 'packets', name: 'PACKET DEFENDER', rule: 'Your palm is a shield: block red packets, let green ones through.',
    start: function () { this.packets = []; this.next = 0.6; this.hp = 5; this.hurt = 0; },
    update: function (dt, progress) {
      var self = this, cx = W / 2, cy = H * 0.56, sr = H * 0.07;
      this.next -= dt; this.hurt = Math.max(0, this.hurt - dt * 2);
      if (this.next <= 0) {
        var a = rand(0, 6.28), R = Math.hypot(W, H) * 0.55, bad = Math.random() < 0.5;
        this.packets.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, bad: bad, word: pick(bad ? BAD : GOOD), sp: H * rand(0.16, 0.24) * (1 + progress) });
        this.next = 1.1 - 0.65 * progress;
      }
      this.packets = this.packets.filter(function (p) {
        var dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy);
        p.x += dx / d * p.sp * dt; p.y += dy / d * p.sp * dt;
        for (var i = 0; i < pts.length; i++) {
          var h = pts[i], r = H * 0.1 * (1 - 0.5 * h.grab);
          if (dist(p.x, p.y, h.palm[0], h.palm[1]) < r + H * 0.02) { add(p.bad ? 10 : -5, p.x, p.y - H * 0.04); return false; }
        }
        if (d < sr) {
          if (p.bad) { self.hp--; self.hurt = 1; pop(cx, cy - sr * 1.6, '-1 HP', '#ff6b8a'); combo = 1; }
          else add(2, cx, cy - sr * 1.6);
          return false;
        }
        return true;
      });
      if (this.hp <= 0) finish();
    },
    draw: function (ctx) {
      var cx = W / 2, cy = H * 0.56, sr = H * 0.07;
      ctx.save();
      ctx.shadowColor = this.hurt > 0 ? '#ff4a6a' : '#6fd8ff'; ctx.shadowBlur = H * 0.04;
      ctx.fillStyle = this.hurt > 0 ? '#5a1830' : '#10325e';
      rrect(ctx, cx - sr, cy - sr * 1.2, sr * 2, sr * 2.4, 10); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#7df9ff';
      for (var i = 0; i < 4; i++) ctx.fillRect(cx - sr * 0.7, cy - sr * 0.9 + i * sr * 0.55, sr * 1.4, sr * 0.12);
      for (var k = 0; k < 5; k++) { ctx.fillStyle = k < this.hp ? '#4dff9a' : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(cx - sr + k * sr * 0.5, cy + sr * 1.55, sr * 0.14, 0, 6.283); ctx.fill(); }
      ctx.restore();
      label(ctx, 'SERVER', cx, cy - sr * 1.45, H * 0.022, 800, '#bfe8ff');
      this.packets.forEach(function (p) {
        ctx.font = U.font(H * 0.024, 800);
        var tw = ctx.measureText(p.word).width + 20;
        ctx.fillStyle = p.bad ? 'rgba(255,70,100,0.9)' : 'rgba(60,220,140,0.9)';
        rrect(ctx, p.x - tw / 2, p.y - H * 0.022, tw, H * 0.044, H * 0.022); ctx.fill();
        label(ctx, p.word, p.x, p.y, H * 0.024, 800, '#fff');
      });
      pts.forEach(function (h) {
        var r = H * 0.1 * (1 - 0.5 * h.grab);
        ctx.fillStyle = 'rgba(125,249,255,0.15)'; ctx.strokeStyle = 'rgba(125,249,255,0.9)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(h.palm[0], h.palm[1], r, 0, 6.283); ctx.fill(); ctx.stroke();
      });
    },
    icon: function (ctx, x, y, s) {
      ctx.fillStyle = '#10325e'; ctx.strokeStyle = '#7df9ff'; ctx.lineWidth = s * 0.04;
      rrect(ctx, x - s * 0.18, y - s * 0.25, s * 0.36, s * 0.5, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff4a6a'; ctx.beginPath(); ctx.arc(x - s * 0.45, y - s * 0.2, s * 0.08, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#4dff9a'; ctx.beginPath(); ctx.arc(x + s * 0.45, y + s * 0.2, s * 0.08, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#7df9ff'; ctx.beginPath(); ctx.arc(x - s * 0.32, y - s * 0.1, s * 0.14, 0, 6.283); ctx.stroke();
    },
  };

  // ---------------------------------------------------------------- Token Duel
  var AI_WORDS = ['HALLUCINATE', 'IGNORE PREVIOUS', 'LOREM IPSUM', 'AS AN AI', 'TOKEN LIMIT', '404', 'OVERFIT', 'UNDEFINED', 'NaN', 'SPAM'];
  var tokenDuel = {
    key: 'duel', name: 'TOKEN DUEL', rule: 'Swipe up to fire words at the AI. Fist-catch its tokens to reload.',
    start: function () {
      this.aiHp = 12; this.hp = 5; this.ammo = 6; this.regen = 0; this.mine = []; this.theirs = []; this.next = 1.2;
      this.cool = 0; this.aiX = W / 2; this.hurt = 0; this.aiHurt = 0;
    },
    update: function (dt, progress) {
      var self = this, ay = H * 0.22, R = H * 0.085;
      this.aiX = W / 2 + Math.sin(t * (0.8 + progress)) * W * 0.3;
      this.cool -= dt; this.hurt = Math.max(0, this.hurt - dt * 2); this.aiHurt = Math.max(0, this.aiHurt - dt * 2);
      this.regen += dt; if (this.regen > 2 && this.ammo < 8) { this.ammo++; this.regen = 0; }
      // Player fires with a quick upward swipe (hand moving toward the screen).
      pts.forEach(function (h) {
        if (h.vel[1] < -H * 0.9 && self.cool <= 0 && self.ammo > 0 && h.palm[1] > H * 0.45) {
          self.ammo--; self.cool = 0.35;
          self.mine.push({ x: h.palm[0], y: h.palm[1], vx: h.vel[0] * 0.25, word: pick(U.words()) });
        }
      });
      this.next -= dt;
      if (this.next <= 0) {
        var tx = rand(0.1, 0.9) * W, sp = H * (0.22 + 0.2 * progress);
        var dx = tx - this.aiX, dy = H * 0.95 - ay, d = Math.hypot(dx, dy);
        this.theirs.push({ x: this.aiX, y: ay + R, vx: dx / d * sp, vy: dy / d * sp, word: pick(AI_WORDS) });
        this.next = 1.6 - 1.0 * progress;
      }
      this.mine = this.mine.filter(function (m) {
        m.y -= H * 0.9 * dt; m.x += m.vx * dt;
        if (dist(m.x, m.y, self.aiX, ay) < R * 1.3) {
          self.aiHp--; self.aiHurt = 1; add(15, self.aiX, ay - R * 1.4);
          if (self.aiHp <= 0) { add(200, self.aiX, ay); finish(); }
          return false;
        }
        return m.y > -50;
      });
      this.theirs = this.theirs.filter(function (e) {
        e.x += e.vx * dt; e.y += e.vy * dt;
        for (var i = 0; i < pts.length; i++) {
          var h = pts[i];
          if (h.grab > 0.7 && dist(e.x, e.y, h.palm[0], h.palm[1]) < H * 0.09) {
            add(5, e.x, e.y - H * 0.04); self.ammo = Math.min(10, self.ammo + 1); return false;
          }
        }
        if (e.y > H * 0.97) { self.hp--; self.hurt = 1; combo = 1; pop(e.x, H * 0.9, '-1 HP', '#ff6b8a'); return false; }
        return true;
      });
      if (this.hp <= 0) finish();
    },
    draw: function (ctx) {
      var self = this, ay = H * 0.22, R = H * 0.085;
      ctx.save();
      ctx.strokeStyle = 'rgba(180,220,255,0.25)'; ctx.setLineDash([12, 12]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke(); ctx.setLineDash([]);
      // AI core with a dot face.
      ctx.shadowColor = this.aiHurt > 0 ? '#ff4a6a' : '#b388ff'; ctx.shadowBlur = H * 0.05;
      ctx.fillStyle = this.aiHurt > 0 ? '#4a1030' : '#1c0d44';
      ctx.beginPath(); ctx.arc(this.aiX, ay, R, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#d7c4ff';
      for (var e = -1; e <= 1; e += 2) for (var i = 0; i < 6; i++) {
        var a = i / 6 * 6.283; ctx.beginPath(); ctx.arc(this.aiX + e * R * 0.38 + Math.cos(a) * R * 0.12, ay - R * 0.2 + Math.sin(a) * R * 0.12 * (0.6 + 0.4 * Math.sin(t * 3)), R * 0.035, 0, 6.283); ctx.fill();
      }
      for (var k = 0; k < 9; k++) {
        var mx = this.aiX - R * 0.45 + k * R * 0.1125, my = ay + R * 0.35 + Math.sin(k / 8 * Math.PI) * R * 0.15 * (this.aiHurt > 0 ? -1 : 1);
        ctx.beginPath(); ctx.arc(mx, my, R * 0.03, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(this.aiX - R, ay - R * 1.45, R * 2, R * 0.14);
      ctx.fillStyle = '#b388ff'; ctx.fillRect(this.aiX - R, ay - R * 1.45, R * 2 * Math.max(0, this.aiHp) / 12, R * 0.14);
      ctx.restore();
      label(ctx, 'AI', this.aiX, ay + R * 1.35, H * 0.022, 900, '#d7c4ff');
      this.theirs.forEach(function (e) { label(ctx, e.word, e.x, e.y, H * 0.026, 800, '#ff8fb0'); });
      ctx.save(); ctx.fillStyle = U.gradient(ctx, 0, 0, W, H);
      this.mine.forEach(function (m) { ctx.font = U.font(H * 0.03, 900); ctx.textAlign = 'center'; ctx.fillText(m.word, m.x, m.y); });
      ctx.restore();
      for (var j = 0; j < 5; j++) label(ctx, '♥', W * 0.04 + j * H * 0.045, H * 0.94, H * 0.04, 900, j < this.hp ? (this.hurt > 0 ? '#ff4a6a' : '#ff8fb0') : 'rgba(255,255,255,0.2)', 'left');
      label(ctx, 'AMMO ' + this.ammo, W * 0.96, H * 0.94, H * 0.032, 900, '#7df9ff', 'right');
    },
    icon: function (ctx, x, y, s) {
      ctx.fillStyle = '#b388ff'; ctx.beginPath(); ctx.arc(x, y - s * 0.22, s * 0.2, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#7df9ff'; ctx.fillRect(x - s * 0.04, y + s * 0.05, s * 0.08, s * 0.3);
      ctx.beginPath(); ctx.moveTo(x - s * 0.12, y + s * 0.1); ctx.lineTo(x, y - s * 0.02); ctx.lineTo(x + s * 0.12, y + s * 0.1); ctx.fill();
    },
  };

  var GAMES = [bugCatcher, wordSort, packetDefender, tokenDuel];

  // ---------------------------------------------------------------- flow
  function go(s) { state = s; stateT = 0; dwell = 0; dwellIdx = -1; openHold = 0; }
  function begin(i) { sel = i; game = GAMES[i]; go('intro'); }
  function tierFor(s) {
    var tiers = cfg().tiers.slice().sort(function (a, b) { return a.min - b.min; }), got = null;
    tiers.forEach(function (tr) { if (s >= tr.min) got = tr; });
    return got;
  }
  function code(tier, s) {
    var n = WH.gamesLog.count() + 1, str = cfg().salt + '|' + new Date().toISOString().slice(0, 10) + '|' + n + '|' + s + '|' + Date.now();
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', c = '';
    for (var k = 0; k < 4; k++) { c += A[h & 31]; h >>>= 5; }
    return tier.name.charAt(0).toUpperCase() + '-' + c;
  }
  function finish(forceReal) {
    if (state !== 'play') return;
    var tier = tierFor(score), real = sawReal || forceReal === true;
    result = { score: score, tier: tier, code: null, best: WH.gamesLog.setBest(game.key, score) };
    if (tier && real) {
      result.code = code(tier, score);
      WH.gamesLog.add({ time: new Date().toISOString(), game: game.key, score: score, tier: tier.name, code: result.code });
    }
    result.demo = !real;
    go('result');
  }

  addEventListener('keydown', function (e) {
    if (WH.config.mode !== 'games' && new URLSearchParams(location.search).get('mode') !== 'games') return;
    if (WH.menu && WH.menu.isOpen()) return;
    lastActivity = t;
    if (state === 'select') {
      if (e.key >= '1' && e.key <= '4') begin(+e.key - 1);
      else if (e.key === 'ArrowRight') sel = (sel + 1) % 4;
      else if (e.key === 'ArrowLeft') sel = (sel + 3) % 4;
      else if (e.key === 'Enter') begin(sel);
    } else if (e.key === 'Backspace') go('select');
    else if (state === 'result' && e.key === 'Enter') go('select');
  });

  function tiles() {
    var n = GAMES.length, gap = W * 0.025, tw = Math.min((W - gap * (n + 1)) / n, H * 0.5), x0 = (W - (tw * n + gap * (n - 1))) / 2;
    return GAMES.map(function (g, i) { return { x: x0 + i * (tw + gap), y: H * 0.3, w: tw, h: H * 0.48 }; });
  }

  U.register('games', 'Games: minigames with prizes', {
    fullField: true, noSetSwitch: true, ownHint: true,
    resize: function (w, h) { W = w; H = h; if (state !== 'select' && game && state === 'play') game.start(); },
    update: function (hands, dt, demo) {
      if (WH.menu && WH.menu.isOpen()) return; // paused while the settings screen is open
      t += dt; stateT += dt; demoNow = demo;
      pts = demo ? [] : U.points(hands, W, H);
      if (pts.length) { lastActivity = t; if (state === 'play') sawReal = true; }
      pops = pops.filter(function (p) { p.y -= H * 0.06 * dt; p.life -= dt * 0.9; return p.life > 0; });
      if ((state === 'play' || state === 'result' || state === 'intro') && t - lastActivity > 20) { go('select'); return; }

      if (state === 'select') {
        var hit = -1, c = pts[0];
        if (c) tiles().forEach(function (r, i) { if (c.palm[0] > r.x && c.palm[0] < r.x + r.w && c.palm[1] > r.y && c.palm[1] < r.y + r.h) hit = i; });
        if (hit >= 0 && hit === dwellIdx) { dwell += dt; sel = hit; if (dwell > 1.5) begin(hit); }
        else { dwellIdx = hit; dwell = 0; }
      } else if (state === 'intro') {
        if (stateT > 3.5) { score = 0; combo = 1; timeLeft = cfg().roundSec; sawReal = false; grabPrev = {}; game.start(); go('play'); }
      } else if (state === 'play') {
        timeLeft -= dt;
        game.update(dt, Math.min(1, 1 - timeLeft / cfg().roundSec));
        if (timeLeft <= 0 && state === 'play') finish();
      } else if (state === 'result') {
        var open = pts.some(function (h) { return h.open > 0.8; });
        openHold = open && stateT > 3 ? openHold + dt : 0;
        if (stateT > 12 || openHold > 1.5) go('select');
      }
    },
    draw: function (ctx, hands, now) {
      ctx.save();
      ctx.fillStyle = 'rgba(3,12,34,0.45)'; ctx.fillRect(0, 0, W, H); // calm the sky behind the game

      if (state === 'select') {
        label(ctx, 'PLAY & WIN', W / 2, H * 0.12, H * 0.08, 900, U.gradient(ctx, W * 0.25, 0, W * 0.75, 0));
        label(ctx, 'Hover a game with your hand, or press 1-4', W / 2, H * 0.21, H * 0.03, 600, '#cfe6ff');
        tiles().forEach(function (r, i) {
          var g = GAMES[i], on = i === sel;
          ctx.fillStyle = on ? 'rgba(30,70,140,0.75)' : 'rgba(10,30,70,0.6)';
          ctx.strokeStyle = on ? '#7df9ff' : 'rgba(125,249,255,0.35)'; ctx.lineWidth = on ? 4 : 2;
          rrect(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill(); ctx.stroke();
          label(ctx, String(i + 1), r.x + r.w * 0.09, r.y + r.w * 0.09, r.w * 0.07, 900, 'rgba(255,255,255,0.5)');
          g.icon(ctx, r.x + r.w / 2, r.y + r.h * 0.3, r.w * 0.4);
          label(ctx, g.name, r.x + r.w / 2, r.y + r.h * 0.6, r.w * 0.075, 900, '#fff');
          wrap(ctx, g.rule, r.x + r.w / 2, r.y + r.h * 0.72, r.w * 0.85, r.w * 0.045);
          var best = WH.gamesLog.best(g.key);
          label(ctx, best ? "Today's best: " + best : 'No score yet today', r.x + r.w / 2, r.y + r.h * 0.92, r.w * 0.045, 700, '#ffd24a');
          if (i === dwellIdx && dwell > 0) {
            ctx.strokeStyle = '#7df9ff'; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h * 0.3, r.w * 0.32, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.min(1, dwell / 1.5)); ctx.stroke();
          }
        });
        if (demoNow) {
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 0.004);
          label(ctx, 'HOLD YOUR HAND UP TO PLAY', W / 2, H * 0.88, H * 0.04, 900, '#fff');
          ctx.globalAlpha = 1;
        }
      } else if (state === 'intro') {
        label(ctx, game.name, W / 2, H * 0.3, H * 0.09, 900, U.gradient(ctx, W * 0.2, 0, W * 0.8, 0));
        wrap(ctx, game.rule, W / 2, H * 0.43, W * 0.6, H * 0.04);
        var n = Math.ceil(3.5 - stateT);
        label(ctx, n > 0 ? String(n) : 'GO!', W / 2, H * 0.66, H * 0.2, 900, '#fff');
      } else if (state === 'play') {
        game.draw(ctx);
        // HUD: score, time bar, combo.
        label(ctx, 'SCORE ' + score, W * 0.03, H * 0.06, H * 0.045, 900, '#fff', 'left');
        label(ctx, 'x' + Math.floor(combo), W * 0.97, H * 0.06, H * 0.045, 900, Math.floor(combo) > 1 ? '#ffd24a' : 'rgba(255,255,255,0.5)', 'right');
        var f = Math.max(0, timeLeft / cfg().roundSec);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; rrect(ctx, W * 0.3, H * 0.045, W * 0.4, H * 0.03, H * 0.015); ctx.fill();
        ctx.fillStyle = f < 0.2 ? '#ff6b8a' : U.gradient(ctx, W * 0.3, 0, W * 0.7, 0);
        rrect(ctx, W * 0.3, H * 0.045, Math.max(H * 0.03, W * 0.4 * f), H * 0.03, H * 0.015); ctx.fill();
        label(ctx, game.name, W / 2, H * 0.105, H * 0.022, 800, 'rgba(255,255,255,0.6)');
      } else if (state === 'result') {
        label(ctx, 'SCORE', W / 2, H * 0.14, H * 0.04, 800, '#cfe6ff');
        label(ctx, String(result.score), W / 2, H * 0.27, H * 0.16, 900, U.gradient(ctx, W * 0.3, 0, W * 0.7, 0));
        if (result.best) label(ctx, "NEW BEST TODAY!", W / 2, H * 0.38, H * 0.035, 900, '#ffd24a');
        if (result.tier) {
          label(ctx, result.tier.name.toUpperCase() + ' TIER', W / 2, H * 0.48, H * 0.055, 900, '#fff');
          if (result.code) {
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; rrect(ctx, W / 2 - H * 0.3, H * 0.56, H * 0.6, H * 0.16, 18); ctx.fill();
            label(ctx, result.code, W / 2, H * 0.64, H * 0.1, 900, '#0a1f4a');
            label(ctx, 'Show this code • ' + cfg().prizeText, W / 2, H * 0.79, H * 0.032, 700, '#cfe6ff');
          } else label(ctx, 'Practice round (no hands detected), no code', W / 2, H * 0.62, H * 0.032, 700, '#cfe6ff');
        } else {
          label(ctx, 'TRY AGAIN!', W / 2, H * 0.5, H * 0.07, 900, '#fff');
          label(ctx, (cfg().tiers[0] ? cfg().tiers[0].min : 0) + ' points wins a gift', W / 2, H * 0.6, H * 0.035, 700, '#cfe6ff');
        }
        label(ctx, 'Hold an open hand or press Enter to continue', W / 2, H * 0.9, H * 0.028, 600, 'rgba(255,255,255,0.7)');
      }

      pops.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); label(ctx, p.text, p.x, p.y, H * 0.04, 900, p.color); });
      ctx.globalAlpha = 1;
      // Hand cursors.
      pts.forEach(function (h) {
        ctx.strokeStyle = h.grab > WH.config.grabThreshold ? '#ffd24a' : '#7df9ff'; ctx.lineWidth = 4;
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(h.palm[0], h.palm[1], H * 0.03 * (1 - 0.4 * h.grab), 0, 6.283); ctx.stroke();
        ctx.shadowBlur = 0;
      });
      ctx.restore();
    },
  });

  function wrap(ctx, text, x, y, maxW, px) {
    ctx.font = U.font(px, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#cfe6ff';
    var words = text.split(' '), line = '', ly = y;
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, ly); line = w; ly += px * 1.3; } else line = test;
    });
    if (line) ctx.fillText(line, x, ly);
  }

  // Test hooks (used by automated checks; harmless in production).
  WH.games = {
    state: function () { return state; },
    _finish: function (s) { if (state !== 'play') { score = 0; game = game || GAMES[0]; timeLeft = 1; go('play'); } score = s; finish(true); return result; },
  };
})();
