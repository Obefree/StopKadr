import SwiftUI

struct ProjectEditorView: View {
    @EnvironmentObject private var store: ProjectStore
    @StateObject private var cameraVM = CameraViewModel()
    @StateObject private var playbackVM = PlaybackViewModel()

    @State private var project: StopMotionProject
    @State private var selectedFrameID: UUID?
    @State private var showSettings = false
    @State private var showPlayback = false
    @State private var showShare = false
    @State private var exportURL: URL?
    @State private var exportProgress: Double = 0
    @State private var isExporting = false
    @State private var alertMessage: String?
    @State private var reshootLast = false

    init(project: StopMotionProject) {
        _project = State(initialValue: project)
    }

    private var lastFrameImage: UIImage? {
        guard let last = project.lastFrame else { return nil }
        return store.loadImage(for: project, frame: last)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if cameraVM.permissionStatus == .denied {
                permissionDeniedView
            } else {
                cameraStack
            }

            if isExporting {
                Color.black.opacity(0.6).ignoresSafeArea()
                ExportProgressView(progress: exportProgress, message: "Exporting video…")
            }
        }
        .navigationTitle(project.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button("Play") { openPlayback() }
                    .disabled(project.frames.isEmpty)
                Button("Export") { exportVideo() }
                    .disabled(project.frames.isEmpty)
                Button {
                    showSettings = true
                } label: {
                    Image(systemName: "slider.horizontal.3")
                }
            }
        }
        .sheet(isPresented: $showSettings, onDismiss: syncSettingsToCamera) {
            SettingsPanel(settings: $project.settings)
        }
        .fullScreenCover(isPresented: $showPlayback) {
            PlaybackView(viewModel: playbackVM) {
                showPlayback = false
                playbackVM.stop()
            }
        }
        .sheet(isPresented: $showShare, onDismiss: { exportURL = nil }) {
            if let exportURL {
                ShareSheet(items: [exportURL])
            }
        }
        .alert("StopKadr", isPresented: Binding(
            get: { alertMessage != nil },
            set: { if !$0 { alertMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(alertMessage ?? "")
        }
        .task {
            await cameraVM.prepare()
            cameraVM.applyLocks(from: project.settings)
        }
        .onDisappear {
            cameraVM.stop()
        }
        .onChange(of: project.settings) { _, newValue in
            store.updateSettings(newValue, for: project)
            cameraVM.applyLocks(from: newValue)
        }
    }

    private var permissionDeniedView: some View {
        ContentUnavailableView(
            "Camera access needed",
            systemImage: "camera.fill",
            description: Text("Enable camera in Settings to shoot stop motion frames.")
        )
    }

    private var cameraStack: some View {
        VStack(spacing: 0) {
            ZStack {
                CameraPreviewView(session: cameraVM.cameraService.session)
                    .ignoresSafeArea(edges: .horizontal)

                if let lastFrameImage, project.settings.onionSkinOpacity > 0 {
                    Image(uiImage: lastFrameImage)
                        .resizable()
                        .scaledToFill()
                        .opacity(project.settings.onionSkinOpacity)
                        .allowsHitTesting(false)
                }

                if project.settings.showGrid {
                    CameraGridOverlay(divisions: project.settings.gridDivisions)
                }

                VStack {
                    HStack(alignment: .top) {
                        OnionSkinControl(opacity: $project.settings.onionSkinOpacity)
                        Spacer()
                        VStack(alignment: .trailing) {
                            Text("Delay \(project.settings.captureDelaySeconds.formatted(.number.precision(.fractionLength(1))))s")
                                .font(.caption2)
                                .foregroundStyle(.white.opacity(0.8))
                            Slider(
                                value: $project.settings.captureDelaySeconds,
                                in: 0...10,
                                step: 0.1
                            )
                            .frame(width: 120)
                        }
                    }
                    .padding()
                    Spacer()
                }
            }
            .aspectRatio(9 / 16, contentMode: .fit)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onEnded { value in
                        let tap = value.location
                        cameraVM.focus(at: tap, in: CGRect(origin: .zero, size: CGSize(width: 400, height: 700)))
                    }
            )

            FrameActionsView(
                hasFrames: !project.frames.isEmpty,
                onDeleteLast: deleteLast,
                onDeleteSelected: deleteSelected,
                onReshootLast: { reshootLast = true },
                selectedHoldFrames: selectedFrame.map(\.holdFrames),
                onHoldChange: { hold in
                    guard let frame = selectedFrame else { return }
                    store.updateHoldFrames(hold, for: frame, in: project)
                    reloadProject()
                }
            )
            .padding(.horizontal)

            FrameTimelineView(
                project: project,
                store: store,
                selectedFrameID: $selectedFrameID
            )

            FPSControl(fps: $project.settings.fps)
                .padding(.horizontal)
                .padding(.bottom, 8)

            CaptureButton(isCapturing: cameraVM.isCapturing) {
                Task { await captureFrame() }
            }
            .padding(.bottom, 16)
        }
    }

    private var selectedFrame: FrameItem? {
        guard let id = selectedFrameID else { return nil }
        return project.frames.first { $0.id == id }
    }

    private func reloadProject() {
        if let updated = store.projects.first(where: { $0.id == project.id }) {
            project = updated
        }
    }

    private func syncSettingsToCamera() {
        store.updateSettings(project.settings, for: project)
        cameraVM.applyLocks(from: project.settings)
        reloadProject()
    }

    private func captureFrame() async {
        do {
            let data = try await cameraVM.capture(afterDelay: project.settings.captureDelaySeconds)
            if reshootLast {
                project = try store.replaceLastFrame(in: project, imageData: data)
                reshootLast = false
            } else {
                project = try store.addFrame(to: project, imageData: data)
            }
            reloadProject()
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func deleteLast() {
        project = store.deleteLastFrame(in: project)
        reloadProject()
    }

    private func deleteSelected() {
        guard let frame = selectedFrame else { return }
        project = store.deleteFrame(frame, from: project)
        selectedFrameID = nil
        reloadProject()
    }

    private func openPlayback() {
        playbackVM.load(project: project, store: store)
        showPlayback = true
        playbackVM.play()
    }

    private func exportVideo() {
        isExporting = true
        exportProgress = 0
        Task {
            do {
                let url = try await VideoExporter.export(project: project, store: store) { p in
                    exportProgress = p
                }
                exportURL = url
                showShare = true
            } catch {
                alertMessage = error.localizedDescription
            }
            isExporting = false
        }
    }
}
