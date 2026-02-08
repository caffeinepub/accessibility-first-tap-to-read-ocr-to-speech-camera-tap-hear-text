# Specification

## Summary
**Goal:** Make the live camera preview reliably start on supported devices/browsers, with a dependable manual-start fallback and clear, actionable error guidance when startup fails.

**Planned changes:**
- Fix the camera startup flow so the preview transitions from “Starting Camera...” to a live video feed on initial load (when getUserMedia is supported and the page is in a secure context).
- Add/adjust timeout and state handling so automatic startup failures never remain stuck on a loading screen, instead moving to the manual “Start Camera” fallback or a clear error state.
- Ensure the manual user-gesture “Start Camera” fallback is consistently shown when automatic startup doesn’t complete promptly and successfully starts the camera when tapped.
- Prevent infinite retry loops by providing bounded retry behavior and an always-actionable next step (Start Camera / Retry Camera Access / specific error message).
- Improve error detection and messaging (English only) for common failure cases (HTTPS required, permission denied, camera in use, no camera found) and provide a working “Retry Camera Access” action where appropriate.
- Attempt to resume the camera when returning to the app/tab (visibilitychange to visible) if permissions/devices are available.

**User-visible outcome:** On supported HTTPS pages, the camera preview starts without needing a reload; if it can’t start automatically, the app quickly shows a clear “Start Camera” fallback or a specific error message with a working retry option.
