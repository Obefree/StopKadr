import AVFoundation
import SwiftUI

@MainActor
final class CameraViewModel: ObservableObject {
    @Published var permissionStatus: CameraPermissionStatus = CameraPermissionManager.currentStatus()
    @Published var isCapturing = false
    @Published var errorMessage: String?

    let cameraService = CameraService()

    func prepare() async {
        if permissionStatus == .notDetermined {
            let granted = await CameraPermissionManager.requestAccess()
            permissionStatus = granted ? .authorized : .denied
        }
        guard permissionStatus == .authorized else { return }
        cameraService.configure()
        cameraService.start()
    }

    func stop() {
        cameraService.stop()
    }

    func applyLocks(from settings: ProjectSettings) {
        cameraService.setLocks(
            focus: settings.lockFocus,
            exposure: settings.lockExposure,
            whiteBalance: settings.lockWhiteBalance
        )
    }

    func focus(at point: CGPoint, in bounds: CGRect) {
        cameraService.setFocus(at: point, in: previewBounds: bounds)
    }

    func capture(afterDelay seconds: Double) async throws -> Data {
        if seconds > 0 {
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
        }
        isCapturing = true
        defer { isCapturing = false }

        return try await withCheckedThrowingContinuation { continuation in
            cameraService.capturePhoto { result in
                continuation.resume(with: result)
            }
        }
    }
}
