# Caveman lessons

- LM-010 (original Leap Motion) = hands only, 10-80 cm range. It can never see bodies or silhouettes of people. For bodies, use a webcam + segmentation or a depth camera.
- Browser access to the LM-010 needs the Orion 4.x service (built-in WebSocket at ws://127.0.0.1:6437, protocol v6) with "Allow Web Apps" on. Gemini v5+ has no WebSocket, so it needs the UltraleapTrackingWebSocket bridge.
- Chrome blocks ES modules over file://. Kiosk pages meant to open by double-click use classic `<script>` tags.
