// Claims log and today's best scores for the games mode, kept in this browser's localStorage.
(function () {
  var CLAIMS = 'wordhands.claims.v1', BEST = 'wordhands.best.v1';
  function read(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function today() { return new Date().toISOString().slice(0, 10); }

  WH.gamesLog = {
    add: function (entry) { var l = read(CLAIMS, []); l.push(entry); write(CLAIMS, l.slice(-1000)); },
    list: function () { return read(CLAIMS, []); },
    clear: function () { write(CLAIMS, []); },
    count: function () { return read(CLAIMS, []).length; },
    best: function (game) { var b = read(BEST, {}); return b.day === today() ? (b[game] || 0) : 0; },
    setBest: function (game, score) {
      var b = read(BEST, {}); if (b.day !== today()) b = { day: today() };
      if (score > (b[game] || 0)) { b[game] = score; write(BEST, b); return true; }
      return false;
    },
    csv: function () {
      return 'time,game,score,tier,code\n' + read(CLAIMS, []).map(function (e) {
        return [e.time, e.game, e.score, e.tier, e.code].join(',');
      }).join('\n');
    },
  };
})();
