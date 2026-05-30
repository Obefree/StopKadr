import Foundation
import CoreGraphics

enum ExportResolution: String, Codable, CaseIterable, Identifiable {
    case hd720
    case fullHD1080
    case vertical1080x1920
    case square1080
    case originalAspect

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .hd720: return "720p"
        case .fullHD1080: return "1080p"
        case .vertical1080x1920: return "1080×1920"
        case .square1080: return "1080×1080"
        case .originalAspect: return "Original"
        }
    }

    func exportSize(sourceAspect: CGFloat) -> CGSize? {
        switch self {
        case .hd720:
            return CGSize(width: 1280, height: 720)
        case .fullHD1080:
            return CGSize(width: 1920, height: 1080)
        case .vertical1080x1920:
            return CGSize(width: 1080, height: 1920)
        case .square1080:
            return CGSize(width: 1080, height: 1080)
        case .originalAspect:
            return nil
        }
    }
}
