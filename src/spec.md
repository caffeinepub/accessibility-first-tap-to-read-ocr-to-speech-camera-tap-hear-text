# Specification

## Summary
**Goal:** Make the live camera preview start reliably on first load and after returning to the app, with clear fallback and actionable error states.

**Planned changes:**
- Improve the camera start flow to more consistently reach a playable preview on initial load, including at least one automatic retry when startup stalls.
- Add a full-screen, accessible “Tap to start camera” user-gesture fallback when the camera does not become active within a short timeout.
- Add clear, English, actionable error UI for common camera failures (permission denied, insecure context/HTTP, no camera device, camera already in use), including accessible announcements and a Retry action without requiring a page refresh.

**User-visible outcome:** The camera preview appears consistently within a couple seconds when permissions are granted; if it doesn’t, users get a prominent “Tap to start camera” option, and any failures show clear guidance with a retry path instead of an endless loading state.
