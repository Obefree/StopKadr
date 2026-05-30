# StopKadr

iOS stop motion app (SwiftUI + AVFoundation). Shoot frame-by-frame with live camera preview, onion skin, timeline, playback, and MP4 export.

## Requirements

- macOS with Xcode 15+
- iPhone with iOS 17+ for real camera capture (simulator: UI only, no live camera)

Подробная установка: [docs/INSTALL.ru.md](./docs/INSTALL.ru.md)

## Open & run

1. Open `StopKadr.xcodeproj` in Xcode.
2. Select your **Team** in Signing & Capabilities for target **StopKadr**.
3. Run on a physical iPhone for full camera MVP.

## MVP features

- Project list, create/delete projects
- Local storage: `Documents/StopKadr/Projects/<id>/project.json` + `frames/*.jpg`
- Live `AVCaptureSession` preview (not system camera picker)
- Capture frames, onion skin overlay, timeline
- Flexible `fps` and `captureDelaySeconds` as `Double`
- Playback with `holdFrames`
- Export `.mp4` via `AVAssetWriter` + share sheet

## Spec

See [CURSOR_TASK.md](./CURSOR_TASK.md) for full product and architecture notes.
