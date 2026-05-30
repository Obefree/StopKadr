import SwiftUI

struct ExportProgressView: View {
    let progress: Double
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            ProgressView(value: progress)
            Text(message)
                .font(.subheadline)
        }
        .padding(24)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding()
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
