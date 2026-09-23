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
- **Interaction.** Moving faster scrolls the words faster. A fist (grab) switches the word set (dev, security,
  languages, emerging tech) with a flash. A pinch brightens the words.
- **Attract mode.** With no hands for 5 s, or no sensor, animated demo hands play with the hint text.

## Windows setup

1. Install **Leap Motion Orion 4.1.0** (Windows). It is the last release with the built-in WebSocket server
   needed by browsers. Newer Ultraleap Gemini (v5+) has no WebSocket. If only Gemini is available, run
   Ultraleap's `UltraleapTrackingWebSocket` bridge, which serves the same port and protocol.
2. Leap Control Panel -> General -> check **Allow Web Apps** (and "Allow Background Apps").
3. Plug in the LM-010 with the green LED facing the visitor, lens facing up.
4. Launch:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --app="file:///C:/WordHands/index.html"
   ```
   For autostart, put that shortcut in `shell:startup`. Disable Windows sleep and screen saver.

No build step and no internet access needed. The page is plain HTML with classic scripts, so it works from `file://`.

## URL options

| Option     | Effect                                         |
|------------|------------------------------------------------|
| `?demo=1`  | Force demo hands (no sensor)                   |
| `?debug=1` | FPS in the status line + yellow bone skeleton  |

## Tuning

All settings are in `src/config.js`: word sets, sky colors, the interaction volume (`box`, in mm), silhouette
thickness (`handScale`), word row height, scroll speed, idle timeout and grab threshold.
If hands clip at the screen edges, widen `box.xMin/xMax`. If they look too small, raise `handScale`.

## Files

| File              | Role                                                   |
|-------------------|--------------------------------------------------------|
| `src/leap.js`     | Dependency-free v6 WebSocket client, auto-reconnect    |
| `src/sky.js`      | Gradient, clouds, parallax background words            |
| `src/hands.js`    | Leap mm -> screen projection, silhouette painting      |
| `src/fill.js`     | Scrolling word rows clipped to silhouettes, glow       |
| `src/demo.js`     | Synthetic hands for attract mode                       |
| `src/main.js`     | Render loop, demo switching, status                    |
| `tools/mock-leap.js` | Fake sensor for testing (`npm i ws && node tools/mock-leap.js`) |
