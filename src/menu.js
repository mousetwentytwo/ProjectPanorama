// Config menu: opens on start (skip with ?kiosk=1). Press C, Esc or Space (or click the gear in the
// top-right corner, shown when the mouse moves) to open it again.
// Settings are stored in this browser's localStorage and applied on the next load.
(function () {
  var KEY = 'wordhands.config.v1';
  var EDITABLE = ['mode', 'wave', 'games', 'wordSets', 'rowHeightVh', 'bgWordCount', 'scrollSpeed', 'gradient'];
  var defaults = JSON.parse(JSON.stringify(WH.config));

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) EDITABLE.forEach(function (k) {
        if (saved[k] == null) return;
        // Objects merge over defaults so settings saved by older versions stay valid.
        WH.config[k] = (k === 'wave' || k === 'games') ? Object.assign({}, WH.config[k], saved[k]) : saved[k];
      });
    } catch (e) {}
  }
  function persist() {
    var o = {}; EDITABLE.forEach(function (k) { o[k] = WH.config[k]; });
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  load();

  // Text format: one word or phrase per line (commas also split); a blank line starts a new set.
  function setsToText(sets) { return sets.map(function (s) { return s.join('\n'); }).join('\n\n'); }
  function textToSets(t) {
    return t.split(/\n\s*\n/).map(function (block) {
      return block.split(/[\n,]/).map(function (w) { return w.trim(); }).filter(Boolean);
    }).filter(function (s) { return s.length; });
  }

  var css = document.createElement('style');
  css.textContent =
    '#whm{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(2,12,30,.6);cursor:default;z-index:10}' +
    '#whm.on{display:flex}' +
    '#whm .p{width:min(760px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:20px;' +
    'background:#0b1f3f;color:#dbeaff;border:1px solid #2e5a9a;border-radius:10px;font:14px/1.4 system-ui,Segoe UI,sans-serif}' +
    '#whm h3{margin:14px 0 2px;font-size:15px;color:#9fc4ff}#whm h2{margin:0 0 10px;font-size:18px}#whm .p>label{margin-bottom:10px}#whm small{color:#8fb0da}' +
    '#whm textarea{width:100%;height:42vh;box-sizing:border-box;margin:10px 0;background:#061530;color:#e8f3ff;border:1px solid #2e5a9a;border-radius:6px;padding:8px;font:13px/1.35 Consolas,monospace}' +
    '#whm .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 16px;margin:8px 0}' +
    '#whm select{background:#061530;color:#e8f3ff;border:1px solid #2e5a9a;border-radius:6px;padding:6px;font:inherit}' +
    '#whm input[type=text],#whm input[type=number],#whm input:not([type]){background:#061530;color:#e8f3ff;border:1px solid #2e5a9a;border-radius:6px;padding:5px;font:inherit}' +
    '#whm label{display:flex;flex-direction:column;gap:4px}#whm input[type=color]{width:40px;height:28px;border:0;background:none;padding:0}' +
    '#whm .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}' +
    '#whm button{background:#1c5fae;color:#fff;border:0;border-radius:6px;padding:8px 14px;font:inherit;cursor:pointer}' +
    '#whm button.s{background:#23385c}' +
    '#whg{position:fixed;top:12px;right:16px;font:22px system-ui;color:rgba(255,255,255,.6);cursor:pointer;opacity:0;transition:opacity .4s;z-index:9;background:none;border:0}';
  document.head.appendChild(css);

  var gear = document.createElement('button');
  gear.id = 'whg'; gear.title = 'Configure (C)'; gear.textContent = '⚙';
  var m = document.createElement('div');
  m.id = 'whm';
  m.innerHTML =
    '<div class="p"><h2>Word Hands settings</h2>' +
    '<label>Display mode <select id="whmode"></select></label>' +
    '<small>One word or phrase per line (commas also work). Leave a blank line between word sets. A fist switches sets.</small>' +
    '<textarea id="whw" spellcheck="false"></textarea>' +
    '<div class="g">' +
    '<label>Hand text density <input id="whd" type="range" min="0.014" max="0.06" step="0.002"></label>' +
    '<label>Background words <input id="whb" type="range" min="0" max="400" step="10"></label>' +
    '<label>Scroll speed <input id="whs" type="range" min="20" max="300" step="5"></label>' +
    '<label>Text gradient <span id="whc"></span></label>' +
    '</div><h3>Wave mode</h3><div class="g">' +
    '<label>Wave height <input id="wva" type="range" min="0" max="3" step="0.05"></label>' +
    '<label>Wave length <input id="wvl" type="range" min="0.3" max="3" step="0.05"></label>' +
    '<label>Wave speed <input id="wvs" type="range" min="0" max="3" step="0.05"></label>' +
    '<label>Choppiness <input id="wvc" type="range" min="0" max="1" step="0.05"></label>' +
    '<label>Dot density <input id="wvd" type="range" min="0.4" max="2" step="0.1"></label>' +
    '<label>Banners <input id="wvb" type="range" min="1" max="9" step="1"></label>' +
    '<label>Dot colors <span><input id="wvc0" type="color"> <input id="wvc1" type="color"></span></label>' +
    '</div><h3>Games mode</h3><div class="g">' +
    '<label>Round length (s) <input id="gmr" type="number" min="15" max="120"></label>' +
    '<label>Claim code salt <input id="gms" type="text"></label>' +
    '<label>Prize message <input id="gmp" type="text"></label>' +
    [0, 1, 2].map(function (i) {
      return '<label>Tier ' + (i + 1) + ' <span><input id="gtn' + i + '" size="7"> from <input id="gtm' + i + '" type="number" style="width:70px"> pts</span></label>';
    }).join('') +
    '</div><small>Claims log (<span id="gmc">0</span> entries, newest last). Staff can check codes here.</small>' +
    '<textarea id="gml" readonly style="height:14vh"></textarea>' +
    '<div class="row"><button class="s" id="gmcopy">Copy log as CSV</button><button class="s" id="gmclear">Clear log</button></div>' +
    '<div class="row">' +
    '<button id="whsave">Save &amp; apply</button><button class="s" id="whreset">Restore defaults</button>' +
    '<button class="s" id="whclose">Close</button></div></div>';
  document.body.appendChild(gear); document.body.appendChild(m);
  function $(id) { return document.getElementById(id); }

  function fill(cfg) {
    $('whmode').innerHTML = WH.modeList.map(function (md) {
      return '<option value="' + md.key + '"' + (md.key === cfg.mode ? ' selected' : '') + '>' + md.label + '</option>';
    }).join('');
    $('whw').value = setsToText(cfg.wordSets);
    var wv = cfg.wave;
    $('wva').value = wv.amplitude; $('wvl').value = wv.wavelength; $('wvs').value = wv.speed;
    $('wvc').value = wv.choppiness; $('wvd').value = wv.density; $('wvb').value = wv.banners;
    $('wvc0').value = wv.colors[0]; $('wvc1').value = wv.colors[1];
    var gm = cfg.games;
    $('gmr').value = gm.roundSec; $('gms').value = gm.salt;
    gm.tiers.forEach(function (tr, i) { $('gtn' + i).value = tr.name; $('gtm' + i).value = tr.min; });
    $('gmp').value = gm.prizeText;
    if (WH.gamesLog) { $('gml').value = WH.gamesLog.csv(); $('gmc').textContent = WH.gamesLog.count(); }
    // Slider is inverted so right = denser (smaller rows).
    $('whd').value = 0.074 - cfg.rowHeightVh;
    $('whb').value = cfg.bgWordCount; $('whs').value = cfg.scrollSpeed;
    $('whc').innerHTML = cfg.gradient.map(function (c) { return '<input type="color" value="' + c + '">'; }).join(' ');
  }
  function open() { fill(WH.config); m.classList.add('on'); document.body.style.cursor = 'default'; }
  function close() { m.classList.remove('on'); document.body.style.cursor = ''; }
  function apply(cfg) {
    EDITABLE.forEach(function (k) { WH.config[k] = cfg[k]; });
    persist();
    if (WH.onConfigChange) WH.onConfigChange();
  }

  $('whsave').onclick = function () {
    var sets = textToSets($('whw').value);
    if (!sets.length) { alert('Add at least one word.'); return; }
    apply({
      mode: $('whmode').value,
      games: Object.assign({}, WH.config.games, {
        prizeText: $('gmp').value || 'Ask at the booth for available gifts',
        roundSec: Math.max(15, Math.min(120, +$('gmr').value || 40)), salt: $('gms').value || 'change-me',
        tiers: [0, 1, 2].map(function (i) { return { name: $('gtn' + i).value, min: +$('gtm' + i).value }; })
          .sort(function (a, b) { return a.min - b.min; }),
      }),
      wave: { amplitude: +$('wva').value, wavelength: +$('wvl').value, speed: +$('wvs').value,
              choppiness: +$('wvc').value, density: +$('wvd').value, banners: +$('wvb').value,
              colors: [$('wvc0').value, $('wvc1').value] },
      wordSets: sets,
      rowHeightVh: +(0.074 - $('whd').value).toFixed(3),
      bgWordCount: +$('whb').value, scrollSpeed: +$('whs').value,
      gradient: [].map.call($('whc').querySelectorAll('input'), function (i) { return i.value; }),
    });
    close();
  };
  $('whreset').onclick = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    fill(defaults);
  };
  $('whclose').onclick = close;
  $('gmcopy').onclick = function () {
    var ta = $('gml'); ta.value = WH.gamesLog.csv(); ta.select();
    try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); }
  };
  $('gmclear').onclick = function () {
    if (confirm('Delete all claim codes from this PC?')) { WH.gamesLog.clear(); $('gml').value = WH.gamesLog.csv(); $('gmc').textContent = 0; }
  };
  gear.onclick = open;
  m.onclick = function (e) { if (e.target === m) close(); };

  addEventListener('keydown', function (e) {
    if (m.classList.contains('on')) { if (e.key === 'Escape') close(); return; }
    if (e.key === 'c' || e.key === 'C' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); open(); }
  });
  var hideT;
  addEventListener('mousemove', function () {
    gear.style.opacity = 1; clearTimeout(hideT);
    hideT = setTimeout(function () { gear.style.opacity = 0; }, 2500);
  });

  WH.menu = { open: open, close: close, isOpen: function () { return m.classList.contains('on'); } };
  // Open on start once all modes are registered, unless running unattended.
  if (new URLSearchParams(location.search).get('kiosk') !== '1') addEventListener('load', open);
})();
