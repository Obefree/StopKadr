import SwiftUI

struct FrameThumbnailView: View {
    let image: UIImage?
    let index: Int
    let isSelected: Bool

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Color.gray.opacity(0.3)
                }
            }
            .frame(width: 64, height: 64)
            .clipped()

            Text("\(index)")
                .font(.caption2.bold())
                .padding(4)
                .background(.black.opacity(0.55))
                .foregroundStyle(.white)
        }
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(isSelected ? Color.yellow : Color.clear, lineWidth: 2)
        )
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }
}
