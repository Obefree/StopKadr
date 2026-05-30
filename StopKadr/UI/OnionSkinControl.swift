import SwiftUI

struct OnionSkinControl: View {
    @Binding var opacity: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Onion \(Int(opacity * 100))%")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
            Slider(value: $opacity, in: 0...1)
                .tint(.yellow)
        }
        .frame(maxWidth: 140)
    }
}
