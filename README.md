# Word Hands

A full-screen interactive installation. A blue sky full of drifting IT words. Visitors hold their hands over a
Leap Motion LM-010 on a podium, and their hands appear on the big screen as glowing silhouettes
filled with scrolling IT-sector words.

```
[LM-010, facing up on podium] --USB--> [Leap Service (Orion 4.1)] --ws://127.0.0.1:6437/v6.json-->
    [Chrome kiosk: index.html] --HDMI--> [big screen]
```

- **Hands only.** The LM-010 tracks hands 10-80 cm above the sensor. It cannot see bodies or people
  standing in front of the screen.
- **Top view.** The screen shows the hands as seen from above. Fingers pointing toward the screen point up. A hand held lower
  (closer to the sensor) looks bigger.
- **Interaction.** Moving faster scrolls the words faster. A fist (grab) switches the word set (AI, software
  engineering, security, data and emerging tech, languages and tools) with a flash. A pinch brightens the words.
- **Look.** Dense rows of gradient-colored words scroll through the hands. The gradient flows over time.
  Background words use the same gradient palette.
- **Attract mode.** With no hands for 5 s, or no sensor, animated demo hands play with the hint text.

## Windows setup

1. Install **Leap Motion Orion 4.1.0** (Windows). It is the last release with the built-in WebSocket server
   needed by browsers. Newer Ultraleap Gemini (v5+) has no WebSocket. If only Gemini is available, run
   Ultraleap's `UltraleapTrackingWebSocket` bridge, which serves the same port and protocol.
2. Leap Control Panel -> General -> check **Allow Web Apps** (and "Allow Background Apps").
3. Plug in the LM-010 with the green LED facing the visitor, lens facing up.
4. Launch:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --app="file:///C:/WordHands/index.html?kiosk=1"
   ```
   `?kiosk=1` skips the settings screen at startup, so an unattended reboot goes straight to the display. Leave it
   off if an operator starts the show. For autostart, put that shortcut in `shell:startup`. Disable Windows sleep and screen saver.

No build step and no internet access needed. The page is plain HTML with classic scripts, so it works from `file://`.

## Display modes

Pick one in the settings menu ("Display mode"). For a quick test, add `?mode=<key>` to the URL (this page load only).
Every mode uses the same hand tracking, word sets, gradient and demo hands. A fist switches the word set in every mode.

| Key | Mode | What visitors see |
|-----|------|-------------------|
| `hands` | Hands | Hand silhouettes filled with scrolling word rows (default) |
| `rain` | Word rain / swarm | Falling words. An open hand pushes them away, a fist pulls them in like a magnet |
| `burst` | Word cloud burst | A centre word cloud. An open hand blasts it apart, a closed hand re-forms it with a new headline |
| `constellation` | Constellation | Fingertips and palms become glowing nodes in a neural mesh with word labels. Fast moves shed word sparks |
| `ripple` | Ripple / wave field | A full-screen word field. Hands send rings that swell, brighten and swap words |
| `wave` | Wave | A purple/cyan dot plane moving like a fluid surface, with word banners scrolling left and right and bobbing on the waves. Hands drop ripples; a fist makes a big splash |
| `games` | Games | Minigames with a score, prize tiers and claim codes (see below) |
| `puppet` | Word puppet | A full-body figure filled with words. Its arms follow the tracked hands, and with no hands it idles and waves. The LM-010 cannot see bodies, so it is hand-driven |

## Games mode (play & win)

A selection screen shows 4 games. Choose one by holding your hand over a tile for 1.5 s, or with keys **1-4**
(or arrows + Enter). Each round lasts 40 s (set in the menu), then the result screen shows the score, the prize tier and a claim code.

| Game | How to play | Points |
|------|-------------|--------|
| Bug Catcher | Make a fist on a crawling bug to squash it | bug +10, gold "critical bug" +50, green "feature" -20 |
| Word Sort | Push falling words into the right bucket (AI / Software / Security = word sets 1-3) | right +10, wrong -5 |
| Packet Defender | Your palm is a shield around the server: block red packets, let green through | red blocked +10, green blocked -5, green delivered +2; 5 red hits end the round |
| Token Duel | Swipe your hand up (toward the screen) to fire words at the AI; fist-catch its tokens to reload | hit +15, catch +5, draining the AI +200; 5 misses end the round |

Consecutive good hits build a combo multiplier (up to x5), and any penalty resets it.

**Prizes:** the tiers (default Bronze 150 / Silver 300 / Gold 500 points, prizes Sticker pack / T-shirt / Hoodie) and a
**claim code salt** are set in the menu. Change the salt per event. A score at or above a tier shows the prize and a
code like `S-HFFX` (tier letter + 4 characters).

**Staff: checking a code.** Every code is saved on the kiosk PC. Open the settings (Esc / Space / C) and look in the
**Claims log** under "Games mode" (time, game, score, tier, code). "Copy log as CSV" copies it and "Clear log" empties it.
A code that is not in the log is not valid. Rounds played with no hands detected (keyboard only) show the score but no code.

Backspace returns to the selection screen. With no hands for 20 s the game also goes back there. The game pauses while the
settings screen is open. The selection tiles show each game's best score of the day.

## Settings menu

The settings menu **opens automatically when the page starts**, so the operator can check the mode and words and then
press Save & apply or Close to start. After that, **Esc**, **Space** or **C** (or the gear icon, top right, shown
when the mouse moves) opens it again. Esc also closes it.

- **Display mode** (see above).
- **Games mode:** round length, 3 prize tiers (name, points, prize), claim code salt, claims log.
- **Wave mode:** wave height, wave length, wave speed, choppiness, dot density, number of banners and the two dot colors.
  Banner speed follows the Scroll speed setting.
- **Word list:** one word or phrase per line (commas also work). A blank line starts a new word set.
- **Hand text density**, **background word count** and **scroll speed** sliders.
- **Text gradient** colors (4 stops).

**Save & apply** stores settings in this browser (localStorage) and they survive restarts. **Restore defaults** reloads
the built-in AI-summit vocabulary into the form (then save). Esc closes the menu. Settings are per browser profile,
so set them up on the kiosk PC itself.

## URL options

| Option     | Effect                                         |
|------------|------------------------------------------------|
| `?demo=1`  | Force demo hands (no sensor)                   |
| `?debug=1` | FPS in the status line + yellow bone skeleton  |
| `?mode=rain` | Use this display mode for this page load       |
| `?kiosk=1` | Do not open the settings screen at startup      |

## Tuning

Defaults are in `src/config.js` (the menu overrides some of them): word sets, text gradient, sky colors, the interaction volume (`box`, in mm), silhouette
thickness (`handScale`), word row height, scroll speed, idle timeout and grab threshold.
If hands clip at the screen edges, widen `box.xMin/xMax`. If they look too small, raise `handScale`.

## Files

| File              | Role                                                   |
|-------------------|--------------------------------------------------------|
| `src/leap.js`     | Dependency-free v6 WebSocket client, auto-reconnect    |
| `src/sky.js`      | Gradient, clouds, parallax background words            |
| `src/hands.js`    | Leap mm -> screen projection, silhouette painting      |
| `src/util.js`     | Shared: word sets, fist -> next set, gradients, word-filled silhouette layer, mode registry |
| `src/modes/*.js`  | One file per display mode (`resize`, `update`, `draw`) |
| `src/games-log.js`| Claims log + today's best scores (localStorage)          |
| `src/demo.js`     | Synthetic hands for attract mode                       |
| `src/menu.js`     | Settings menu (C key), localStorage persistence         |
| `src/main.js`     | Render loop, demo switching, status                    |
| `tools/mock-leap.js` | Fake sensor for testing (`npm i ws && node tools/mock-leap.js`) |
