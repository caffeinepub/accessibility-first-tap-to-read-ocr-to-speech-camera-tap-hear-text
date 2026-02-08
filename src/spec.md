# Specification

## Summary
**Goal:** Fix the camera permission/startup flow so granting camera access reliably results in a live preview, with accurate permission-state messaging and clear recovery paths when startup/preview fails.

**Planned changes:**
- Update camera startup flow to transition from “Starting Camera / Please allow camera access” to an active preview after permission is granted, and avoid stale permission-required messaging.
- Improve permission-state detection and UI messaging to distinguish: not yet requested, denied/blocked, and granted-but-stream/preview failed; provide actionable English messages with Retry where appropriate.
- Add a blank-preview watchdog that detects when the stream is “active” but the video never renders frames, performs one controlled automatic restart, and then shows a “Camera Error” state with Retry if still blank.
- Ensure the manual full-screen “Start Camera” fallback appears when startup fails silently after permission is granted, and that tapping it reliably triggers a fresh start attempt and resolves to preview or a clear error (not indefinite loading).

**User-visible outcome:** After granting camera permission, users see a live camera preview within a few seconds on supported devices; if the camera can’t start or the preview is blank, the app shows correct, actionable messages and provides Retry and/or a reliable manual “Start Camera” fallback.
