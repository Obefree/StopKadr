import Foundation
import UIKit

@MainActor
final class ProjectStore: ObservableObject {
    @Published private(set) var projects: [StopMotionProject] = []

    private let fileManager = FileManager.default
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        e.outputFormatting = [.prettyPrinted, .sortedKeys]
        return e
    }()
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    var rootDirectory: URL {
        let docs = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("StopKadr/Projects", isDirectory: true)
    }

    init() {
        createRootIfNeeded()
        loadAll()
    }

    func createRootIfNeeded() {
        try? fileManager.createDirectory(at: rootDirectory, withIntermediateDirectories: true)
    }

    func projectDirectory(for project: StopMotionProject) -> URL {
        rootDirectory.appendingPathComponent(project.id.uuidString, isDirectory: true)
    }

    func framesDirectory(for project: StopMotionProject) -> URL {
        projectDirectory(for: project).appendingPathComponent("frames", isDirectory: true)
    }

    func projectJSONURL(for project: StopMotionProject) -> URL {
        projectDirectory(for: project).appendingPathComponent("project.json")
    }

    func loadAll() {
        createRootIfNeeded()
        guard let ids = try? fileManager.contentsOfDirectory(
            at: rootDirectory,
            includingPropertiesForKeys: nil
        ) else {
            projects = []
            return
        }

        var loaded: [StopMotionProject] = []
        for folder in ids where folder.hasDirectoryPath {
            let jsonURL = folder.appendingPathComponent("project.json")
            guard fileManager.fileExists(atPath: jsonURL.path),
                  let data = try? Data(contentsOf: jsonURL),
                  let project = try? decoder.decode(StopMotionProject.self, from: data) else {
                continue
            }
            loaded.append(project)
        }
        projects = loaded.sorted { $0.updatedAt > $1.updatedAt }
    }

    @discardableResult
    func createProject(title: String) -> StopMotionProject {
        let project = StopMotionProject(title: title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Untitled" : title)
        try? fileManager.createDirectory(at: projectDirectory(for: project), withIntermediateDirectories: true)
        try? fileManager.createDirectory(at: framesDirectory(for: project), withIntermediateDirectories: true)
        save(project)
        projects.insert(project, at: 0)
        return project
    }

    func save(_ project: StopMotionProject) {
        var updated = project
        updated.updatedAt = Date()
        createRootIfNeeded()
        try? fileManager.createDirectory(at: projectDirectory(for: updated), withIntermediateDirectories: true)
        try? fileManager.createDirectory(at: framesDirectory(for: updated), withIntermediateDirectories: true)
        if let data = try? encoder.encode(updated) {
            try? data.write(to: projectJSONURL(for: updated), options: .atomic)
        }
        if let index = projects.firstIndex(where: { $0.id == updated.id }) {
            projects[index] = updated
        } else {
            projects.insert(updated, at: 0)
        }
        projects.sort { $0.updatedAt > $1.updatedAt }
    }

    func deleteProject(_ project: StopMotionProject) {
        let dir = projectDirectory(for: project)
        try? fileManager.removeItem(at: dir)
        projects.removeAll { $0.id == project.id }
    }

    func imageURL(for project: StopMotionProject, frame: FrameItem) -> URL {
        framesDirectory(for: project).appendingPathComponent(frame.imagePath)
    }

    func loadImage(for project: StopMotionProject, frame: FrameItem) -> UIImage? {
        let url = imageURL(for: project, frame: frame)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return UIImage(data: data)
    }

    func nextFrameFileName(for project: StopMotionProject) -> String {
        let nextIndex = (project.sortedFrames.last?.index ?? 0) + 1
        return String(format: "%06d.jpg", nextIndex)
    }

    @discardableResult
    func addFrame(to project: StopMotionProject, imageData: Data) throws -> StopMotionProject {
        var project = project
        let fileName = nextFrameFileName(for: project)
        let fileURL = framesDirectory(for: project).appendingPathComponent(fileName)
        try fileManager.createDirectory(at: framesDirectory(for: project), withIntermediateDirectories: true)
        try imageData.write(to: fileURL, options: .atomic)

        let index = (project.sortedFrames.last?.index ?? 0) + 1
        let frame = FrameItem(index: index, imagePath: fileName)
        project.frames.append(frame)
        save(project)
        return project
    }

    func deleteLastFrame(in project: StopMotionProject) -> StopMotionProject {
        guard let last = project.sortedFrames.last else { return project }
        return deleteFrame(last, from: project)
    }

    func deleteFrame(_ frame: FrameItem, from project: StopMotionProject) -> StopMotionProject {
        var project = project
        let url = imageURL(for: project, frame: frame)
        try? fileManager.removeItem(at: url)
        project.frames.removeAll { $0.id == frame.id }
        save(project)
        return project
    }

    func replaceLastFrame(in project: StopMotionProject, imageData: Data) throws -> StopMotionProject {
        var project = project
        guard let last = project.sortedFrames.last else {
            return try addFrame(to: project, imageData: imageData)
        }
        let url = imageURL(for: project, frame: last)
        try imageData.write(to: url, options: .atomic)
        save(project)
        return project
    }

    func updateHoldFrames(_ hold: Int, for frame: FrameItem, in project: StopMotionProject) {
        var project = project
        guard let idx = project.frames.firstIndex(where: { $0.id == frame.id }) else { return }
        project.frames[idx].holdFrames = max(1, hold)
        save(project)
    }

    func updateSettings(_ settings: ProjectSettings, for project: StopMotionProject) {
        var project = project
        project.settings = settings
        save(project)
    }

    func thumbnail(for project: StopMotionProject) -> UIImage? {
        guard let last = project.lastFrame else { return nil }
        return loadImage(for: project, frame: last)
    }
}
