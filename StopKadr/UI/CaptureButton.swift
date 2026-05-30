import SwiftUI

struct CaptureButton: View {
    let isCapturing: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .strokeBorder(Color.white, lineWidth: 4)
                    .frame(width: 76, height: 76)
                Circle()
                    .fill(isCapturing ? Color.gray : Color.white)
                    .frame(width: 62, height: 62)
            }
        }
        .disabled(isCapturing)
        .accessibilityLabel("Capture frame")
    }
}
