import Foundation

struct StopMotionProject: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date
    var settings: ProjectSettings
    var frames: [FrameItem]

    init(
        id: UUID = UUID(),
        title: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        settings: ProjectSettings = .default,
        frames: [FrameItem] = []
    ) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.settings = settings
        self.frames = frames
    }

    var sortedFrames: [FrameItem] {
        frames.sorted { $0.index < $1.index }
    }

    var lastFrame: FrameItem? {
        sortedFrames.last
    }
}
