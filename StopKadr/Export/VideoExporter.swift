import AVFoundation
import UIKit

enum VideoExportError: LocalizedError {
    case noFrames
    case writerSetupFailed
    case exportFailed

    var errorDescription: String? {
        switch self {
        case .noFrames: return "No frames to export."
        case .writerSetupFailed: return "Could not start video writer."
        case .exportFailed: return "Video export failed."
        }
    }
}

struct VideoExporter {
    static func expandedFrameURLs(
        project: StopMotionProject,
        store: ProjectStore
    ) -> [URL] {
        var urls: [URL] = []
        for frame in project.sortedFrames {
            let url = store.imageURL(for: project, frame: frame)
            for _ in 0..<max(1, frame.holdFrames) {
                urls.append(url)
            }
        }
        return urls
    }

    static func export(
        project: StopMotionProject,
        store: ProjectStore,
        progress: ((Double) -> Void)? = nil
    ) async throws -> URL {
        let frameURLs = expandedFrameURLs(project: project, store: store)
        guard let firstURL = frameURLs.first,
              let firstImage = UIImage(contentsOfFile: firstURL.path),
              let firstCG = firstImage.cgImage else {
            throw VideoExportError.noFrames
        }

        let sourceAspect = CGFloat(firstCG.width) / CGFloat(firstCG.height)
        let fps = max(1, project.settings.fps)
        let targetSize = exportCanvasSize(
            resolution: project.settings.resolution,
            sourceAspect: sourceAspect
        )

        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(project.id.uuidString)-export.mp4")

        if FileManager.default.fileExists(atPath: outputURL.path) {
            try FileManager.default.removeItem(at: outputURL)
        }

        let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
        let settings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: Int(targetSize.width),
            AVVideoHeightKey: Int(targetSize.height)
        ]
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        input.expectsMediaDataInRealTime = false

        let adaptor = AVAssetWriterInputPixelBufferAdaptor(
            assetWriterInput: input,
            sourcePixelBufferAttributes: [
                kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
                kCVPixelBufferWidthKey as String: Int(targetSize.width),
                kCVPixelBufferHeightKey as String: Int(targetSize.height)
            ]
        )

        guard writer.canAdd(input) else { throw VideoExportError.writerSetupFailed }
        writer.add(input)
        guard writer.startWriting() else { throw VideoExportError.writerSetupFailed }
        writer.startSession(atSourceTime: .zero)

        let frameDuration = CMTime(value: 1, timescale: CMTimeScale(fps.rounded()))
        var frameIndex: Int64 = 0

        for (i, url) in frameURLs.enumerated() {
            guard let image = UIImage(contentsOfFile: url.path),
                  let buffer = pixelBuffer(from: image, size: targetSize) else {
                continue
            }
            let presentationTime = CMTimeMultiply(frameDuration, multiplier: Int32(frameIndex))
            while !input.isReadyForMoreMediaData {
                try await Task.sleep(nanoseconds: 5_000_000)
            }
            if !adaptor.append(buffer, withPresentationTime: presentationTime) {
                throw VideoExportError.exportFailed
            }
            frameIndex += 1
            progress?(Double(i + 1) / Double(frameURLs.count))
        }

        input.markAsFinished()
        await writer.finishWriting()
        if writer.status != .completed {
            throw writer.error ?? VideoExportError.exportFailed
        }
        return outputURL
    }

    private static func exportCanvasSize(resolution: ExportResolution, sourceAspect: CGFloat) -> CGSize {
        if let fixed = resolution.exportSize(sourceAspect: sourceAspect) {
            return fixed
        }
        let maxEdge: CGFloat = 1920
        if sourceAspect >= 1 {
            return CGSize(width: maxEdge, height: maxEdge / sourceAspect)
        }
        return CGSize(width: maxEdge * sourceAspect, height: maxEdge)
    }

    private static func pixelBuffer(from image: UIImage, size: CGSize) -> CVPixelBuffer? {
        var buffer: CVPixelBuffer?
        let attrs: [String: Any] = [
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
        ]
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            Int(size.width),
            Int(size.height),
            kCVPixelFormatType_32ARGB,
            attrs as CFDictionary,
            &buffer
        )
        guard status == kCVReturnSuccess, let pixelBuffer = buffer else { return nil }

        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

        guard let context = CGContext(
            data: CVPixelBufferGetBaseAddress(pixelBuffer),
            width: Int(size.width),
            height: Int(size.height),
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        ) else { return nil }

        context.clear(CGRect(origin: .zero, size: size))
        let drawRect = aspectFitRect(imageSize: image.size, in: size)
        if let cg = image.cgImage {
            context.draw(cg, in: drawRect)
        }
        return pixelBuffer
    }

    private static func aspectFitRect(imageSize: CGSize, in canvas: CGSize) -> CGRect {
        let scale = min(canvas.width / imageSize.width, canvas.height / imageSize.height)
        let w = imageSize.width * scale
        let h = imageSize.height * scale
        return CGRect(
            x: (canvas.width - w) / 2,
            y: (canvas.height - h) / 2,
            width: w,
            height: h
        )
    }
}
