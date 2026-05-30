import SwiftUI

struct SettingsPanel: View {
    @Binding var settings: ProjectSettings
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Timing") {
                    FPSControl(fps: $settings.fps)
                    VStack(alignment: .leading) {
                        Text("Capture delay (sec)")
                        Slider(value: $settings.captureDelaySeconds, in: 0...30, step: 0.1)
                        Text(settings.captureDelaySeconds.formatted(.number.precision(.fractionLength(1))))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Section("Onion skin") {
                    OnionSkinControl(opacity: $settings.onionSkinOpacity)
                }
                Section("Camera") {
                    Toggle("Grid", isOn: $settings.showGrid)
                    Stepper("Grid divisions: \(settings.gridDivisions)", value: $settings.gridDivisions, in: 2...6)
                    Toggle("Lock focus", isOn: $settings.lockFocus)
                    Toggle("Lock exposure", isOn: $settings.lockExposure)
                    Toggle("Lock white balance", isOn: $settings.lockWhiteBalance)
                }
                Section("Export") {
                    Picker("Resolution", selection: $settings.resolution) {
                        ForEach(ExportResolution.allCases) { res in
                            Text(res.displayName).tag(res)
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
