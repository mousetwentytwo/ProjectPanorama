# Plan: "Word Hands" installation (Leap LM-010, browser, Windows)

## Context
The repo is empty. Goal: a full-screen browser installation for a big screen. It shows a blue-tinted sky background with drifting IT-sector words. The hands a visitor holds over a podium-mounted LM-010 appear as large outlines, filled with scrolling IT words, to impress people walking by.
The LM-010 tracks hands only (10-80 cm), so the plan uses hand outlines, not body outlines (as you confirmed).

## Hardware and driver (Windows, older device)
- Install the **Leap Motion Orion 4.1.0 SDK** (the last one with a built-in WebSocket server at `ws://127.0.0.1:6437`, JSON protocol v6). It works with the LM-010 on Windows 10/11.
- In the Leap Control Panel, turn on "Allow Web Apps".
- Client library: none. `src/leap.js` is a small dependency-free v6 WebSocket client (it replaces leapjs and works offline).
- Fallback if only the Gemini v5 service is installed: Ultraleap's `UltraleapTrackingWebSocket` bridge, which uses the same port and protocol. This goes in the README only.

```
[LM-010] --USB--> [Leap Service 4.1] --ws:6437 JSON--> [Chrome kiosk: index.html]
                                                          |- sky.js    (gradient + clouds + bg words)
                                                          |- hands.js  (frame -> 2D hand outline)
                                                          '- fill.js   (words clipped to outline, scrolling)
```

## Files
- `index.html`: the full-screen canvas, which loads the modules.
- `src/config.js`: the word list (Cloud, DevOps, AI, Kubernetes, API, Cybersecurity, Data, Edge, 5G, Blockchain, Microservices, ...), colors, speeds, and the mapping bounds of the interaction box.
- `src/sky.js`: a vertical blue gradient, slow noise-based clouds, and faint word "stars" drifting in parallax.
- `src/leap.js`: connects to leapjs, reconnects on its own, and turns `frame.hands` into screen coordinates using `interactionBox.normalizePoint` (x/y, with z used for scale). It also publishes a connection status.
- `src/hands.js`: builds a hand outline from the palm, finger bones (`carpPosition`...`dipPosition`, tips) and thick rounded strokes, drawn to an offscreen mask canvas at 2-3x size.
- `src/fill.js`: rows of words scroll horizontally in alternating directions through the mask (`globalCompositeOperation = 'source-in'`). Words get brighter, speed up with hand velocity, and a pinch or grab swaps the word set. Hands have a glow edge and fade in and out.
- `src/demo.js`: attract mode. With no hands for more than 5 s, or no Leap connected, a synthetic animated hand plays so the screen is never empty.
- `README.md`: Windows setup, Chrome kiosk launch (`chrome --kiosk --app=file:///.../index.html`, or `npx serve`), and settings (`?debug=1` shows FPS and the raw skeleton).
- `todo/word-hands.md`: a copy of this plan as a checklist (your convention). Also `tasks/caveman-lessons.md` with the lesson "LM-010 = hands only; web needs Orion 4.x".

## Verification
1. Without hardware: open `index.html` in Chromium and check that demo mode renders. Take a Playwright screenshot at 1920x1080 and 3840x2160 and check that the FPS stays at 55 or higher.
2. With a mocked WebSocket: a small Node script (`tools/mock-leap.js`) serves recorded v6 frames on port 6437, and the tracked outline follows them.
3. On site, on Windows: Orion 4.1 plus the LM-010 facing up on the podium. Check hand latency, that two hands work at once, and that the page reconnects after unplugging the sensor.

Then commit and push to `claude/exciting-mccarthy-206iss`.

## Status
- [x] sky, leap client, silhouettes, word fill, demo mode, README, mock sensor
- [x] Headless Chromium: demo + mock-sensor modes render, no page errors (FPS there ~25 is software rendering, not representative)
- [ ] On-site: FPS >= 55 on the target PC at the screen resolution
- [ ] On-site: Orion 4.1 + LM-010 latency, two hands, reconnect after unplug
- [ ] On-site: tune `box` / `handScale` for the podium height
- [x] Denser text, gradient text, settings menu (C key) for word sets/density/speed/colors, AI-summit vocabulary (5 sets, ~170 terms)
- [x] Display modes: hands, rain, burst, constellation, ripple, puppet (menu select, `?mode=` override); fill.js refactored into util.js + modes/hands.js
- [ ] On-site: check each mode with a real LM-010 (especially the puppet arm mapping and the rain push/pull radius)
- [x] Wave mode: fluid purple/cyan dot plane + scrolling banners, tunable in menu (height, length, speed, choppiness, density, banners, colors)
- [x] Settings screen opens at startup (`?kiosk=1` skips it); Esc / Space / C open it
- [x] Games mode: Bug Catcher, Word Sort, Packet Defender, Token Duel; hand-dwell/keyboard selection; prize tiers + claim codes + claims log in menu
- [ ] On-site: tune tier thresholds after a few real test rounds per game (scores differ between games); check swipe-up threshold in Token Duel
