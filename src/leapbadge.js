// Corner badge shown while no Leap sensor is connected (hidden with ?kiosk=1): mouse/touch play,
// plus driver links. Browsers reach the sensor at ws://127.0.0.1:6437 (Orion 4.1 on Windows, V2 2.3.1 on Intel Macs).
(function () {
  if (new URLSearchParams(location.search).get('kiosk') === '1') return;
  var S3 = 'https://s3.eu-west-1.amazonaws.com/downloads.ultraleap.com/software/tracking-software/';
  var css = document.createElement('style');
  css.textContent =
    '#lpb{position:fixed;left:12px;top:12px;z-index:8;max-width:min(320px,calc(100vw - 24px));box-sizing:border-box;cursor:default;' +
    'background:rgba(6,21,48,.85);color:#dbeaff;border:1px solid #2e5a9a;border-radius:10px;padding:8px 12px;font:13px/1.4 system-ui,Segoe UI,sans-serif}' +
    '#lpb summary{cursor:pointer;font-weight:700;color:#9fc4ff}#lpb a{color:#7df9ff}#lpb ul{margin:6px 0;padding-left:18px}#lpb small{color:#8fb0da}';
  document.head.appendChild(css);
  var d = document.createElement('details');
  d.id = 'lpb';
  d.innerHTML = '<summary>Playing with the mouse. Have a Leap Motion?</summary>' +
    '<ul><li>Windows: <a href="' + S3 + '4.1.0/tracking-software-windows-4.1.0.zip">Leap Motion Orion 4.1.0</a></li>' +
    '<li>Mac (Intel): <a href="' + S3 + '2.3.1/tracking-software-macos-2.3.1.img">Leap Motion V2 2.3.1</a></li>' +
    '<li><a href="https://www.ultraleap.com/downloads/leap-controller" target="_blank" rel="noopener">All Ultraleap downloads</a></li></ul>' +
    '<small>Install, plug in the sensor, then in the Leap Control Panel tick <b>Allow Web Apps</b> and reload this page. ' +
    'Apple Silicon Macs have no driver with browser support, so use the mouse there. Mouse: move = shield, press = fist.</small>';
  addEventListener('load', function () { document.body.appendChild(d); });
  setInterval(function () { d.style.display = WH.leap.connected() ? 'none' : ''; }, 1000);
})();
