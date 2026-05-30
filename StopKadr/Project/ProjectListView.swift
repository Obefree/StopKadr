import SwiftUI

struct ProjectListView: View {
    @EnvironmentObject private var store: ProjectStore
    @State private var showNewProject = false

    var body: some View {
        NavigationStack {
            Group {
                if store.projects.isEmpty {
                    ContentUnavailableView(
                        "No projects",
                        systemImage: "film.stack",
                        description: Text("Create a stop motion project to start shooting.")
                    )
                } else {
                    List {
                        ForEach(store.projects) { project in
                            NavigationLink {
                                ProjectEditorView(project: project)
                            } label: {
                                ProjectRowView(project: project, thumbnail: store.thumbnail(for: project))
                            }
                        }
                        .onDelete(perform: deleteProjects)
                    }
                }
            }
            .navigationTitle("StopKadr")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showNewProject = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showNewProject) {
                NewProjectView { title in
                    _ = store.createProject(title: title)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private func deleteProjects(at offsets: IndexSet) {
        for index in offsets {
            store.deleteProject(store.projects[index])
        }
    }
}

private struct ProjectRowView: View {
    let project: StopMotionProject
    let thumbnail: UIImage?

    var body: some View {
        HStack(spacing: 12) {
            Group {
                if let thumbnail {
                    Image(uiImage: thumbnail)
                        .resizable()
                        .scaledToFill()
                } else {
                    Color.gray.opacity(0.25)
                        .overlay(Image(systemName: "camera").foregroundStyle(.secondary))
                }
            }
            .frame(width: 56, height: 56)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                Text(project.title)
                    .font(.headline)
                Text("\(project.frames.count) frames")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(project.updatedAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}
