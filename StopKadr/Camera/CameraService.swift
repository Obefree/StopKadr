import AVFoundation
import UIKit

final class CameraService: NSObject {
    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "com.stopkadr.camera.session")
    private var videoDeviceInput: AVCaptureDeviceInput?
    private var captureCompletion: ((Result<Data, Error>) -> Void)?

    private(set) var isConfigured = false

    var availableCameras: [AVCaptureDevice] {
        AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInWideAngleCamera, .builtInUltraWideCamera, .builtInTelephotoCamera],
            mediaType: .video,
            position: .unspecified
        ).devices
    }

    func configure() {
        sessionQueue.async { [weak self] in
            self?.configureSession()
        }
    }

    func start() {
        sessionQueue.async { [weak self] in
            guard let self, !self.session.isRunning else { return }
            self.session.startRunning()
        }
    }

    func stop() {
        sessionQueue.async { [weak self] in
            guard let self, self.session.isRunning else { return }
            self.session.stopRunning()
        }
    }

    func switchCamera(to device: AVCaptureDevice) {
        sessionQueue.async { [weak self] in
            self?.switchInput(to: device)
        }
    }

    func capturePhoto() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            let settings = AVCapturePhotoSettings()
            if self.photoOutput.availablePhotoCodecTypes.contains(.jpeg) {
                settings.flashMode = .off
            }
            self.photoOutput.capturePhoto(with: settings, delegate: self)
        }
    }

    func setFocus(at point: CGPoint, in previewBounds: CGRect) {
        guard let device = videoDeviceInput?.device else { return }
        let focusPoint = CGPoint(
            x: point.y / previewBounds.height,
            y: 1.0 - point.x / previewBounds.width
        )
        sessionQueue.async {
            do {
                try device.lockForConfiguration()
                if device.isFocusPointOfInterestSupported {
                    device.focusPointOfInterest = focusPoint
                    device.focusMode = .autoFocus
                }
                if device.isExposurePointOfInterestSupported {
                    device.exposurePointOfInterest = focusPoint
                    device.exposureMode = .autoExpose
                }
                device.unlockForConfiguration()
            } catch {}
        }
    }

    func setLocks(focus: Bool, exposure: Bool, whiteBalance: Bool) {
        guard let device = videoDeviceInput?.device else { return }
        sessionQueue.async {
            do {
                try device.lockForConfiguration()
                if device.isFocusModeSupported(focus ? .locked : .continuousAutoFocus) {
                    device.focusMode = focus ? .locked : .continuousAutoFocus
                }
                if device.isExposureModeSupported(exposure ? .locked : .continuousAutoExposure) {
                    device.exposureMode = exposure ? .locked : .continuousAutoExposure
                }
                if device.isWhiteBalanceModeSupported(whiteBalance ? .locked : .continuousAutoWhiteBalance) {
                    device.whiteBalanceMode = whiteBalance ? .locked : .continuousAutoWhiteBalance
                }
                device.unlockForConfiguration()
            } catch {}
        }
    }

    private func configureSession() {
        session.beginConfiguration()
        session.sessionPreset = .photo

        for input in session.inputs {
            session.removeInput(input)
        }
        for output in session.outputs where output !== photoOutput {
            session.removeOutput(output)
        }

        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: camera),
              session.canAddInput(input) else {
            session.commitConfiguration()
            return
        }

        session.addInput(input)
        videoDeviceInput = input

        if session.canAddOutput(photoOutput) {
            session.addOutput(photoOutput)
            photoOutput.isHighResolutionCaptureEnabled = true
        }

        session.commitConfiguration()
        isConfigured = true
    }

    private func switchInput(to device: AVCaptureDevice) {
        session.beginConfiguration()
        if let current = videoDeviceInput {
            session.removeInput(current)
        }
        guard let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else {
            session.commitConfiguration()
            return
        }
        session.addInput(input)
        videoDeviceInput = input
        session.commitConfiguration()
    }

    func capturePhoto(completion: @escaping (Result<Data, Error>) -> Void) {
        captureCompletion = completion
        capturePhoto()
    }
}

extension CameraService: AVCapturePhotoCaptureDelegate {
    func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        if let error {
            captureCompletion?(.failure(error))
            captureCompletion = nil
            return
        }
        guard let data = photo.fileDataRepresentation() else {
            captureCompletion?(.failure(CameraError.noImageData))
            captureCompletion = nil
            return
        }
        captureCompletion?(.success(data))
        captureCompletion = nil
    }
}

enum CameraError: LocalizedError {
    case noImageData
    case permissionDenied

    var errorDescription: String? {
        switch self {
        case .noImageData: return "Could not read captured photo."
        case .permissionDenied: return "Camera access is required to shoot frames."
        }
    }
}
