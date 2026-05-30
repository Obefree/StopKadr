import SwiftUI

struct FPSControl: View {
    @Binding var fps: Double

    private let presets: [Double] = [6, 8, 12, 15, 24, 30]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("FPS \(fps.formatted(.number.precision(.fractionLength(1))))")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
            HStack(spacing: 6) {
                ForEach(presets, id: \.self) { preset in
                    Button(String(format: "%.0f", preset)) {
                        fps = preset
                    }
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(fps == preset ? Color.white.opacity(0.25) : Color.white.opacity(0.08))
                    .clipShape(Capsule())
                }
            }
            Slider(value: $fps, in: 1...60, step: 0.5)
                .tint(.cyan)
        }
    }
}
