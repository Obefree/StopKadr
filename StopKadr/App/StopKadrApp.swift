import SwiftUI

@main
struct StopKadrApp: App {
    @StateObject private var projectStore = ProjectStore()

    var body: some Scene {
        WindowGroup {
            ProjectListView()
                .environmentObject(projectStore)
        }
    }
}
