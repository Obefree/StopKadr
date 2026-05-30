import SwiftUI

struct CameraGridOverlay: View {
    let divisions: Int

    var body: some View {
        GeometryReader { geo in
            let cols = max(1, divisions)
            let rows = max(1, divisions)
            Path { path in
                let w = geo.size.width
                let h = geo.size.height
                for i in 1..<cols {
                    let x = w * CGFloat(i) / CGFloat(cols)
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: h))
                }
                for i in 1..<rows {
                    let y = h * CGFloat(i) / CGFloat(rows)
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: w, y: y))
                }
            }
            .stroke(Color.white.opacity(0.35), lineWidth: 0.5)
        }
        .allowsHitTesting(false)
    }
}
