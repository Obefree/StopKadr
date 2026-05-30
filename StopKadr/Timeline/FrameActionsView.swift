import SwiftUI

struct FrameActionsView: View {
    let hasFrames: Bool
    let onDeleteLast: () -> Void
    let onDeleteSelected: () -> Void
    let onReshootLast: () -> Void
    let selectedHoldFrames: Int?
    let onHoldChange: (Int) -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button("Undo", action: onDeleteLast)
                .disabled(!hasFrames)
            Button("Delete", action: onDeleteSelected)
                .disabled(selectedHoldFrames == nil)
            Button("Reshoot", action: onReshootLast)
                .disabled(!hasFrames)
            if selectedHoldFrames != nil {
                Stepper("Hold \(selectedHoldFrames ?? 1)", value: Binding(
                    get: { selectedHoldFrames ?? 1 },
                    set: onHoldChange
                ), in: 1...120)
                    .labelsHidden()
            }
        }
        .font(.caption)
        .buttonStyle(.bordered)
        .tint(.white)
    }
}
