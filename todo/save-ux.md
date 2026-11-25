# SAVE UX: Packet Defender variant, web deploy, hub entry

## Context
Packet Defender (`ProjectPanorama/src/modes/games.js:142-203`) protects a "SERVER" from red/green packets.
The new variant, SAVE UX, protects a PRODUCT image from bad UX practices and lets good ones through. It must also:
- let you swap the centre image by uploading one
- work on a portrait screen
- open game select quickly with Space
- go public as `leapgames.twentytwosoftware.com` (port 10486), with the same deploy setup as gamemap, and get a hub card.

Leap is the preferred input. Without a sensor, the mouse or touch drives the game, and a corner badge links to the driver download.

```
games.js
 ├─ makeDefender(opts)  <- extracted from packetDefender (shared logic)
 │    ├─ packetDefender = makeDefender({SERVER, GOOD/BAD packets, server box drawn})
 │    └─ saveUx        = makeDefender({PRODUCT, JO/ROSSZ words, image or box drawn})
 └─ GAMES = [bug, sort, packets, duel, saveUx]  keys 1-5, ?game=saveux

input:  leap.hands() ──┐
        pointer.js  ───┴─> main.js picks live source -> modes (same hand shape: palm, grab, open, vel)
```

## Steps (ProjectPanorama, branch `ccr-2167a4c1-vq44qn`)
1. **Refactor**: replace `packetDefender` with a `makeDefender({key,name,rule,label,good,bad,drawCore})` factory. Packet Defender's behaviour stays exactly the same.
2. **SAVE UX game**: key `saveux`, title `SAVE UX`, label `PRODUCT`.
   - BAD: AI only, Inconsistency, Fix later, Design Overhead, No Testing, Experience Gap, Cognitive Overload, Use Papyrus, No user, More meetings, Meetings, Last minute change.
   - GOOD: Usability testing (typo "Usablility" fixed), WCAG, User Journey, Design System, Research, Affinity mapping, Prototyping, Validation, Ideation, Workshop, Iteration, Figma.
   - Pills get wider for the longer phrases. Scoring matches Packet Defender.
3. **Centre image**:
   - `drawCore` draws the uploaded image (fit inside a rounded box with a glow and red hurt tint). With no upload it falls back to a box drawn in code.
   - Upload by dragging an image file onto the window, or with a "Product image" file input + Reset in the settings menu (`src/menu.js`).
   - The image is downscaled to at most 512 px on a canvas and stored as a dataURL in localStorage under a separate key (`wordhands.saveux.img`), with try/catch.
4. **Portrait layout**:
   - In `games.js`, use `S = Math.min(W,H)` for sizes that are now based on `H` (core radius, shield, pills).
   - Tiles: one row when landscape, a 2-3 column grid when `H > W`.
   - Spawn radius uses `hypot(W,H)` (already orientation-independent). The intro and result text wrap to `W*0.85`.
   - Check the other 4 games still fit in portrait (HUD positions).
5. **Space = quick game select**:
   - `menu.js:156`: Space no longer opens settings while the mode is games.
   - `games.js` keydown: Space goes to `select` from any state. Settings stay on C/Esc.
   - The README is updated to match.
6. **Mouse/touch fallback**: new `src/pointer.js`.
   - Pointer events become one synthetic hand in the same shape `U.points` / modes consume (check the shape in `leap.js`/`hands.js` and build it the same way).
   - Pressing becomes `grab=1`. Idle means `open=1`. Velocity comes from pointer deltas.
   - `main.js` uses Leap hands when present, otherwise pointer hands while the pointer was active in the last 5 s. Otherwise demo.
   - `cursor:none` becomes `cursor: auto` in pointer mode.
7. **Leap badge** (corner, shown when the sensor is offline and not `?kiosk=1`): "Leap Motion detected? Install the driver" with links:
   - Windows: Leap Motion Orion 4.1.0 (official Ultraleap/Leap download URL, checked during implementation)
   - Mac: Leap Motion V2 SDK/driver 2.3.1 (Orion has no macOS build; V2 serves the same ws://127.0.0.1:6437 v6). Link checked the same way.
   - Plus one line: "enable Allow Web Apps". If an official URL can't be confirmed, link Ultraleap's legacy downloads page and say so.
   - Note: an https page connecting to `ws://127.0.0.1` is allowed by Chrome (localhost is treated as secure). Test this.
8. **URL params**:
   - `?game=saveux` jumps straight into that game's intro in games mode.
   - The deploy's root redirect / link uses `?mode=games&kiosk=1&game=saveux`.
9. **Deploy** (copy of the gamemap `deploy/` tree, renamed):
   - `deploy/deploy.sh` (tars `index.html src`), `deploy/setup.sh`, `deploy/vps/setup-remote.sh`, `deploy/nginx/leapgames-tunnel.conf` (127.0.0.1:10486, root `/var/www/leapgames/current`, cache rule for `/src/`), `leapgames-headers.conf`, `deploy/README.md`.
   - nginx `location = /` serves index.html. Default mode for the web comes from the params in step 8: nginx `return 302 /?mode=games&game=saveux` when the query is empty.
10. Docs: README games table gets the 5th row, Space behaviour, pointer input, deploy. `tasks/caveman-lessons.md` gets the Orion has no Mac build note. `todo/save-ux.md` holds this plan.

## Hub (twentytwosoftwarehub, same branch)
- `sites.json`: add `leapgames` entry ("Leap Games / SAVE UX", url `https://leapgames.twentytwosoftware.com/`, repo ProjectPanorama, status live). Check the schema with `node scripts/check-data.mjs`.
- `deploy/README.md` port table: reserve 10486 for leapgames.

## Merge
Commit and push both branches. Open a PR into each default branch (ProjectPanorama: `claude/exciting-mccarthy-206iss`, hub: its default) and merge it via the GitHub MCP, as requested. The VPS deploy itself (`setup.sh`/`deploy.sh` + DNS route) needs your ssh access, so I won't run it. The README lists the commands.

## Verification
- Playwright (preinstalled chromium) on `index.html?mode=games&game=saveux&kiosk=1`:
  - 1920x1080 and 1080x1920 screenshots of select, intro and play
  - mouse moves the shield, a bad word is blocked (score rises)
  - Space returns to select, and C still opens the menu
  - image upload via `setInputFiles` and a synthetic drop event shows the image and survives a reload
  - no console errors
- Packet Defender regression: play screenshot is the same as before.
- `WH.games._finish` hook still works. `bash -n` on the deploy scripts, `nginx -t` if nginx is available. Hub `check-data.mjs` passes.
