import Foundation

struct FrameItem: Identifiable, Codable, Equatable {
    let id: UUID
    var index: Int
    var imagePath: String
    var createdAt: Date
    var holdFrames: Int

    init(
        id: UUID = UUID(),
        index: Int,
        imagePath: String,
        createdAt: Date = Date(),
        holdFrames: Int = 1
    ) {
        self.id = id
        self.index = index
        self.imagePath = imagePath
        self.createdAt = createdAt
        self.holdFrames = max(1, holdFrames)
    }
}
