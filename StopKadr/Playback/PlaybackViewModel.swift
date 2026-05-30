import SwiftUI
import UIKit

@MainActor
final class PlaybackViewModel: ObservableObject {
    @Published var isPlaying = false
    @Published var currentExpandedIndex = 0

    private var expandedURLs: [URL] = []
    private var timer: Timer?
    private var fps: Double = 12

    var currentImage: UIImage? {
        guard expandedURLs.indices.contains(currentExpandedIndex) else { return nil }
        return UIImage(contentsOfFile: expandedURLs[currentExpandedIndex].path)
    }

    var frameCount: Int { expandedURLs.count }

    func load(project: StopMotionProject, store: ProjectStore) {
        stop()
        expandedURLs = VideoExporter.expandedFrameURLs(project: project, store: store)
        fps = max(1, project.settings.fps)
        currentExpandedIndex = 0
    }

    func togglePlay() {
        isPlaying ? pause() : play()
    }

    func play() {
        guard !expandedURLs.isEmpty else { return }
        isPlaying = true
        scheduleNextTick()
    }

    func pause() {
        isPlaying = false
        timer?.invalidate()
        timer = nil
    }

    func stop() {
        pause()
        currentExpandedIndex = 0
    }

    func scrub(to index: Int) {
        currentExpandedIndex = min(max(0, index), max(0, expandedURLs.count - 1))
    }

    private func scheduleNextTick() {
        timer?.invalidate()
        let interval = 1.0 / max(1, fps)
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) { [weak self] _ in
            Task { @MainActor in
                self?.advance()
            }
        }
    }

    private func advance() {
        guard isPlaying, !expandedURLs.isEmpty else { return }
        if currentExpandedIndex + 1 < expandedURLs.count {
            currentExpandedIndex += 1
        } else {
            currentExpandedIndex = 0
        }
        scheduleNextTick()
    }

    deinit {
        timer?.invalidate()
    }
}
