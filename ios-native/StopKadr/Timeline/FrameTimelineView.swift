import SwiftUI

struct FrameTimelineView: View {
    let project: StopMotionProject
    let store: ProjectStore
    @Binding var selectedFrameID: UUID?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(project.sortedFrames) { frame in
                    FrameThumbnailView(
                        image: store.loadImage(for: project, frame: frame),
                        index: frame.index,
                        isSelected: selectedFrameID == frame.id
                    )
                    .onTapGesture {
                        selectedFrameID = frame.id
                    }
                }
            }
            .padding(.horizontal, 12)
        }
        .frame(height: 80)
    }
}
