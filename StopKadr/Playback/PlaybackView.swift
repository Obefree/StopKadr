import SwiftUI

struct PlaybackView: View {
    @ObservedObject var viewModel: PlaybackViewModel
    let onClose: () -> Void

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if let image = viewModel.currentImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
            } else {
                Text("No frames")
                    .foregroundStyle(.secondary)
            }

            VStack {
                HStack {
                    Button("Close", action: onClose)
                        .foregroundStyle(.white)
                    Spacer()
                    Button(viewModel.isPlaying ? "Pause" : "Play") {
                        viewModel.togglePlay()
                    }
                    .foregroundStyle(.white)
                }
                .padding()

                Spacer()

                if viewModel.frameCount > 0 {
                    Slider(
                        value: Binding(
                            get: { Double(viewModel.currentExpandedIndex) },
                            set: { viewModel.scrub(to: Int($0.rounded())) }
                        ),
                        in: 0...Double(max(0, viewModel.frameCount - 1)),
                        step: 1
                    )
                    .padding()
                }
            }
        }
    }
}
