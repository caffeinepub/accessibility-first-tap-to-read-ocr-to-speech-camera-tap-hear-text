# Specification

## Summary
**Goal:** Deliver an accessibility-first, single-screen “tap anywhere to capture → on-device OCR → immediate text-to-speech” experience with minimal visual UI and robust screen reader support.

**Planned changes:**
- Build a clutter-free, full-screen live camera view as the initial and primary screen (no menus/toolbars; no tiny tap targets).
- Enable tap-anywhere capture on the camera preview with immediate haptic feedback when supported, and an accessible audio confirmation fallback when not.
- Run OCR automatically on each capture on-device in the client (no sending images/text to any backend; session-only state).
- Automatically read recognized text aloud via in-browser text-to-speech, with audio feedback for capture, processing start, processing complete, and errors/empty results.
- Provide large, screen-reader-friendly playback controls (Pause, Repeat, Speed up, Slow down) that are keyboard/switch accessible and discoverable even if visually hidden.
- Enforce portrait-first behavior; show an accessible rotate-to-portrait prompt in landscape and announce it via screen readers.
- Add accessibility semantics and live announcements for instructions and status updates so the full flow works without vision.
- Apply a calm, high-contrast, minimal visual theme (avoiding blue/purple-dominant styling).

**User-visible outcome:** On opening the app, the user sees a full-screen camera; tapping anywhere captures text, the app announces progress, and then immediately speaks the recognized text aloud with accessible playback controls and a portrait-first experience.
