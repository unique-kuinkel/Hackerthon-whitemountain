# FAIRPRICE NEPAL - Build & Execution Log

## System Overview
- **Monorepo Manager**: `pnpm` workspace
- **Web App**: Next.js 15 App Router (`apps/web`)
- **Mobile App**: Expo SDK 51 + React Native (`apps/mobile`)
- **Shared Core**: `@fairprice/shared` (`packages/shared`)
- **AI Vision Pipeline**: Gemini Multimodal Vision API (`@google/genai` using `gemini-2.5-flash`)

---

## Real Direct Camera Capture System

### 1. Web Camera Component (`apps/web/src/components/camera/DirectCameraCapture.tsx`)
- **Live Stream**: Browser `navigator.mediaDevices.getUserMedia()` with `facingMode: { ideal: "environment" }` (prefers rear camera on mobile devices).
- **Camera Switching**: `[ 🔄 Switch Camera ]` toggle between `environment` and `user` cameras.
- **Scanning Guidance Box**: Overlay frame instructing `"Align item inside frame"`.
- **Frame Capture**: Captures `<video>` frame to HTML5 `<canvas>`, converts to JPEG Blob, generates File object (`image/jpeg`, 85% quality).
- **Photo Preview & Retake**: Photo preview state with `[ Retake ]` and `[ Use Photo ]`.
- **Automatic Track Cleanup**: Stops all `MediaStreamTrack` instances immediately upon unmount, cancel, retake, or submit.
- **Permission & Support Fallback**:
  - Explicit user interaction trigger (`Open Camera` button).
  - Permission denied message with `[ Try Again ]` and `[ Upload Image Instead ]`.
  - Unsupported browser fallback with `[ Upload Image Instead ]`.

### 2. Single Shared Backend Pipeline Integration
- Both Camera Capture and Image Upload convert image data to File/Data URL and submit to the **EXACT SAME** `POST /api/scan` endpoint.
- Produces identical result UI, status metrics, and source links.

---

## Final Validation Results

| Test Suite / Build Check | Command | Status |
| :--- | :--- | :--- |
| **Shared Unit Tests** | `pnpm --filter @fairprice/shared test` | **PASSED** (14/14 tests) |
| **Web Unit Tests** | `pnpm --filter @fairprice/web test` | **PASSED** (6/6 tests) |
| **Monorepo Typecheck** | `pnpm typecheck` | **PASSED** (0 TypeScript errors) |
| **Next.js Production Build** | `pnpm build` | **PASSED** |
