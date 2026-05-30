import Foundation

struct ProjectSettings: Codable, Equatable {
    var fps: Double
    var onionSkinOpacity: Double
    var captureDelaySeconds: Double
    var resolution: ExportResolution
    var showGrid: Bool
    var gridDivisions: Int
    var lockFocus: Bool
    var lockExposure: Bool
    var lockWhiteBalance: Bool

    static let `default` = ProjectSettings(
        fps: 12,
        onionSkinOpacity: 0.4,
        captureDelaySeconds: 0,
        resolution: .fullHD1080,
        showGrid: true,
        gridDivisions: 3,
        lockFocus: false,
        lockExposure: false,
        lockWhiteBalance: false
    )
}
