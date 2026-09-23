// Config menu: press C (or click the gear in the top-right corner, shown when the mouse moves).
// Settings are stored in this browser's localStorage and applied on the next load.
(function () {
  var KEY = 'wordhands.config.v1';
  var EDITABLE = ['wordSets', 'rowHeightVh', 'bgWordCount', 'scrollSpeed', 'gradient'];
  var defaults = JSON.parse(JSON.stringify(WH.config));

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) EDITABLE.forEach(function (k) { if (saved[k] != null) WH.config[k] = saved[k]; });
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
    '#whm h2{margin:0 0 4px;font-size:18px}#whm small{color:#8fb0da}' +
    '#whm textarea{width:100%;height:42vh;box-sizing:border-box;margin:10px 0;background:#061530;color:#e8f3ff;border:1px solid #2e5a9a;border-radius:6px;padding:8px;font:13px/1.35 Consolas,monospace}' +
    '#whm .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 16px;margin:8px 0}' +
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
    '<small>One word or phrase per line (commas also work). Leave a blank line between word sets. A fist switches sets.</small>' +
    '<textarea id="whw" spellcheck="false"></textarea>' +
    '<div class="g">' +
    '<label>Hand text density <input id="whd" type="range" min="0.014" max="0.06" step="0.002"></label>' +
    '<label>Background words <input id="whb" type="range" min="0" max="400" step="10"></label>' +
    '<label>Scroll speed <input id="whs" type="range" min="20" max="300" step="5"></label>' +
    '<label>Text gradient <span id="whc"></span></label>' +
    '</div><div class="row">' +
    '<button id="whsave">Save &amp; apply</button><button class="s" id="whreset">Restore defaults</button>' +
    '<button class="s" id="whclose">Close</button></div></div>';
  document.body.appendChild(gear); document.body.appendChild(m);
  function $(id) { return document.getElementById(id); }

  function fill(cfg) {
    $('whw').value = setsToText(cfg.wordSets);
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
  gear.onclick = open;
  m.onclick = function (e) { if (e.target === m) close(); };

  addEventListener('keydown', function (e) {
    if (m.classList.contains('on')) { if (e.key === 'Escape') close(); return; }
    if (e.key === 'c' || e.key === 'C') open();
  });
  var hideT;
  addEventListener('mousemove', function () {
    gear.style.opacity = 1; clearTimeout(hideT);
    hideT = setTimeout(function () { gear.style.opacity = 0; }, 2500);
  });

  WH.menu = { open: open, close: close };
})();
